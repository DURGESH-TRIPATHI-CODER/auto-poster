import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { PostRow } from "@/lib/types";

const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AnalyticsPage() {
  noStore();

  const { data } = await supabaseAdmin.from("posts").select("*").order("created_at", { ascending: false });
  const posts = (data ?? []) as PostRow[];

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((post) => post.published);
  const linkedinPosts = posts.filter((post) => post.platform === "linkedin");
  const twitterPosts = posts.filter((post) => post.platform === "twitter");
  const weeklyCounts = Array.from({ length: 7 }, (_, day) => posts.filter((post) => post.day_of_week === day).length);
  const maxWeekly = Math.max(...weeklyCounts, 1);

  return (
    <AppShell active="analytics" title="Analytics Dashboard" subtitle="Cross-platform publishing and scheduling insights.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="card p-5">
          <p className="text-sm text-slate-500">Total Posts</p>
          <p className="mt-2 text-3xl font-bold">{totalPosts}</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-bold">{publishedPosts.length}</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-slate-500">LinkedIn Share</p>
          <p className="mt-2 text-3xl font-bold">{totalPosts === 0 ? 0 : Math.round((linkedinPosts.length / totalPosts) * 100)}%</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-slate-500">X Share</p>
          <p className="mt-2 text-3xl font-bold">{totalPosts === 0 ? 0 : Math.round((twitterPosts.length / totalPosts) * 100)}%</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Weekly Activity</h2>
          <div className="mt-6 flex h-64 items-end gap-3">
            {weeklyCounts.map((count, index) => {
              const height = Math.max(12, Math.round((count / maxWeekly) * 100));
              return (
                <div key={labels[index]} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-primary/20" style={{ height: `${height}%` }}>
                    <div className="h-full w-full rounded-t-md bg-primary/70" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{labels[index]}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Platform Distribution</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>LinkedIn</span>
                <span>{linkedinPosts.length}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${totalPosts === 0 ? 0 : (linkedinPosts.length / totalPosts) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>X (Twitter)</span>
                <span>{twitterPosts.length}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-700"
                  style={{ width: `${totalPosts === 0 ? 0 : (twitterPosts.length / totalPosts) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Recent Postings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Content</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 8).map((post) => (
                <tr key={post.id} className="border-t border-slate-100">
                  <td className="px-6 py-3">{post.content}</td>
                  <td className="px-6 py-3 capitalize">{post.platform}</td>
                  <td className="px-6 py-3">{post.published ? "Published" : "Scheduled"}</td>
                  <td className="px-6 py-3">{labels[post.day_of_week]} {post.post_time.slice(0, 5)}</td>
                </tr>
              ))}
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                    No post data available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
