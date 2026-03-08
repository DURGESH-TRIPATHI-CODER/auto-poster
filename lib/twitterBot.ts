import { chromium } from "playwright";

interface TwitterArgs {
  content: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function postToTwitter({ content }: TwitterArgs): Promise<string | undefined> {
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

  try {
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(2000);

    // If session is invalid, bail out with a clear error
    if (page.url().includes("/login") || page.url().includes("/i/flow/login")) {
      throw new Error("X session expired — re-run loginX.ts and update TWITTER_SESSION secret.");
    }

    // Find tweet composer and type content
    const composer = page
      .locator("div[data-testid='tweetTextarea_0'], div[data-testid='tweetTextarea_1']")
      .first();
    await composer.waitFor({ timeout: 30_000 });
    await composer.click();
    await delay(500);

    await page.keyboard.type(content, { delay: 40 });
    await delay(800);

    // Click post button
    const postButton = page
      .locator("button[data-testid='tweetButtonInline'], button[data-testid='tweetButton']")
      .first();
    await postButton.waitFor({ timeout: 15_000 });
    await postButton.click();

    await delay(5000);

    // Try to capture the URL of the published tweet
    let postUrl: string | undefined;
    try {
      const tweetLink = page
        .locator('article[data-testid="tweet"] a[href*="/status/"]')
        .first();
      const href = await tweetLink.getAttribute("href", { timeout: 5000 }).catch(() => null);
      if (href) {
        postUrl = href.startsWith("http") ? href : `https://x.com${href}`;
      }
    } catch {}

    return postUrl;
  } finally {
    await context.close();
    await browser.close();
  }
}
