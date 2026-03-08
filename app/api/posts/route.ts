import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { createMultiPostSchema, createPostSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publishedParam = searchParams.get("published");

  let query = supabaseAdmin.from("posts").select("*");

  if (publishedParam === "true") {
    query = query.eq("published", true).order("created_at", { ascending: false }).limit(20) as typeof query;
  } else if (publishedParam === "false") {
    query = query.eq("published", false).order("day_of_week", { ascending: true }).order("post_time", { ascending: true }) as typeof query;
  } else {
    query = query.order("created_at", { ascending: false }) as typeof query;
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsedMulti = createMultiPostSchema.safeParse(body);
  const parsedSingle = createPostSchema.safeParse(body);

  if (!parsedMulti.success && !parsedSingle.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const payload = parsedMulti.success
    ? parsedMulti.data.platforms.map((platform) => ({
        content: parsedMulti.data.content,
        image_url: parsedMulti.data.image_url ?? null,
        platform,
        day_of_week: parsedMulti.data.day_of_week,
        post_time: parsedMulti.data.post_time,
        repeat_weekly: parsedMulti.data.repeat_weekly,
        published: false
      }))
    : (() => {
        const single = parsedSingle.data!;
        return [
          {
            ...single,
            image_url: single.image_url ?? null,
            published: false
          }
        ];
      })();

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert(payload)
    .select("*");

  if (error) {
    console.error("POST /api/posts failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ posts: data }, { status: 201 });
}
