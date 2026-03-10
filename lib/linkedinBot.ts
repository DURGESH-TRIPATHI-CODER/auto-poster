import { chromium } from "playwright";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface LinkedInArgs {
  content: string;
  imageUrl?: string | null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDecodedStorage(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) throw new Error(`Storage state file is empty: ${filePath}`);
  if (raw.startsWith("{")) return;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    if (!decoded.trim().startsWith("{")) {
      throw new Error("decoded content is not JSON");
    }
    fs.writeFileSync(filePath, decoded);
  } catch (err) {
    throw new Error(`Storage state not valid JSON or base64: ${filePath}`);
  }
}

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop() ?? "jpg";
  const tmpPath = path.join(os.tmpdir(), `narada-li-${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

export async function postToLinkedIn({ content, imageUrl }: LinkedInArgs): Promise<string | undefined> {
  ensureDecodedStorage(".sessions/linkedin.json");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    storageState: ".sessions/linkedin.json",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });

  const page = await context.newPage();
  let tmpFile: string | null = null;

  try {
    // Go straight to feed with shareActive flag to reduce homepage noise
    await page.goto("https://www.linkedin.com/feed/?shareActive=true", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(1800);

    if (page.url().includes("/login") || page.url().includes("/authwall")) {
      throw new Error("LinkedIn session expired — re-run loginLinkedIn.ts and update LINKEDIN_SESSION secret.");
    }

    // If modal isn't already up, click "Start a post"
    let modal = page.locator("[data-test-modal-id='sharebox'], .share-box-home-v2").first();
    const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    if (!modalVisible) {
      const startPostButton = page
        .locator("button:has-text('Start a post'), button:has-text('Create a post')")
        .first();
      await startPostButton.waitFor({ timeout: 30_000 });
      await startPostButton.click({ force: true });
      await delay(2000);
      modal = page.locator("[data-test-modal-id='sharebox'], .share-box-home-v2").first();
      await modal.waitFor({ timeout: 30_000 });
    }

    // Attach image if provided
    if (imageUrl) {
      tmpFile = await downloadToTemp(imageUrl);
      console.log("  [linkedin] Attaching image:", tmpFile);

      // Click the photo/media button inside the modal
      const mediaBtn = modal.locator(
        "button[aria-label*='photo'], button[aria-label*='Photo'], button[aria-label*='media'], button[aria-label*='Media'], button[data-control-name*='photo']"
      ).first();

      if (await mediaBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await mediaBtn.click();
        await delay(1000);
      }

      // Set the file on the hidden file input
      const fileInput = page.locator("input[type='file'][accept*='image'], input[type='file']").first();
      await fileInput.setInputFiles(tmpFile);
      await delay(3000); // wait for upload to process
      console.log("  [linkedin] Image attached");
    }

    // Type into editor
    const editor = modal.locator("div[role='textbox'], .ql-editor").first();
    await editor.waitFor({ timeout: 15_000 });
    await editor.click();
    await delay(300);
    await page.keyboard.type(content, { delay: 30 });
    await delay(800);

    // Click Post button
    const postButton = modal.locator(
      "button.share-actions__primary-action, button[data-control-name='share.sharebox_post_button']"
    ).first();
    const fallbackPostButton = modal
      .locator("button:has-text('Post'):not(:has-text('photo')):not(:has-text('video'))")
      .last();

    const primaryVisible = await postButton.isVisible({ timeout: 5_000 }).catch(() => false);
    if (primaryVisible) {
      await postButton.click({ force: true });
    } else {
      await fallbackPostButton.waitFor({ timeout: 15_000 });
      await fallbackPostButton.click({ force: true });
    }

    await delay(5000);

    // Try to capture post URL
    let postUrl: string | undefined;
    try {
      const postLink = page.locator('a[href*="/feed/update/"]').first();
      const href = await postLink.getAttribute("href", { timeout: 5000 }).catch(() => null);
      if (href) postUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
    } catch {}

    return postUrl;
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await context.close();
    await browser.close();
  }
}
