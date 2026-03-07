import { chromium } from "playwright";

interface LinkedInArgs {
  content: string;
}

export async function postToLinkedIn({ content }: LinkedInArgs) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    await page.fill("#username", process.env.LINKEDIN_EMAIL || "");
    await page.fill("#password", process.env.LINKEDIN_PASSWORD || "");
    await page.click("button[type='submit']");

    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const startPostButton = page
      .locator("button:has-text('Start a post'), button:has-text('Create a post')")
      .first();
    await startPostButton.waitFor({ timeout: 60_000 });
    await startPostButton.click();

    const editor = page.locator("div[role='textbox']").first();
    await editor.waitFor({ timeout: 30_000 });
    await editor.fill(content);

    const postButton = page.locator("button:has-text('Post')").last();
    await postButton.waitFor({ timeout: 30_000 });
    await postButton.click();

    await page.waitForTimeout(5000);
  } finally {
    await context.close();
    await browser.close();
  }
}