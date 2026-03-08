import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { PostRow } from "@/lib/types";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage() {
  noStore();

  const { data } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("published", false)
    .order("day_of_week", { ascending: true })
    .order("post_time", { ascending: true });

  const posts = (data ?? []) as PostRow[];
  const today = new Date().getDay();

  return (
    <AppShell
      active="calendar"
      title="Calendar"
      subtitle="Weekly schedule for all upcoming posts."
      action={
        <Link href="/create-post" className="rounded-lg bg-[#5048e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] transition-colors">
          + New Post
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dayNames.map((day, dayIndex) => {
          const items = posts.filter((p) => p.day_of_week === dayIndex);
          const isToday = dayIndex === today;
          return (
            <section
              key={day}
              className={`rounded-2xl border p-4 ${
                isToday
                  ? "border-[#5048e5]/50 bg-[#5048e5]/5"
                  : "border-zinc-800 bg-zinc-950"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-[#818cf8]" : "text-zinc-500"}`}>
                  {dayShort[dayIndex]}
                </h2>
                {items.length > 0 && (
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {items.map((post) => (
                  <article
                    key={post.id}
                    className={`rounded-xl p-3 ${
                      post.platform === "linkedin"
                        ? "bg-[#0a66c2]/20 border border-[#0a66c2]/30"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {post.platform === "linkedin" ? "in" : "𝕏"}
                      </span>
                      <span className="text-[10px] text-zinc-500">{post.post_time.slice(0, 5)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-zinc-300 leading-relaxed">{post.content}</p>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-zinc-700 py-2 text-center">—</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">No scheduled posts yet.</p>
          <Link href="/create-post" className="mt-3 inline-block text-sm font-semibold text-[#818cf8] hover:underline">
            Create your first post →
          </Link>
        </div>
      )}
    </AppShell>
  );
}
