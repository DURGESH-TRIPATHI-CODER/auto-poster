/**
 * Run ONCE locally to save your X (Twitter) Playwright session.
 *
 *   npx tsx scripts/loginX.ts
 *
 * A real Chrome window opens. Log in manually (handle any 2FA/challenge).
 * Once you reach x.com/home, press Enter in this terminal.
 * The session is saved to .sessions/twitter.json and the base64
 * value is printed — copy it into your TWITTER_SESSION GitHub Secret.
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";
dotenv.config();

const SESSION_DIR = path.join(process.cwd(), ".sessions");
const PROFILE_DIR = path.join(SESSION_DIR, "chrome-profile-x");
const SESSION_FILE = path.join(SESSION_DIR, "twitter.json");

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Narada — X (Twitter) Session Generator");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. A Chrome window will open.");
  console.log("2. Log in to X (handle any 2FA/challenge if asked).");
  console.log("3. Once you see x.com/home, come back here.");
  console.log("4. Press Enter to save your session.\n");

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: "chrome",
    args: [
      "--window-size=1280,800",
      "--disable-blink-features=AutomationControlled",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  await page.goto("https://x.com/login", { waitUntil: "domcontentloaded" });

  // Wait for user to confirm they are on the home feed
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.question("Press Enter once you are on x.com/home... ", () => {
      rl.close();
      resolve();
    });
  });

  // Verify we're actually on home
  if (!page.url().includes("x.com/home")) {
    console.warn(`\n⚠ Current URL: ${page.url()}`);
    console.warn("  Warning: doesn't look like x.com/home. Session may be incomplete.");
  }

  // Save storageState (cookies + localStorage)
  await context.storageState({ path: SESSION_FILE });
  await context.close();

  // Read and base64-encode the session file
  const raw = fs.readFileSync(SESSION_FILE);
  const b64 = raw.toString("base64");

  console.log("\n✅ Session saved →", SESSION_FILE);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Add this as a GitHub Secret:");
  console.log("  Secret name:  TWITTER_SESSION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n" + b64 + "\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Copy the value above (everything between the lines).");
  console.log("  Go to: GitHub repo → Settings → Secrets → Actions");
  console.log("  Create secret:  TWITTER_SESSION  =  <paste here>");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("[loginX] Error:", err);
  process.exit(1);
});
