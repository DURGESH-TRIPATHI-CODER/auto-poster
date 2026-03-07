import "dotenv/config";
import cron from "node-cron";
import { runScheduler, runWeeklyReminder } from "../lib/scheduler";

const timezone = process.env.WORKER_TIMEZONE || "Asia/Calcutta";

async function runPublishJob() {
  try {
    const result = await runScheduler(new Date());
    console.log(`[publish] checked=${result.checked} published=${result.published}`);
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

cron.schedule("*/5 * * * *", runPublishJob, { timezone });
cron.schedule("0 18 * * 0", runReminderJob, { timezone });

console.log(`AutoPoster worker started (${timezone})`);
runPublishJob();