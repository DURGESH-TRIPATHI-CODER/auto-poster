"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScheduleForm } from "@/components/ScheduleForm";
import type { PostRow } from "@/lib/types";

interface PostEditorProps {
  initialPost?: PostRow;
  draftId?: string;
}

export function PostEditor({ initialPost, draftId }: PostEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [images, setImages] = useState<Array<{ name: string; url: string }>>(
    initialPost?.image_url ? [{ name: "existing", url: initialPost.image_url }] : []
  );
  const [postToLinkedIn, setPostToLinkedIn] = useState(initialPost ? initialPost.platform === "linkedin" : true);
  const [postToTwitter, setPostToTwitter] = useState(initialPost ? initialPost.platform === "twitter" : false);
  const [dayOfWeek, setDayOfWeek] = useState(initialPost?.day_of_week ?? 1);
  const [postTime, setPostTime] = useState((initialPost?.post_time ?? "09:00").slice(0, 5));
  const [repeatWeekly, setRepeatWeekly] = useState(initialPost?.repeat_weekly ?? true);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string; index: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || initialPost || !draftId) return;
    const drafts = JSON.parse(localStorage.getItem("autoposter_drafts") || "[]") as Array<{
      id: string;
      content: string;
      imageUrl: string | null;
      postToLinkedIn: boolean;
      postToTwitter: boolean;
      dayOfWeek: number;
      postTime: string;
      repeatWeekly: boolean;
    }>;
    const selected = drafts.find((item) => item.id === draftId);
    if (!selected) return;

    setContent(selected.content ?? "");
    setImages(selected.imageUrl ? [{ name: "draft", url: selected.imageUrl }] : []);
    setPostToLinkedIn(Boolean(selected.postToLinkedIn));
    setPostToTwitter(Boolean(selected.postToTwitter));
    setDayOfWeek(selected.dayOfWeek ?? 1);
    setPostTime((selected.postTime ?? "09:00").slice(0, 5));
    setRepeatWeekly(selected.repeatWeekly ?? true);
    setStatus("Draft loaded");
  }, [mounted, initialPost, draftId]);

  function getNextScheduledDate(selectedDay: number, time: string) {
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const candidate = new Date(now);
    const dayDelta = (selectedDay - now.getDay() + 7) % 7;
    candidate.setDate(now.getDate() + dayDelta);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
    return candidate;
  }

  function formatScheduledDate(date: Date) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hour24 = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, "0");
    const ampm = hour24 >= 12 ? "PM" : "AM";
    const hour12 = ((hour24 + 11) % 12) + 1;
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${hour12
      .toString()
      .padStart(2, "0")}:${minute} ${ampm}`;
  }

  const scheduledLabel = useMemo(() => {
    if (!mounted) return "Calculating...";
    return formatScheduledDate(getNextScheduledDate(dayOfWeek, postTime));
  }, [mounted, dayOfWeek, postTime]);

  function saveDraft() {
    const id = draftId ?? crypto.randomUUID();
    const draft = {
      id,
      content,
      imageUrl: images[0]?.url ?? null,
      postToLinkedIn,
      postToTwitter,
      dayOfWeek,
      postTime,
      repeatWeekly,
      createdAt: new Date().toISOString()
    };

    const current = JSON.parse(localStorage.getItem("autoposter_drafts") || "[]");
    const next = [draft, ...current.filter((item: { id: string }) => item.id !== id)];
    localStorage.setItem("autoposter_drafts", JSON.stringify(next));
    setStatus(draftId ? "Draft updated" : "Draft saved");
  }

  async function enhanceContent() {
    if (!content.trim()) {
      setStatus("Write something first before enhancing.");
      return;
    }
    setEnhancing(true);
    setStatus(null);
    const platforms: string[] = [];
    if (postToLinkedIn) platforms.push("linkedin");
    if (postToTwitter) platforms.push("twitter");
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platforms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Enhancement failed");
      } else {
        setContent(data.enhanced);
        setStatus("Content enhanced by AI");
      }
    } catch {
      setStatus("Enhancement request failed");
    } finally {
      setEnhancing(false);
    }
  }

  async function onFilesSelect(files: FileList) {
    setUploading(true);
    setStatus(null);
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const payload = await res.json();
        if (!res.ok) {
          setStatus(payload.error || "Image upload failed");
          continue;
        }
        setImages((prev) => [...prev, { name: file.name, url: payload.url }]);
      } catch {
        setStatus("Upload failed for " + file.name);
      }
    }
    setUploading(false);
    const input = document.getElementById("post-image") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const isEditing = Boolean(initialPost);
    const platforms: Array<"linkedin" | "twitter"> = [];
    if (postToLinkedIn) platforms.push("linkedin");
    if (postToTwitter) platforms.push("twitter");

    if (platforms.length === 0) {
      setStatus("Select at least one platform.");
      return;
    }

    const response = isEditing
      ? await fetch(`/api/posts/${initialPost!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            image_url: images[0]?.url ?? null,
            platform: platforms[0],
            day_of_week: dayOfWeek,
            post_time: postTime,
            repeat_weekly: repeatWeekly
          })
        })
      : await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            image_url: images[0]?.url ?? null,
            platforms,
            day_of_week: dayOfWeek,
            post_time: postTime,
            repeat_weekly: repeatWeekly
          })
        });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Failed to create post");
      return;
    }

    if (draftId) {
      const current = JSON.parse(localStorage.getItem("autoposter_drafts") || "[]");
      const next = current.filter((item: { id: string }) => item.id !== draftId);
      localStorage.setItem("autoposter_drafts", JSON.stringify(next));
    }

    setStatus(isEditing ? "Post updated" : "Post scheduled");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 card p-6">
      <h2 className="text-xl font-semibold">{initialPost ? "Edit Post" : "Create New Post"}</h2>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-36 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-sm text-white placeholder-zinc-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Write your post..."
          required
        />
        <button
          type="button"
          onClick={enhanceContent}
          disabled={enhancing}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30"
          title="Enhance with Mistral AI"
        >
          {enhancing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Enhancing...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              </svg>
              Enhance with AI
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-zinc-300">Media Upload</p>
        <label
          htmlFor="post-image"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 p-8 text-center transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V6" />
              <path d="m8 10 4-4 4 4" />
              <path d="M20 16.5A3.5 3.5 0 0 0 16.5 13H16a5 5 0 1 0-9.5 2A3.5 3.5 0 0 0 7.5 22h9A3.5 3.5 0 0 0 20 18.5z" />
            </svg>
          </span>
          <div>
            <p className={`text-sm font-semibold ${uploading ? "text-primary" : "text-zinc-200"}`}>
              {uploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-zinc-500">PNG, JPG or GIF (max 10MB) — multiple allowed</p>
          </div>
        </label>
        <input
          id="post-image"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && e.target.files.length > 0 && onFilesSelect(e.target.files)}
          className="hidden"
        />
        {images.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImages([])}
              className="flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
              Remove all
            </button>
            {images.map((img, i) => (
              <div key={img.url} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPreview({ url: img.url, name: img.name, index: i })}
                  className="flex items-center gap-1.5 hover:text-primary transition"
                  title="Preview image"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                    <circle cx="9" cy="13" r="2" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span className="max-w-[120px] truncate">{img.name}</span>
                </button>
                {i === 0 && <span className="rounded bg-primary/20 px-1 text-[10px] font-semibold text-primary">main</span>}
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="ml-1 rounded text-zinc-500 hover:text-red-400 transition"
                  aria-label="Remove image"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScheduleForm
        postToLinkedIn={postToLinkedIn}
        postToTwitter={postToTwitter}
        dayOfWeek={dayOfWeek}
        postTime={postTime}
        repeatWeekly={repeatWeekly}
        onPostToLinkedInChange={setPostToLinkedIn}
        onPostToTwitterChange={setPostToTwitter}
        onDayOfWeekChange={setDayOfWeek}
        onPostTimeChange={setPostTime}
        onRepeatWeeklyChange={setRepeatWeekly}
      />

      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 text-sm text-zinc-300">
        Scheduled for:{" "}
        <span className="font-semibold text-white">{scheduledLabel}</span>
      </div>

      {status ? <p className="text-sm text-slate-700">{status}</p> : null}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-3xl w-full flex-col rounded-2xl bg-zinc-900 shadow-2xl overflow-hidden border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-700 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                  <circle cx="9" cy="13" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="truncate text-sm font-semibold text-white">{preview.name}</span>
                {preview.index === 0 && (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">main</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImages((prev) => prev.filter((_, idx) => idx !== preview.index));
                    setPreview(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900 transition"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-700 transition"
                  aria-label="Close preview"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex items-center justify-center bg-zinc-950 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.name}
                className="max-h-[70vh] max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          Schedule Post
        </button>
        <button type="button" onClick={saveDraft} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">
          Save Draft
        </button>
      </div>
    </form>
  );
}
