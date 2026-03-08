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

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop() ?? "jpg";
  const tmpPath = path.join(os.tmpdir(), `autoposter-x-${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

export async function postToTwitter({ content, imageUrl }: TwitterArgs): Promise<string | undefined> {
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
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(2000);

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
    await postButton.waitFor({ timeout: 15_000 });
    await postButton.click();

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
