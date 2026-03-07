"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScheduleForm } from "@/components/ScheduleForm";
import type { PostRow } from "@/lib/types";

interface PostEditorProps {
  initialPost?: PostRow;
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initialPost?.image_url ?? null);
  const [postToLinkedIn, setPostToLinkedIn] = useState(initialPost ? initialPost.platform === "linkedin" : true);
  const [postToTwitter, setPostToTwitter] = useState(initialPost ? initialPost.platform === "twitter" : false);
  const [dayOfWeek, setDayOfWeek] = useState(initialPost?.day_of_week ?? 1);
  const [postTime, setPostTime] = useState((initialPost?.post_time ?? "09:00").slice(0, 5));
  const [repeatWeekly, setRepeatWeekly] = useState(initialPost?.repeat_weekly ?? true);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function onImageSelect(file: File) {
    setSelectedFileName(file.name);
    setUploading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) {
        setStatus(payload.error || "Image upload failed");
        return;
      }
      setImageUrl(payload.url);
      setStatus("Image uploaded");
    } finally {
      setUploading(false);
    }
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
            image_url: imageUrl,
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
            image_url: imageUrl,
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

    setStatus(isEditing ? "Post updated" : "Post scheduled");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 card p-6">
      <h2 className="text-xl font-semibold">{initialPost ? "Edit Post" : "Create New Post"}</h2>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-36 w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Write your post..."
        required
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Media Upload</p>
        <label
          htmlFor="post-image"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V6" />
              <path d="m8 10 4-4 4 4" />
              <path d="M20 16.5A3.5 3.5 0 0 0 16.5 13H16a5 5 0 1 0-9.5 2A3.5 3.5 0 0 0 7.5 22h9A3.5 3.5 0 0 0 20 18.5z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500">PNG, JPG or GIF (max 10MB)</p>
          </div>
          {selectedFileName ? <p className="text-xs font-medium text-primary">{selectedFileName}</p> : null}
        </label>
        <input
          id="post-image"
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onImageSelect(e.target.files[0])}
          className="hidden"
        />
        {uploading ? <p className="text-sm text-slate-600">Uploading image...</p> : null}
        {imageUrl ? <p className="text-sm text-emerald-600">Image uploaded and ready.</p> : null}
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

      {status ? <p className="text-sm text-slate-700">{status}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          Schedule Post
        </button>
        <button type="button" className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">
          Save Draft
        </button>
      </div>
    </form>
  );
}
