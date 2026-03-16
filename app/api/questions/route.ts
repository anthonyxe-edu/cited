import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { UserProfile } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function summarizeProfile(profile: UserProfile | null): string {
  if (!profile) return "No profile set.";
  const parts: string[] = [];
  if (profile.ageRange) parts.push(`Age: ${profile.ageRange}`);
  if (profile.sex) parts.push(`Sex: ${profile.sex}`);
  if (profile.activityLevel) parts.push(`Activity: ${profile.activityLevel}`);
  if (profile.goals) parts.push(`Goal: ${profile.goals}`);
  if (profile.dietPattern) parts.push(`Diet: ${profile.dietPattern}`);
  if (profile.sleepQuality) parts.push(`Sleep: ${profile.sleepQuality}`);
  if (profile.healthConditions) parts.push(`Health conditions: ${profile.healthConditions}`);
  if (profile.supplements) parts.push(`Supplements: ${profile.supplements}`);
  return parts.length ? parts.join(" | ") : "No profile set.";
}

export async function POST(req: NextRequest) {
  try {
    const { query, profile } = await req.json() as { query: string; profile: UserProfile | null };
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const profileSummary = summarizeProfile(profile);

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: "You are a health coach. Respond with valid JSON only. No markdown, no preamble.",
      messages: [
        {
          role: "user",
          content: `You already know this about the user: ${profileSummary}

They just searched: "${query}"

Generate EXACTLY 2-3 short, direct questions to better personalize this specific answer.

STRICT RULES:
- NEVER ask about age, sex, activity level, general goals, diet, health conditions, sleep, or supplements — you already know these
- Only ask what you do NOT yet know that would change your advice for THIS specific query
- Focus on: (1) current experience or practice related to this exact topic, (2) specific barriers or challenges, (3) what outcome they want from THIS search
- Keep questions conversational and short — like a coach, not a doctor
- 3-4 answer options max per question

Return ONLY valid JSON:
{"questions":[{"id":"q1","text":"...","type":"single","options":["A","B","C"],"required":true}]}`,
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
