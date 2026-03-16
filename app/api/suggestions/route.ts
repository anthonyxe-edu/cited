import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { profile, recentSearches, savedTopics } = await req.json();

    const profileCtx = profile
      ? Object.entries(profile as Record<string, string>)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "not set";

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system:
        "You are a health science research assistant. Always respond with valid JSON only. No markdown fences, no preamble.",
      messages: [
        {
          role: "user",
          content: `Generate 4-5 personalized health & wellness suggestions.

User profile: ${profileCtx}
Recent searches: ${(recentSearches as string[])?.slice(0, 5).join(", ") || "none"}
Saved research: ${(savedTopics as string[])?.slice(0, 5).join(", ") || "none"}

Return ONLY valid JSON:
{"suggestions":[
  {
    "category": "nutrition|exercise|recovery|wellness|sleep",
    "title": "Short actionable title",
    "summary": "1-2 sentence personalized recommendation",
    "detail": "2-3 sentences with specific, practical steps",
    "why": "1 sentence on why this matters for their context"
  }
]}

Rules:
- SPECIFIC to their profile, age, goals, and recent searches
- Each suggestion immediately actionable
- category MUST be one of: nutrition, exercise, recovery, wellness, sleep`,
        },
      ],
    });

    const raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n");

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
