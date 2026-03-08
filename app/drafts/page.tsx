"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

interface DraftItem {
  id: string;
  content: string;
  imageUrl: string | null;
  postToLinkedIn: boolean;
  postToTwitter: boolean;
  dayOfWeek: number;
  postTime: string;
  repeatWeekly: boolean;
  createdAt: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("narada_drafts") || "[]") as DraftItem[];
    setDrafts(items);
  }, []);

  function removeDraft(id: string) {
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    localStorage.setItem("narada_drafts", JSON.stringify(next));
  }

  return (
    <AppShell active="drafts" title="Drafts" subtitle="Saved post drafts — ready to schedule.">
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Saved Drafts</h2>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-400">
            {drafts.length}
          </span>
        </div>

        <div className="space-y-3">
          {drafts.map((draft) => {
            const platforms = [draft.postToLinkedIn && "LinkedIn", draft.postToTwitter && "X"]
              .filter(Boolean)
              .join(", ");
            return (
              <article key={draft.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2">
                    {draft.content || <span className="text-zinc-500 italic">Untitled draft</span>}
                  </p>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/create-post?draftId=${draft.id}`}
                      className="text-sm font-medium text-[#818cf8] hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeDraft(draft.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                    {dayNames[draft.dayOfWeek]} · {draft.postTime}
                  </span>
                  {platforms && (
                    <span className="rounded-md bg-[#5048e5]/15 px-2 py-0.5 text-xs text-[#818cf8]">
                      {platforms}
                    </span>
                  )}
                  {draft.repeatWeekly && (
                    <span className="rounded-md bg-zinc-700 px-2 py-0.5 text-xs text-zinc-500">
                      Weekly
                    </span>
                  )}
                </div>
              </article>
            );
          })}

          {drafts.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-zinc-500">No drafts yet.</p>
              <Link href="/create-post" className="mt-2 inline-block text-sm font-semibold text-[#818cf8] hover:underline">
                Create a post →
              </Link>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
