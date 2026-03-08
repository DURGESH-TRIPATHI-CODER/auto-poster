import "dotenv/config";
import cron from "node-cron";
import { runScheduler, runWeeklyReminder, debugPosts } from "../lib/scheduler";

const timezone = process.env.WORKER_TIMEZONE || "Asia/Calcutta";
const forceNow = process.argv.includes("--now");

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
      if (result.details.length > 0) {
        for (const d of result.details) {
          console.log(`  → [${d.platform}] "${d.content.slice(0, 50)}..." — ${d.status}`);
        }
      }
    }
  } catch (error) {
    console.error("[publish] failed", error);
  }
}

async function runReminderJob() {
  try {
    const result = await runWeeklyReminder(new Date());
    console.log(`[reminder] sent=${result.reminderSent}`);
  } catch (error) {
    console.error("[reminder] failed", error);
  }
}

if (forceNow) {
  console.log("AutoPoster worker — FORCE MODE (publishing all pending posts now)");
  runPublishJob();
} else {
  cron.schedule("*/5 * * * *", runPublishJob, { timezone });
  cron.schedule("0 18 * * 0", runReminderJob, { timezone });
  console.log(`AutoPoster worker started (${timezone})`);
  runPublishJob();
}
