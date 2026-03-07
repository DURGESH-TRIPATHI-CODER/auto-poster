import { addDays } from "date-fns";
import { supabaseAdmin } from "./supabaseClient";
import { postToLinkedIn } from "./linkedinBot";
import { postToTwitter } from "./twitterBot";
import { sendNoScheduleReminder } from "./email";
import { isDueNow } from "./validators";
import type { PostRow } from "./types";

function recentlyPublished(row: PostRow, now: Date) {
  if (!row.last_published_at) return false;
  const previous = new Date(row.last_published_at).getTime();
  const daysSince = (now.getTime() - previous) / (1000 * 60 * 60 * 24);
  return daysSince < 6.5;
}

export async function runScheduler(now = new Date()) {
  const { data, error } = await supabaseAdmin.from("posts").select("*").eq("published", false);
  if (error) throw error;

  let publishedCount = 0;

  for (const row of (data ?? []) as PostRow[]) {
    if (!isDueNow(row.day_of_week, row.post_time, now)) continue;
    if (row.repeat_weekly && recentlyPublished(row, now)) continue;

    if (row.platform === "linkedin") {
      await postToLinkedIn({ content: row.content });
    } else {
      await postToTwitter({ content: row.content });
    }

    await supabaseAdmin
      .from("posts")
      .update({
        published: row.repeat_weekly ? false : true,
        last_published_at: now.toISOString()
      })
      .eq("id", row.id);

    publishedCount += 1;
  }

  return { checked: data?.length ?? 0, published: publishedCount };
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
