import { BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";

const SESSION_DIR = path.join(process.cwd(), ".sessions");

export function sessionPath(platform: "linkedin" | "twitter") {
  return path.join(SESSION_DIR, `${platform}.json`);
}

export function sessionExists(platform: "linkedin" | "twitter") {
  return fs.existsSync(sessionPath(platform));
}

export async function saveSession(context: BrowserContext, platform: "linkedin" | "twitter") {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  await context.storageState({ path: sessionPath(platform) });
  console.log(`  [session] Saved ${platform} session`);
}

export function loadSessionOptions(platform: "linkedin" | "twitter") {
  if (!sessionExists(platform)) return {};
  return { storageState: sessionPath(platform) };
}

export function clearSession(platform: "linkedin" | "twitter") {
  const p = sessionPath(platform);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`  [session] Cleared ${platform} session`);
  }
}
