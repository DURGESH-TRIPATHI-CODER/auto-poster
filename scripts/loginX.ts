/**
 * Run ONCE to save your X session:
 *   npx ts-node -r tsconfig-paths/register scripts/loginX.ts
 *
 * A real browser window will open. Log in manually (handle any 2FA / challenge).
 * Once you reach the home feed, press Enter in this terminal to save the session.
 */
/**
 * Run ONCE to save your X session:
 *   npx ts-node -r tsconfig-paths/register scripts/loginX.ts
 *
 * A Chrome window opens with a dedicated profile.
 * Log in manually (handle any 2FA/challenge), reach x.com/home,
 * then press Enter here to save the session.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SESSION_DIR = path.join(process.cwd(), ".sessions");
const PROFILE_DIR = path.join(SESSION_DIR, "chrome-profile-x");
const SESSION_FILE = path.join(SESSION_DIR, "twitter.json");

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("Opening X login in Chrome (persistent profile)...");
  console.log("Log in manually, reach x.com/home, then press Enter here.\n");

  // launchPersistentContext = real Chrome profile, not detected as automation
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

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.question("Press Enter once you are on x.com/home... ", () => {
      rl.close();
      resolve();
    });
  });

  // Save storageState for use by the headless bot
  await context.storageState({ path: SESSION_FILE });
  console.log(`\nSession saved → ${SESSION_FILE}`);
  console.log("Bot will skip login for all future posts.");

  await context.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
