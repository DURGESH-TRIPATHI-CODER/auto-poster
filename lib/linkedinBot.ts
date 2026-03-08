import { chromium } from "playwright";
import { saveSession, loadSessionOptions, clearSession, sessionExists } from "./session";

interface LinkedInArgs {
  content: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loginLinkedIn(page: import("playwright").Page) {
  const email = process.env.LINKEDIN_EMAIL || "";
  const password = process.env.LINKEDIN_PASSWORD || "";
  if (!email || !password) throw new Error("Missing LINKEDIN_EMAIL or LINKEDIN_PASSWORD in environment.");

  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.fill("#username", email);
  await delay(400);
  await page.fill("#password", password);
  await delay(400);
  await page.click("button[type='submit']");
  await page.waitForURL(/linkedin\.com\/(feed|checkpoint|dashboard)/, { timeout: 30_000 }).catch(() => null);
  await delay(2000);
}

export async function postToLinkedIn({ content }: LinkedInArgs): Promise<string | undefined> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1280,800",
      "--disable-dev-shm-usage",
    ],
  });

  const contextOptions = {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 } as const,
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    ...loadSessionOptions("linkedin"),
  };

  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  const page = await context.newPage();

  try {
    // Go to feed — if session is valid we'll land there directly
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(2000);

    // If redirected to login, session expired — log in fresh
    if (page.url().includes("/login") || page.url().includes("/authwall")) {
      console.log("  [linkedin] Session expired, logging in...");
      clearSession("linkedin");
      await loginLinkedIn(page);
      if (!page.url().includes("/feed")) {
        await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 30_000 });
        await delay(2000);
      }
      await saveSession(context, "linkedin");
    } else if (!sessionExists("linkedin")) {
      // First successful load — save session for next time
      await saveSession(context, "linkedin");
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

    // Click Post button scoped to modal
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

    // Try to capture the URL of the just-published post
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