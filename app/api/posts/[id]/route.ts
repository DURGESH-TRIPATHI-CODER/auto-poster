import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { createPostSchema } from "@/lib/validators";
import type { PostRow } from "@/lib/types";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update({ ...parsed.data, image_url: parsed.data.image_url ?? null })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin.from("posts").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// "Publish Now" — triggers GitHub Actions workflow_dispatch with force=true
// Playwright cannot run on Netlify serverless; GitHub Actions handles all bot execution.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!pat || !owner || !repo) {
    return NextResponse.json(
      { error: "GITHUB_PAT, GITHUB_REPO_OWNER, GITHUB_REPO_NAME env vars are not set." },
      { status: 500 }
    );
  }

  // Trigger the GitHub Actions workflow with force=true
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/worker.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { force: "true" } }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `GitHub dispatch failed: ${text}` }, { status: 500 });
  }

  // GitHub Actions will publish the post within ~30 seconds.
  // Mark last_published_at optimistically so the UI reflects the action.
  await supabaseAdmin
    .from("posts")
    .update({ last_published_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.json({ ok: true, queued: true });
}
