import { NextRequest, NextResponse } from "next/server";

type Tone = "short" | "professional" | "casual" | "storytelling" | "viral";

const toneRules: Record<Tone, string> = {
  short:
    "TONE — SHORT & CONCISE: Maximum 3 sentences. Every word must earn its place. Cut all filler. No intro, no outro. Get straight to the point. If it can be said in fewer words, say it in fewer words.",
  professional:
    "TONE — PROFESSIONAL: Authoritative but human. Write like a senior person sharing a hard-earned insight. No fluff, no motivational poster language. Structured thinking, clear point of view. Can be slightly longer but every sentence must add value.",
  casual:
    "TONE — CASUAL: Like you're texting a smart friend. Relaxed, direct, maybe a little unpolished — that's fine. Use contractions. Short lines. Can have a dry sense of humor. No formality at all.",
  storytelling:
    "TONE — STORYTELLING: Hook in the first line (make them stop scrolling). Then a short personal story or situation. End with one clear takeaway or lesson. Max 5-6 short paragraphs. Each paragraph = 1-2 lines.",
  viral:
    "TONE — VIRAL HOOK: The first line must be so good that people can't scroll past it. Use curiosity, contrast, or a bold statement. Short punchy lines throughout. Build tension then deliver the payoff. End with something memorable.",
};

export async function POST(req: NextRequest) {
  const { content, platforms, tone } = await req.json();

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
    platformNote = "Platform: LinkedIn + X (Twitter). Keep it under 280 characters if possible, but prioritize quality.";
  } else if (isTwitter) {
    platformNote = "Platform: X (Twitter). Keep it under 280 characters. Be punchy and concise.";
  } else {
    platformNote = "Platform: LinkedIn. Can be longer, add 3-5 relevant hashtags at the end.";
  }

  const selectedToneRule = toneRules[(tone as Tone) ?? "short"] ?? toneRules.short;

  const systemPrompt = `You are a ghostwriter who writes social media posts that sound exactly like a real human wrote them.

BASE RULES (always apply):
- Write in first person
- Natural sentence flow — fragments and short lines are fine
- NO buzzwords: never use "game-changer", "dive into", "leverage", "unlock", "empower", "elevate", "innovative", "cutting-edge", "delve", "crucial", "paramount", "foster", "pivotal", "seamless", "revolutionize"
- NO AI patterns: no "In today's world", "It's important to note", "In conclusion", "I hope this finds you well"
- NO excessive emojis — max 1-2 only if they feel natural
- NO hype or salesy language
- Keep the original meaning and key message
- ${platformNote}

${selectedToneRule}

Return ONLY the rewritten post. No explanations, no labels, no quotes.`;

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
      max_tokens: 600,
      temperature: 0.75,
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
