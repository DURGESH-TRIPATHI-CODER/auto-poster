import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PostList } from "@/components/PostList";
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
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <section className="card p-5">
          <p className="text-sm text-slate-500">Scheduled Posts</p>
          <p className="mt-2 text-3xl font-bold">{(upcoming ?? []).length}</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-slate-500">Published Posts</p>
          <p className="mt-2 text-3xl font-bold">{(published ?? []).length}</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-slate-500">Content Health</p>
          <p className="mt-2 text-3xl font-bold">{(upcoming ?? []).length > 0 ? "Good" : "Empty"}</p>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PostList title="Upcoming Posts" initialPosts={(upcoming ?? []) as PostRow[]} />
        <PostList title="Published Posts" initialPosts={(published ?? []) as PostRow[]} />
      </div>
    </AppShell>
  );
}
