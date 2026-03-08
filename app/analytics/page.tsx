import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { LineChart } from "@/components/LineChart";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { PostRow } from "@/lib/types";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default async function AnalyticsPage() {
  noStore();

  const { data } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("created_at", { ascending: true });
  const posts = (data ?? []) as PostRow[];

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.published);
  const linkedinPosts = posts.filter((p) => p.platform === "linkedin");
  const twitterPosts = posts.filter((p) => p.platform === "twitter");
  const weeklyCounts = Array.from({ length: 7 }, (_, day) =>
    posts.filter((p) => p.day_of_week === day).length
  );
  const maxWeekly = Math.max(...weeklyCounts, 1);

  // Build Recharts-compatible data arrays
  const days = last14Days();

  const activityData = days.map((d) => ({
    date: shortDate(d),
    Created: posts.filter((p) => p.created_at.slice(0, 10) === d).length,
    Published: posts.filter((p) => p.last_published_at?.slice(0, 10) === d).length,
  }));

  const platformData = days.map((d) => ({
    date: shortDate(d),
    LinkedIn: posts.filter((p) => p.platform === "linkedin" && p.created_at.slice(0, 10) === d).length,
    X: posts.filter((p) => p.platform === "twitter" && p.created_at.slice(0, 10) === d).length,
  }));

  return (
    <AppShell active="analytics" title="Analytics Dashboard" subtitle="Cross-platform publishing and scheduling insights.">

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="card p-5">
          <p className="text-sm text-zinc-500">Total Posts</p>
          <p className="mt-2 text-3xl font-bold">{totalPosts}</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-zinc-500">Published</p>
          <p className="mt-2 text-3xl font-bold">{publishedPosts.length}</p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-zinc-500">LinkedIn Share</p>
          <p className="mt-2 text-3xl font-bold">
            {totalPosts === 0 ? 0 : Math.round((linkedinPosts.length / totalPosts) * 100)}%
          </p>
        </section>
        <section className="card p-5">
          <p className="text-sm text-zinc-500">X Share</p>
          <p className="mt-2 text-3xl font-bold">
            {totalPosts === 0 ? 0 : Math.round((twitterPosts.length / totalPosts) * 100)}%
          </p>
        </section>
      </div>

      {/* Line chart — Created vs Published */}
      <section className="card mt-6 p-6">
        <div className="mb-2">
          <h2 className="text-lg font-semibold">Posts Over Time</h2>
          <p className="text-xs text-zinc-500">Last 14 days — created vs published</p>
        </div>
        <LineChart
          data={activityData}
          xKey="date"
          series={[
            { label: "Created", color: "#5048e5", dataKey: "Created" },
            { label: "Published", color: "#10b981", dataKey: "Published" },
          ]}
        />
      </section>

      {/* Line chart — LinkedIn vs X */}
      <section className="card mt-6 p-6">
        <div className="mb-2">
          <h2 className="text-lg font-semibold">Platform Activity</h2>
          <p className="text-xs text-zinc-500">Last 14 days — LinkedIn vs X</p>
        </div>
        <LineChart
          data={platformData}
          xKey="date"
          series={[
            { label: "LinkedIn", color: "#0a66c2", dataKey: "LinkedIn" },
            { label: "X (Twitter)", color: "#d4d4d8", dataKey: "X" },
          ]}
        />
      </section>

      {/* Weekly bar + Platform distribution */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Weekly Schedule Distribution</h2>
          <p className="text-xs text-zinc-500 mb-6">Posts scheduled per day of week</p>
          <div className="flex h-48 items-end gap-3">
            {weeklyCounts.map((count, index) => {
              const height = Math.max(8, Math.round((count / maxWeekly) * 100));
              return (
                <div key={dayLabels[index]} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">{count > 0 ? count : ""}</span>
                  <div className="w-full rounded-t-md bg-primary/15" style={{ height: `${height}%` }}>
                    <div className="h-full w-full rounded-t-md bg-primary/65" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">{dayLabels[index]}</span>
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
                <span className="text-zinc-400">{linkedinPosts.length}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-700">
                <div
                  className="h-full rounded-full bg-[#0a66c2] transition-all"
                  style={{ width: `${totalPosts === 0 ? 0 : (linkedinPosts.length / totalPosts) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>X (Twitter)</span>
                <span className="text-zinc-400">{twitterPosts.length}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-700">
                <div
                  className="h-full rounded-full bg-zinc-300 transition-all"
                  style={{ width: `${totalPosts === 0 ? 0 : (twitterPosts.length / totalPosts) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-500 mb-3">Publish Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">
                {totalPosts === 0 ? 0 : Math.round((publishedPosts.length / totalPosts) * 100)}%
              </p>
              <p className="mb-1 text-xs text-zinc-500">{publishedPosts.length} of {totalPosts}</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${totalPosts === 0 ? 0 : (publishedPosts.length / totalPosts) * 100}%` }}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Table */}
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Recent Postings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-800/60 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-3">Content</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(-8).reverse().map((post) => (
                <tr key={post.id} className="border-t border-zinc-800">
                  <td className="max-w-xs truncate px-6 py-3 text-zinc-300">{post.content}</td>
                  <td className="px-6 py-3 capitalize text-zinc-400">{post.platform}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      post.published ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary"
                    }`}>
                      {post.published ? "Published" : "Scheduled"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-zinc-400">
                    {dayLabels[post.day_of_week]} {post.post_time.slice(0, 5)}
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No post data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </AppShell>
  );
}
