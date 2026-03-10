import { addDays } from "date-fns";
import { supabaseAdmin } from "./supabaseClient";
import { postToLinkedIn } from "./linkedinBot";
import { postToTwitter } from "./twitterBot";
import { sendNoScheduleReminder, sendPostPublishedEmail } from "./email";
import { isDueNow } from "./validators";
import { deletePostImage } from "./storage";
import type { PostRow } from "./types";

function recentlyPublished(row: PostRow, now: Date) {
  if (!row.last_published_at) return false;
  const previous = new Date(row.last_published_at).getTime();
  const daysSince = (now.getTime() - previous) / (1000 * 60 * 60 * 24);
  return daysSince < 6.5;
}

export async function runScheduler(now = new Date(), timezone = process.env.WORKER_TIMEZONE || "Asia/Calcutta") {
  const { data, error } = await supabaseAdmin.from("posts").select("*").eq("published", false);
  if (error) throw error;

  const rows = (data ?? []) as PostRow[];
  let publishedCount = 0;
  let skippedCount = 0;

  const details: Array<{ platform: string; content: string; status: string }> = [];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const localNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  console.log(
    `  Current time (${timezone}): ${days[localNow.getDay()]} ${localNow
      .getHours()
      .toString()
      .padStart(2, "0")}:${localNow.getMinutes().toString().padStart(2, "0")}`
  );
  console.log(`  Posts pending in DB: ${rows.length}`);

  for (const row of rows) {
    const due = isDueNow(row.day_of_week, row.post_time, localNow);
    const recent = row.repeat_weekly && recentlyPublished(row, now);

    if (!due) {
      skippedCount++;
      details.push({ platform: row.platform, content: row.content, status: `not due (scheduled ${days[row.day_of_week]} ${row.post_time.slice(0,5)})` });
      continue;
    }
    if (recent) {
      skippedCount++;
      details.push({ platform: row.platform, content: row.content, status: "recently published, skip" });
      continue;
    }

    try {
      console.log(`  Publishing [${row.platform}]: "${row.content.slice(0, 60)}..."`);
      let postUrl: string | undefined;
      if (row.platform === "linkedin") {
        postUrl = await postToLinkedIn({ content: row.content, imageUrl: row.image_url });
      } else {
        postUrl = await postToTwitter({ content: row.content, imageUrl: row.image_url });
      }

      await supabaseAdmin
        .from("posts")
        .update({
          published: row.repeat_weekly ? false : true,
          last_published_at: now.toISOString()
        })
        .eq("id", row.id);

      publishedCount++;
      details.push({ platform: row.platform, content: row.content, status: "published" });
      sendPostPublishedEmail(row.platform, row.content, postUrl).catch(() => {});
      if (!row.repeat_weekly) {
        deletePostImage(row.image_url).catch(() => {});
      }
    } catch (err) {
      console.error(`  [scheduler] post failed [${row.platform}]`, err);
      details.push({ platform: row.platform, content: row.content, status: `FAILED: ${(err as Error).message}` });
      continue;
    }
  }

  return { checked: rows.length, published: publishedCount, skipped: skippedCount, details };
}

/** Force-publishes all pending (unpublished) posts right now, ignoring schedule. */
export async function debugPosts() {
  const { data, error } = await supabaseAdmin.from("posts").select("*").eq("published", false);
  if (error) throw error;

  const rows = (data ?? []) as PostRow[];
  console.log(`  Force mode: ${rows.length} pending post(s) found`);

  let published = 0;
  for (const row of rows) {
    try {
      console.log(`  Force-publishing [${row.platform}]: "${row.content.slice(0, 60)}..."`);
      let postUrl: string | undefined;
      if (row.platform === "linkedin") {
        postUrl = await postToLinkedIn({ content: row.content, imageUrl: row.image_url });
      } else {
        postUrl = await postToTwitter({ content: row.content, imageUrl: row.image_url });
      }
      await supabaseAdmin
        .from("posts")
        .update({ published: row.repeat_weekly ? false : true, last_published_at: new Date().toISOString() })
        .eq("id", row.id);
      published++;
      sendPostPublishedEmail(row.platform, row.content, postUrl).catch(() => {});
      if (!row.repeat_weekly) {
        deletePostImage(row.image_url).catch(() => {});
      }
      console.log(`  ✓ Published`);
    } catch (err) {
      console.error(`  ✗ Failed [${row.platform}]:`, err);
    }
  }

  return { message: `Force-published ${published}/${rows.length} posts` };
}

export async function runWeeklyReminder(now = new Date()) {
  const nextWeek = addDays(now, 7);
  const startDay = nextWeek.getDay();
  const weekDays = Array.from({ length: 7 }, (_, i) => (startDay + i) % 7);

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id")
    .eq("published", false)
    .in("day_of_week", weekDays)
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    await sendNoScheduleReminder();
    return { reminderSent: true };
  }

  return { reminderSent: false };
}
