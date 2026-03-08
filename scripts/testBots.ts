/**
 * Run: npx ts-node -r tsconfig-paths/register scripts/testBots.ts
 * Tests that Playwright can log into LinkedIn and X without posting anything.
 */
import { chromium } from "playwright";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testLinkedIn() {
  console.log("\n── LinkedIn ──────────────────────────────");
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;
  if (!email || !password) {
    console.error("  ✗ Missing LINKEDIN_EMAIL or LINKEDIN_PASSWORD in env");
    return false;
  }

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  const page = await context.newPage();

  try {
    console.log("  → Navigating to login page...");
    await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    console.log("  → Filling credentials...");
    await page.fill("#username", email);
    await page.fill("#password", password);
    await page.click("button[type='submit']");

    console.log("  → Waiting for redirect...");
    await page.waitForURL(/linkedin\.com\/(feed|checkpoint)/, { timeout: 30_000 }).catch(() => null);
    await delay(2000);

    const url = page.url();
    if (url.includes("/checkpoint") || url.includes("/challenge")) {
      console.warn("  ⚠  LinkedIn security check triggered — manual action required");
      return false;
    }
    if (url.includes("/feed")) {
      console.log("  ✓ Logged in successfully. URL:", url);
      return true;
    }
    console.warn("  ⚠  Unexpected URL after login:", url);
    return false;
  } catch (err) {
    console.error("  ✗ Error:", (err as Error).message);
    return false;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function testTwitter() {
  console.log("\n── X (Twitter) ───────────────────────────");
  const email = process.env.X_EMAIL;
  const password = process.env.X_PASSWORD;
  if (!email || !password) {
    console.error("  ✗ Missing X_EMAIL or X_PASSWORD in env");
    return false;
  }

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
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    timezoneId: "Asia/Kolkata",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // @ts-ignore
    delete navigator.__proto__.webdriver;
  });
  const page = await context.newPage();

  try {
    console.log("  → Navigating to login page...");
    await page.goto("https://x.com/i/flow/login", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const acceptCookies = page.locator("button:has-text('Accept all cookies'), button:has-text('Accept all')").first();
    if (await acceptCookies.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await acceptCookies.click();
      await delay(500);
    }

    console.log("  → Entering username...");
    const userInput = page.locator("input[name='text'], input[autocomplete='username']").first();
    await userInput.waitFor({ timeout: 30_000 });
    await userInput.click();
    await delay(600);
    await userInput.pressSequentially(email, { delay: 60 });
    await delay(800);

    const nextButton = page.locator("button[data-testid='ocfEnterTextNextButton'], div[role='button']:has-text('Next')").first();
    if (await nextButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nextButton.click();
    } else {
      await page.keyboard.press("Enter");
    }
    await delay(1000);

    // Challenge
    const challengeInput = page.locator("input[data-testid='ocfEnterTextTextInput'], input[name='text']").first();
    if (await challengeInput.isVisible({ timeout: 4_000 }).catch(() => false)) {
      console.log("  ⚠  Challenge detected — entering username handle...");
      const username = email.split("@")[0];
      await challengeInput.pressSequentially(username, { delay: 60 });
      await delay(800);
      const challengeNext = page.locator("button[data-testid='ocfEnterTextNextButton'], div[role='button']:has-text('Next')").first();
      if (await challengeNext.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await challengeNext.click();
      } else {
        await page.keyboard.press("Enter");
      }
      await delay(1000);
    }

    console.log("  → Entering password...");
    const passwordInput = page.locator("input[name='password'], input[type='password']").first();
    await passwordInput.waitFor({ timeout: 30_000 });
    await passwordInput.click();
    await delay(600);
    await passwordInput.pressSequentially(password, { delay: 60 });
    await delay(800);

    const loginButton = page.locator("button[data-testid='LoginForm_Login_Button'], div[role='button']:has-text('Log in')").first();
    if (await loginButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginButton.click();
    } else {
      await page.keyboard.press("Enter");
    }

    console.log("  → Waiting for home...");
    await page.waitForURL(/x\.com\/(home|$)/, { timeout: 30_000 }).catch(() => null);
    await delay(2000);

    if (!page.url().includes("/home")) {
      await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 30_000 });
      await delay(2000);
    }

    const url = page.url();
    if (url.includes("/home")) {
      console.log("  ✓ Logged in successfully. URL:", url);

      // Also check composer is visible
      const composer = page.locator("div[data-testid='tweetTextarea_0']").first();
      const composerVisible = await composer.isVisible({ timeout: 10_000 }).catch(() => false);
      console.log(`  ${composerVisible ? "✓" : "⚠ "} Tweet composer: ${composerVisible ? "found" : "NOT found"}`);
      return true;
    }

    console.warn("  ⚠  Unexpected URL after login:", url);
    return false;
  } catch (err) {
    console.error("  ✗ Error:", (err as Error).message);
    return false;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  console.log("=== Playwright Bot Test ===");
  const liOk = await testLinkedIn();
  const xOk = await testTwitter();

  console.log("\n── Summary ───────────────────────────────");
  console.log(`  LinkedIn : ${liOk ? "✓ OK" : "✗ FAILED"}`);
  console.log(`  X        : ${xOk ? "✓ OK" : "✗ FAILED"}`);
  console.log("");
  process.exit(liOk && xOk ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
