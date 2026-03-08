import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PostList } from "@/components/PostList";
import { DashboardStats } from "@/components/DashboardStats";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { PostRow } from "@/lib/types";

export default async function DashboardPage() {
  noStore();

  const { data: upcoming } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("published", false)
    .order("day_of_week", { ascending: true })
    .order("post_time", { ascending: true });

  const { data: published } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const upcomingPosts = (upcoming ?? []) as PostRow[];
  const publishedPosts = (published ?? []) as PostRow[];

  return (
    <AppShell
      active="dashboard"
      title="Overview"
      subtitle="Track performance and manage upcoming content."
      action={
        <Link href="/create-post" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          New Post
        </Link>
      }
    >
      <DashboardStats initial={{ scheduled: upcomingPosts.length, published: publishedPosts.length }} />

      <div className="grid gap-6 xl:grid-cols-2">
        <PostList title="Upcoming Posts" initialPosts={upcomingPosts} published={false} />
        <PostList title="Published Posts" initialPosts={publishedPosts} published={true} />
      </div>
    </AppShell>
  );
}
