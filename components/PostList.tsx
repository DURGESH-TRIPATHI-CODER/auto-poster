"use client";

import { useState } from "react";
import type { PostRow } from "@/lib/types";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function PostList({ initialPosts, title }: { initialPosts: PostRow[]; title: string }) {
  const [posts, setPosts] = useState(initialPosts);

  async function removePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setPosts((cur) => cur.filter((post) => post.id !== id));
  }

  return (
    <section className="card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500">{post.platform}</p>
              {!post.published ? (
                <button onClick={() => removePost(post.id)} className="text-sm font-medium text-red-600">
                  Delete
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-sm">{post.content}</p>
            <p className="mt-2 text-sm text-slate-600">
              {days[post.day_of_week]} at {post.post_time.slice(0, 5)}
            </p>
          </article>
        ))}
        {posts.length === 0 ? <p className="text-sm text-slate-600">No posts available.</p> : null}
      </div>
    </section>
  );
}
