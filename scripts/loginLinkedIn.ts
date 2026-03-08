/**
 * Run ONCE to save your LinkedIn session:
 *   npx ts-node -r tsconfig-paths/register scripts/loginLinkedIn.ts
 *
 * A real browser window will open. Log in manually (handle any 2FA / challenge).
 * Once you reach the LinkedIn feed, press Enter in this terminal to save the session.
 */
/**
 * Run ONCE to save your LinkedIn session:
 *   npx ts-node -r tsconfig-paths/register scripts/loginLinkedIn.ts
 *
 * A Chrome window opens with a dedicated profile.
 * Log in manually, reach linkedin.com/feed, then press Enter here.
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SESSION_DIR = path.join(process.cwd(), ".sessions");
const PROFILE_DIR = path.join(SESSION_DIR, "chrome-profile-linkedin");
const SESSION_FILE = path.join(SESSION_DIR, "linkedin.json");

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  console.log("Opening LinkedIn login in Chrome (persistent profile)...");
  console.log("Log in manually, reach linkedin.com/feed, then press Enter here.\n");

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

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.question("Press Enter once you are on linkedin.com/feed... ", () => {
      rl.close();
      resolve();
    });
  });

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
