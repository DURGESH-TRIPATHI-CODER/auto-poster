export type Platform = "linkedin" | "twitter";

export interface PostRow {
  id: string;
  content: string;
  image_url: string | null;
  platform: Platform;
  day_of_week: number;
  post_time: string;
  repeat_weekly: boolean;
  published: boolean;
  last_published_at: string | null;
  created_at: string;
}
