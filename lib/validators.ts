import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1).max(3000),
  image_url: z.string().url().nullable().optional(),
  platform: z.enum(["linkedin", "twitter"]),
  day_of_week: z.number().int().min(0).max(6),
  post_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  repeat_weekly: z.boolean()
});

export const createMultiPostSchema = z.object({
  content: z.string().min(1).max(3000),
  image_url: z.string().url().nullable().optional(),
  platforms: z.array(z.enum(["linkedin", "twitter"])).min(1),
  day_of_week: z.number().int().min(0).max(6),
  post_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  repeat_weekly: z.boolean()
});

export function isDueNow(dayOfWeek: number, postTime: string, now = new Date()) {
  if (dayOfWeek !== now.getDay()) return false;
  const [h, m] = postTime.split(":").map(Number);
  const scheduledMinutes = h * 60 + m;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  // Allow overdue same-day publishing if the worker runs late.
  return currentMinutes >= scheduledMinutes;
}
