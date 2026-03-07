import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { supabaseAdmin } from "@/lib/supabaseClient";
import type { PostRow } from "@/lib/types";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function CalendarPage() {
  noStore();

  const { data } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("published", false)
    .order("day_of_week", { ascending: true })
    .order("post_time", { ascending: true });

  const posts = (data ?? []) as PostRow[];

  return (
    <AppShell
      active="calendar"
      title="Calendar View"
      subtitle="Weekly schedule for all upcoming posts."
      action={
        <Link href="/create-post" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          New Post
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dayNames.map((day, dayIndex) => {
          const items = posts.filter((post) => post.day_of_week === dayIndex);
          return (
            <section key={day} className="card p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{day}</h2>
              <div className="mt-3 space-y-3">
                {items.map((post) => (
                  <article
                    key={post.id}
                    className={`rounded-xl p-3 text-white ${post.platform === "linkedin" ? "bg-[#0a66c2]" : "bg-slate-900"}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>{post.post_time.slice(0, 5)}</span>
                      <span className="uppercase">{post.platform}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm">{post.content}</p>
                  </article>
                ))}
                {items.length === 0 ? <p className="text-sm text-slate-500">No posts</p> : null}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
