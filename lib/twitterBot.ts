import { chromium } from "playwright";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface TwitterArgs {
  content: string;
  imageUrl?: string | null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDecodedStorage(filePath: string) {
  const rawBuf = fs.readFileSync(filePath);
  const raw = rawBuf.toString("utf-8").trim();
  if (!raw) throw new Error(`Storage state file is empty: ${filePath}`);

  // 1) Already JSON?
  try {
    JSON.parse(raw);
    return;
  } catch {}

  // 2) Try base64 → JSON
  try {
    const b64 = raw.replace(/^"+|"+$/g, ""); // strip accidental wrapping quotes
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    JSON.parse(decoded); // validate
    fs.writeFileSync(filePath, decoded);
    return;
  } catch {}

  throw new Error(
    `Storage state is neither JSON nor base64 JSON: ${filePath}. ` +
      `Ensure the secret is a base64-encoded Playwright storageState JSON (or plain JSON).`
  );
}

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop() ?? "jpg";
  const tmpPath = path.join(os.tmpdir(), `narada-x-${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

export async function postToTwitter({ content, imageUrl }: TwitterArgs): Promise<string | undefined> {
  ensureDecodedStorage(".sessions/twitter.json");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    storageState: ".sessions/twitter.json",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });

  const page = await context.newPage();
  let tmpFile: string | null = null;

  try {
    // Go straight to the composer to avoid feed overlays
    await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(1500);

    if (page.url().includes("/login") || page.url().includes("/i/flow/login")) {
      throw new Error("X session expired — re-run loginX.ts and update TWITTER_SESSION secret.");
    }

    // Focus tweet composer
    const composer = page
      .locator("div[data-testid='tweetTextarea_0'], div[data-testid='tweetTextarea_1']")
      .first();
    await composer.waitFor({ timeout: 30_000 });
    await composer.click();
    await delay(500);

    await page.keyboard.type(content, { delay: 40 });
    await delay(800);

    // Attach image if provided
    if (imageUrl) {
      tmpFile = await downloadToTemp(imageUrl);
      console.log("  [twitter] Attaching image:", tmpFile);

      const fileInput = page.locator("input[data-testid='fileInput'], input[type='file'][accept*='image']").first();
      await fileInput.setInputFiles(tmpFile);
      await delay(4000); // wait for upload + preview to appear
      console.log("  [twitter] Image attached");
    }

    // Click post button
    const postButton = page
      .locator("button[data-testid='tweetButtonInline'], button[data-testid='tweetButton']")
      .first();
    await postButton.waitFor({ timeout: 30_000 });

    // Clear blocking layers/modals that sometimes sit on top of the button
    await page.keyboard.press("Escape").catch(() => {});
    await delay(200);
    try {
      await page.locator("#layers div[role='presentation']").evaluateAll((nodes) => {
        nodes.forEach((n) => n.parentElement?.removeChild(n));
      });
    } catch {
      /* best-effort cleanup */
    }

    // Primary click
    try {
      await postButton.click({ timeout: 15_000, force: true });
    } catch (err) {
      // Fallback: JS-dispatch click to bypass overlay hit-testing
      await postButton.evaluate((btn: HTMLElement) => btn.click());
    }

    await delay(5000);

    // Try to capture tweet URL
    let postUrl: string | undefined;
    try {
      const tweetLink = page
        .locator('article[data-testid="tweet"] a[href*="/status/"]')
        .first();
      const href = await tweetLink.getAttribute("href", { timeout: 5000 }).catch(() => null);
      if (href) postUrl = href.startsWith("http") ? href : `https://x.com${href}`;
    } catch {}

    return postUrl;
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await context.close();
    await browser.close();
  }
}
