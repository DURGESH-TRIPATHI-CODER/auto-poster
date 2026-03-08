/**
 * Run ONCE locally to save your LinkedIn Playwright session.
 *
 *   npx tsx scripts/loginLinkedIn.ts
 *
 * A real Chrome window opens. Log in manually (handle any 2FA/challenge).
 * Once you reach linkedin.com/feed, press Enter in this terminal.
 * The session is saved to .sessions/linkedin.json and the base64
 * value is printed — copy it into your LINKEDIN_SESSION GitHub Secret.
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";
dotenv.config();

const SESSION_DIR = path.join(process.cwd(), ".sessions");
const PROFILE_DIR = path.join(SESSION_DIR, "chrome-profile-linkedin");
const SESSION_FILE = path.join(SESSION_DIR, "linkedin.json");

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Narada — LinkedIn Session Generator");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. A Chrome window will open.");
  console.log("2. Log in to LinkedIn (complete any 2FA if asked).");
  console.log("3. Once you see linkedin.com/feed, come back here.");
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
  await page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });

  // Wait for user to confirm they are on the feed
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.question("Press Enter once you are on linkedin.com/feed... ", () => {
      rl.close();
      resolve();
    });
  });

  // Verify we're actually on the feed
  if (!page.url().includes("linkedin.com/feed") && !page.url().includes("linkedin.com/dashboard")) {
    console.warn(`\n⚠ Current URL: ${page.url()}`);
    console.warn("  Warning: doesn't look like the feed. Session may be incomplete.");
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
  console.log("  Secret name:  LINKEDIN_SESSION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n" + b64 + "\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Copy the value above (everything between the lines).");
  console.log("  Go to: GitHub repo → Settings → Secrets → Actions");
  console.log("  Create secret:  LINKEDIN_SESSION  =  <paste here>");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("[loginLinkedIn] Error:", err);
  process.exit(1);
});
