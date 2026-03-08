import { chromium } from "playwright";
import { saveSession, loadSessionOptions, clearSession, sessionExists } from "./session";

interface TwitterArgs {
  content: string;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function humanDelay() {
  return delay(800 + Math.random() * 600);
}

async function loginTwitter(page: import("playwright").Page, email: string, password: string) {
  await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await delay(2000);

  const acceptCookies = page
    .locator("button:has-text('Accept all cookies'), button:has-text('Accept all')")
    .first();
  if (await acceptCookies.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await acceptCookies.click();
    await delay(500);
  }

  // Step 1: Enter email/username — try multiple selectors
  const userInput = page
    .locator("input[autocomplete='username'], input[name='text'], input[inputmode='text']")
    .first();
  await userInput.waitFor({ timeout: 30_000 });
  await userInput.click();
  await humanDelay();
  await userInput.pressSequentially(email, { delay: 60 });
  await humanDelay();

  const nextButton = page.locator("button[data-testid='ocfEnterTextNextButton']").first();
  if (await nextButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await nextButton.click();
  } else {
    await page.keyboard.press("Enter");
  }
  await delay(2500);

  // Step 2: Wait for EITHER password or a challenge input
  // Give both a chance to appear (up to 8s total)
  let gotPassword = false;
  for (let i = 0; i < 4; i++) {
    gotPassword = await page
      .locator("input[name='password'], input[type='password']")
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    if (gotPassword) break;
    await delay(500);
  }

  if (!gotPassword) {
    // Any text input still visible is likely a challenge (phone / @username)
    const anyInput = page.locator("input[type='text'], input[name='text'], input[data-testid='ocfEnterTextTextInput']").first();
    const challengeVisible = await anyInput.isVisible({ timeout: 5_000 }).catch(() => false);

    if (challengeVisible) {
      const handle = process.env.X_USERNAME || email.split("@")[0];
      console.log("  [twitter] Challenge — entering handle:", handle);
      await anyInput.click();
      await anyInput.selectText().catch(() => {});
      await anyInput.pressSequentially(handle, { delay: 60 });
      await humanDelay();
      const challengeNext = page.locator("button[data-testid='ocfEnterTextNextButton']").first();
      if (await challengeNext.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await challengeNext.click();
      } else {
        await page.keyboard.press("Enter");
      }
      await delay(2500);
    } else {
      // Take a screenshot to help diagnose what screen X is showing
      const fs = await import("fs");
      fs.mkdirSync(".sessions", { recursive: true });
      await page.screenshot({ path: ".sessions/x-login-debug.png", fullPage: true });
      console.error("  [twitter] Unknown screen — screenshot saved to .sessions/x-login-debug.png");
      console.error("  [twitter] Current URL:", page.url());
    }
  }

  // Step 3: Enter password
  const passwordInput = page.locator("input[name='password'], input[type='password']").first();
  await passwordInput.waitFor({ timeout: 20_000 });
  await passwordInput.click();
  await humanDelay();
  await passwordInput.pressSequentially(password, { delay: 60 });
  await humanDelay();

  const loginButton = page.locator("button[data-testid='LoginForm_Login_Button']").first();
  if (await loginButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await loginButton.click();
  } else {
    await page.keyboard.press("Enter");
  }

  await page.waitForURL(/x\.com\/(home|$)/, { timeout: 30_000 }).catch(() => null);
  await delay(2000);
}

export async function postToTwitter({ content }: TwitterArgs): Promise<string | undefined> {
  const email = process.env.X_EMAIL || "";
  const password = process.env.X_PASSWORD || "";
  if (!email || !password) throw new Error("Missing X_EMAIL or X_PASSWORD in environment.");

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
    ...loadSessionOptions("twitter"),
  };

  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // @ts-ignore
    delete navigator.__proto__.webdriver;
  });

  const page = await context.newPage();

  try {
    // Go to home — if session is valid we skip login entirely
    await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await delay(2000);

    // If redirected to login flow, session expired
    if (page.url().includes("/login") || page.url().includes("/i/flow/login")) {
      console.log("  [twitter] Session expired, logging in...");
      clearSession("twitter");
      await loginTwitter(page, email, password);
      if (!page.url().includes("/home")) {
        await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 30_000 });
        await delay(2000);
      }
      await saveSession(context, "twitter");
    } else if (!sessionExists("twitter")) {
      await saveSession(context, "twitter");
    }

    // Find tweet composer
    const composer = page
      .locator("div[data-testid='tweetTextarea_0'], div[data-testid='tweetTextarea_1']")
      .first();
    await composer.waitFor({ timeout: 30_000 });
    await composer.click();
    await humanDelay();

    await page.keyboard.type(content, { delay: 40 });
    await delay(800);

    const postButton = page
      .locator("button[data-testid='tweetButtonInline'], button[data-testid='tweetButton']")
      .first();
    await postButton.waitFor({ timeout: 15_000 });
    await postButton.click();

    await delay(5000);

    // Try to capture the URL of the just-published tweet
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
