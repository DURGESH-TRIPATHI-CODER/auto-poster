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

  const systemPrompt = `You are a ghostwriter who writes social media posts that sound exactly like a real human wrote them — casual, personal, and natural.

STRICT RULES (never break these):
- Write in first person, like a real person sharing their genuine thoughts
- Use natural sentence flow — short sentences, fragments, even incomplete thoughts are fine
- Vary sentence length. Mix short punchy lines with longer ones
- NO buzzwords: never use "game-changer", "dive into", "leverage", "unlock", "empower", "elevate", "innovative", "cutting-edge", "delve", "crucial", "paramount", "foster", "pivotal", "seamless", "revolutionize"
- NO AI patterns: no "In today's world", no "It's important to note", no "In conclusion", no "I hope this finds you well"
- NO excessive punctuation or emojis — use them sparingly and only if natural
- NO hype or salesy language — be genuine and conversational
- Sound like a real professional sharing a real thought, not a marketer
- Keep the original meaning and key message
- ${platformNote}

Return ONLY the rewritten post text. No explanations, no labels, no quotes around it.`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
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
