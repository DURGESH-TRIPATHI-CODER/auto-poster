/**
 * worker.ts
 *
 * Local usage (continuous cron):
 *   npx tsx scripts/worker.ts
 *
 * Force publish all pending posts immediately:
 *   npx tsx scripts/worker.ts --now
 *
 * GitHub Actions (single run, then exit):
 *   npx tsx scripts/worker.ts --once
 *   (also triggered automatically when CI=true env var is set)
 */

import "dotenv/config";
import cron from "node-cron";
import { runScheduler, runWeeklyReminder, debugPosts } from "../lib/scheduler";

const timezone = process.env.WORKER_TIMEZONE || "Asia/Calcutta";
const forceNow = process.argv.includes("--now");

// --once flag or CI environment = run once and exit (used by GitHub Actions)
const runOnce = process.argv.includes("--once") || process.env.CI === "true";

async function runPublishJob() {
  const now = new Date();
  console.log(`\n[${now.toLocaleString("en-IN", { timeZone: "Asia/Calcutta" })}] Running publish job...`);
  try {
    if (forceNow) {
      const result = await debugPosts();
      console.log(`[debug] ${result.message}`);
    } else {
      const result = await runScheduler(now);
      console.log(`[publish] checked=${result.checked} published=${result.published} skipped=${result.skipped}`);
      for (const d of result.details) {
        console.log(`  → [${d.platform}] "${d.content.slice(0, 50)}..." — ${d.status}`);
      }
    }
  } catch (error) {
    console.error("[publish] failed:", error);
    // Re-throw in CI so the workflow step is marked as failed
    if (runOnce) throw error;
  }
}

async function runReminderJob() {
  try {
    const result = await runWeeklyReminder(new Date());
    console.log(`[reminder] sent=${result.reminderSent}`);
  } catch (error) {
    console.error("[reminder] failed:", error);
    if (runOnce) throw error;
  }
}

async function main() {
  if (forceNow) {
    // Force mode: publish everything now, ignore schedule
    console.log("AutoPoster worker — FORCE MODE");
    await runPublishJob();
    return;
  }

  if (runOnce) {
    // GitHub Actions mode: run publish + optional reminder, then exit
    console.log("AutoPoster worker — ONE-SHOT MODE (CI)");
    await runPublishJob();

    // Also run weekly reminder check if it's Sunday between 17:00–19:00 IST
    const now = new Date();
    const istHour = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Calcutta" })).getHours();
    const isSunday = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Calcutta" })).getDay() === 0;
    if (isSunday && istHour >= 17 && istHour < 19) {
      await runReminderJob();
    }

    console.log("[worker] Done.");
    return;
  }

  // Local continuous mode: use cron
  cron.schedule("*/5 * * * *", runPublishJob, { timezone });
  cron.schedule("0 18 * * 0", runReminderJob, { timezone });
  console.log(`AutoPoster worker started (${timezone})`);
  await runPublishJob(); // run immediately on start
}

main().catch((err) => {
  console.error("[worker] Fatal:", err);
  process.exit(1);
});
