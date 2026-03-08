import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { createPostSchema } from "@/lib/validators";
import { postToLinkedIn } from "@/lib/linkedinBot";
import { postToTwitter } from "@/lib/twitterBot";
import { sendPostPublishedEmail } from "@/lib/email";
import type { PostRow } from "@/lib/types";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update({
      ...parsed.data,
      image_url: parsed.data.image_url ?? null
    })
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

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  const post = data as PostRow;

  try {
    let postUrl: string | undefined;
    if (post.platform === "linkedin") {
      postUrl = await postToLinkedIn({ content: post.content });
    } else {
      postUrl = await postToTwitter({ content: post.content });
    }

    await supabaseAdmin
      .from("posts")
      .update({
        published: post.repeat_weekly ? false : true,
        last_published_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    sendPostPublishedEmail(post.platform, post.content, postUrl).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
