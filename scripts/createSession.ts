/**
 * createSession.ts
 *
 * Run this locally to manually log in and save a Playwright session.
 * The saved session is then base64-encoded and stored as a GitHub Secret.
 *
 * Usage:
 *   npx tsx scripts/createSession.ts linkedin
 *   npx tsx scripts/createSession.ts twitter
 *   npx tsx scripts/createSession.ts both
 */

import { chromium } from "playwright";
import { saveSession } from "../lib/session";
import * as fs from "fs";
import * as path from "path";

const LOGIN_URLS: Record<string, string> = {
  linkedin: "https://www.linkedin.com/login",
  twitter: "https://x.com/i/flow/login",
};

const WAIT_SECONDS = 90; // time to complete manual login

async function createSessionFor(platform: "linkedin" | "twitter") {
  console.log(`\n[createSession] Launching browser for ${platform}...`);

  const browser = await chromium.launch({
    headless: false, // non-headless — user must interact
    args: ["--window-size=1280,800"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
  });

  const page = await context.newPage();

  await page.goto(LOGIN_URLS[platform], { waitUntil: "domcontentloaded" });

  console.log(`[createSession] Browser opened. You have ${WAIT_SECONDS}s to log in manually.`);
  console.log(`[createSession] Complete the login in the browser window, then wait...`);

  // Wait for the user to complete login
  // For LinkedIn: wait until redirected away from /login
  // For Twitter: wait until redirected to /home
  const successPattern =
    platform === "linkedin"
      ? /linkedin\.com\/(feed|dashboard|mynetwork)/
      : /x\.com\/home/;

  let loggedIn = false;
  const deadline = Date.now() + WAIT_SECONDS * 1000;

  while (Date.now() < deadline) {
    await page.waitForTimeout(2000);
    if (successPattern.test(page.url())) {
      loggedIn = true;
      break;
    }
    const remaining = Math.round((deadline - Date.now()) / 1000);
    process.stdout.write(`\r[createSession] Waiting for login... ${remaining}s remaining  `);
  }

  console.log(); // newline after progress

  if (!loggedIn) {
    console.error(`[createSession] Login not detected within ${WAIT_SECONDS}s. Aborting.`);
    await browser.close();
    process.exit(1);
  }

  // Extra wait to let cookies/storage settle
  await page.waitForTimeout(2000);

  // Save session
  await saveSession(context, platform);

  await browser.close();

  // Print encoding instructions
  const sessionFile = path.join(process.cwd(), ".sessions", `${platform}.json`);
  console.log(`\n✅ Session saved to ${sessionFile}`);
  console.log(`\n--- Next step: encode and add to GitHub Secrets ---`);
  console.log(`Run this command to get the base64 value:\n`);

  if (process.platform === "win32") {
    console.log(`  PowerShell:  [Convert]::ToBase64String([IO.File]::ReadAllBytes('.sessions\\${platform}.json'))`);
    console.log(`  Or:          certutil -encode .sessions\\${platform}.json .sessions\\${platform}.b64`);
  } else {
    console.log(`  base64 -w 0 .sessions/${platform}.json`);
  }

  console.log(`\nThen add as GitHub Secret:`);
  console.log(`  Secret name:  ${platform.toUpperCase()}_SESSION`);
  console.log(`  Secret value: <paste the base64 output>`);
}

async function main() {
  const arg = process.argv[2];

  if (!arg || !["linkedin", "twitter", "both"].includes(arg)) {
    console.error("Usage: npx tsx scripts/createSession.ts <linkedin|twitter|both>");
    process.exit(1);
  }

  fs.mkdirSync(path.join(process.cwd(), ".sessions"), { recursive: true });

  if (arg === "both") {
    await createSessionFor("linkedin");
    await createSessionFor("twitter");
  } else {
    await createSessionFor(arg as "linkedin" | "twitter");
  }

  console.log("\n✅ Done. Your session is ready to use.");
}

main().catch((err) => {
  console.error("[createSession] Fatal error:", err);
  process.exit(1);
});
