"use client";

import { useEffect, useRef, useState } from "react";
import type { PostRow } from "@/lib/types";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface PostListProps {
  initialPosts: PostRow[];
  title: string;
  published: boolean;
}

export function PostList({ initialPosts, title, published }: PostListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [publishedIds, setPublishedIds] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchPosts() {
    try {
      const res = await fetch(`/api/posts?published=${published}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts ?? []);
      setLastUpdated(new Date());
    } catch {
      // silently ignore network errors during polling
    }
  }

  useEffect(() => {
    fetchPosts();
    intervalRef.current = setInterval(fetchPosts, 15_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [published]);

  async function removePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setPosts((cur) => cur.filter((post) => post.id !== id));
  }

  async function publishNow(id: string) {
    setPublishing((cur) => ({ ...cur, [id]: true }));
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "POST" });
      if (res.ok) {
        setPublishedIds((cur) => ({ ...cur, [id]: true }));
        await fetchPosts();
        setTimeout(() => setPublishedIds((cur) => { const next = { ...cur }; delete next[id]; return next; }), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Publish failed: " + (data.error ?? "unknown error"));
      }
    } finally {
      setPublishing((cur) => ({ ...cur, [id]: false }));
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-zinc-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={fetchPosts}
            title="Refresh now"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center justify-between">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                post.platform === "linkedin"
                  ? "bg-[#0a66c2]/20 text-[#5ba4f5]"
                  : "bg-zinc-700 text-zinc-400"
              }`}>
                {post.platform === "linkedin" ? "LinkedIn" : "X / Twitter"}
              </span>
              {!post.published ? (
                <div className="flex items-center gap-3">
                  <a href={`/posts/${post.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                    Edit
                  </a>
                  <button onClick={() => removePost(post.id)} className="text-sm font-medium text-red-500">
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-sm">{post.content}</p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">
                  {days[post.day_of_week]} at {post.post_time.slice(0, 5)}
                  {post.repeat_weekly && <span className="ml-2 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">weekly</span>}
                </p>
                {post.last_published_at && (
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Last published {new Date(post.last_published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              {!post.published && (
                <button
                  onClick={() => publishNow(post.id)}
                  disabled={publishing[post.id]}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold text-white transition disabled:opacity-50 ${
                    publishedIds[post.id]
                      ? "bg-emerald-700 cursor-default"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  {publishing[post.id] ? "Posting…" : publishedIds[post.id] ? "✓ Published" : "Publish Now"}
                </button>
              )}
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-600">No posts here yet.</p>
        )}
      </div>
    </section>
  );
}
