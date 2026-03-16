import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Source } from "@/types";
import { checkRateLimit } from "@/lib/ratelimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req);
  if (limited) return limited;

  try {
    const { query, sources, context } = await req.json() as {
      query: string;
      sources: Source[];
      context: string;
    };

    if (!query || !sources?.length) {
      return NextResponse.json({ error: "Missing query or sources" }, { status: 400 });
    }

    if (sources.length < 2) {
      return NextResponse.json({
        insufficient: true,
        sourceCount: sources.length,
        sources,
      });
    }

    const isTeen = context?.toLowerCase().includes("teen");
    const teenNote = isTeen
      ? "\nCRITICAL: User is a teenager. NEVER suggest calorie restriction or weight-loss dieting."
      : "";

    const srcText = sources
      .slice(0, 5)
      .map(
        (s, i) =>
          `[${i + 1}] ${s.title} (${s.authors}, ${s.year}, ${s.journal})${
            s.abstract ? `\n${s.abstract.substring(0, 150)}` : ""
          }`
      )
      .join("\n");

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system:
        "You are a health science research assistant. Always respond with valid JSON only. No markdown fences, no preamble.",
      messages: [
        {
          role: "user",
          content: `Health evidence analyst. Synthesize ONLY these verified sources.
TOPIC: "${query}"

VERIFIED SOURCES:
${srcText}

USER CONTEXT:
${context || "No context provided"}${teenNote}

Return ONLY valid JSON:
{
  "evidence_summary": "2-4 sentences with inline citations [1], [2][3] for EVERY factual claim.",
  "personalized_interpretation": "2-4 sentences applying to user. Citations [1] for every claim.",
  "context_fit": {
    "matches": ["strength relevant to their profile"],
    "gaps": ["limitations or unknowns for their situation"],
    "track_next": ["actionable tracking item"]
  },
  "evidence_quality": {
    "level": "High/Moderate/Low",
    "explanation": "1-2 sentences on quality."
  },
  "practical_steps": [
    "Step 1 with citation [X]",
    "Step 2 with citation [X]",
    "Step 3 with citation [X]"
  ],
  "safety_note": "One important safety or limitation note."
}

CRITICAL: Every factual claim MUST have [X] citation numbers. This is the core feature — nothing uncited.`,
        },
      ],
    });

    const raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n");

    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    result.sources = sources;
    result.last_updated = new Date().toISOString().split("T")[0];

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
