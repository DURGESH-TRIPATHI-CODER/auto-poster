import { chromium } from "playwright";

interface TwitterArgs {
  content: string;
}

export async function postToTwitter({ content }: TwitterArgs) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("https://x.com/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const emailInput = page.locator("input[autocomplete='username'], input[name='text']").first();
    await emailInput.waitFor({ timeout: 60_000 });
    await emailInput.fill(process.env.X_EMAIL || "");
    await page.keyboard.press("Enter");

    const passwordInput = page.locator("input[name='password']").first();
    await passwordInput.waitFor({ timeout: 60_000 });
    await passwordInput.fill(process.env.X_PASSWORD || "");
    await page.keyboard.press("Enter");

    await page.waitForLoadState("networkidle", { timeout: 60_000 });

    const composer = page.locator("div[aria-label='Post text'], div[data-testid='tweetTextarea_0']").first();
    await composer.waitFor({ timeout: 60_000 });
    await composer.click();
    await composer.fill(content);

    const postButton = page.locator("button[data-testid='tweetButtonInline'], button[data-testid='tweetButton']").first();
    await postButton.waitFor({ timeout: 30_000 });
    await postButton.click();

    await page.waitForTimeout(5000);
  } finally {
    await context.close();
    await browser.close();
  }
}