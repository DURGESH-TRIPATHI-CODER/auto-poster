import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { content, platforms } = await req.json();

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
  }

  const platformList: string[] = Array.isArray(platforms) ? platforms : ["linkedin"];
  const isTwitter = platformList.includes("twitter");
  const isLinkedIn = platformList.includes("linkedin");

  let platformNote = "";
  if (isTwitter && isLinkedIn) {
    platformNote = "The post will be shared on both LinkedIn and X (Twitter). Keep it under 280 characters if possible, but prioritize quality.";
  } else if (isTwitter) {
    platformNote = "The post is for X (Twitter). Keep it under 280 characters. Be punchy and concise.";
  } else {
    platformNote = "The post is for LinkedIn. Professional tone, can be longer, use relevant hashtags at the end.";
  }

  const systemPrompt = `You are a professional social media copywriter. Enhance the given post to be more engaging, clear, and impactful. ${platformNote} Return ONLY the enhanced post text — no explanations, no quotes, no extra commentary.`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content.trim() },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenRouter error:", err);
    let message = "AI enhancement failed";
    try {
      const parsed = JSON.parse(err);
      message = parsed?.error?.message ?? parsed?.message ?? message;
    } catch {}
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const data = await res.json();
  const enhanced = data.choices?.[0]?.message?.content?.trim();
  if (!enhanced) {
    return NextResponse.json({ error: "No response from AI" }, { status: 502 });
  }

  return NextResponse.json({ enhanced });
}
