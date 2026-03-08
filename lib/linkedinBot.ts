import { chromium } from "playwright";

interface LinkedInArgs {
  content: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function postToLinkedIn({ content }: LinkedInArgs): Promise<string | undefined> {
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

  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(2000);

    // If session is invalid, bail out with a clear error
    if (page.url().includes("/login") || page.url().includes("/authwall")) {
      throw new Error("LinkedIn session expired — re-run loginLinkedIn.ts and update LINKEDIN_SESSION secret.");
    }

    // Click "Start a post"
    const startPostButton = page
      .locator("button:has-text('Start a post'), button:has-text('Create a post')")
      .first();
    await startPostButton.waitFor({ timeout: 30_000 });
    await startPostButton.click();
    await delay(1500);

    // Wait for share modal
    const modal = page.locator("[data-test-modal-id='sharebox'], .share-box-home-v2").first();
    await modal.waitFor({ timeout: 15_000 });

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
      await postButton.click();
    } else {
      await fallbackPostButton.waitFor({ timeout: 15_000 });
      await fallbackPostButton.click();
    }

    await delay(5000);

    // Try to capture the URL of the published post
    let postUrl: string | undefined;
    try {
      const postLink = page.locator('a[href*="/feed/update/"]').first();
      const href = await postLink.getAttribute("href", { timeout: 5000 }).catch(() => null);
      if (href) {
        postUrl = href.startsWith("http") ? href : `https://www.linkedin.com${href}`;
      }
    } catch {}

    return postUrl;
  } finally {
    await context.close();
    await browser.close();
  }
}
