import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Source } from "@/types";
import { checkRateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Fetch user's past saved results + search history for cross-session memory */
async function getUserMemory(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "";

    const [savedRes, historyRes] = await Promise.all([
      supabase
        .from("saved_results")
        .select("query, result")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false })
        .limit(8),
      supabase
        .from("search_history")
        .select("query, searched_at")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(15),
    ]);

    const lines: string[] = [];

    if (historyRes.data?.length) {
      lines.push("PAST SEARCHES (most recent first):");
      historyRes.data.forEach(h => lines.push(`- ${h.query}`));
    }

    if (savedRes.data?.length) {
      lines.push("\nSAVED RESEARCH HISTORY (what the user has already learned):");
      for (const s of savedRes.data) {
        const r = s.result as Record<string, unknown> | null;
        const summary = typeof r?.evidence_summary === "string"
          ? r.evidence_summary.substring(0, 200)
          : "";
        const personal = typeof r?.personalized_interpretation === "string"
          ? r.personalized_interpretation.substring(0, 150)
          : "";
        lines.push(`- Topic: "${s.query}"`);
        if (summary) lines.push(`  Evidence: ${summary}`);
        if (personal) lines.push(`  Personal: ${personal}`);
      }
    }

    return lines.length ? lines.join("\n") : "";
  } catch {
    return "";
  }
}

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

    // Fetch user memory in parallel with prompt construction
    const userMemory = await getUserMemory();

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

    const memoryBlock = userMemory
      ? `\nUSER'S RESEARCH HISTORY (use this to connect new findings to what they already know — e.g. "given your interest in creatine, here's how magnesium fits in"):\n${userMemory}\n`
      : "";

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system:
        "You are a health science research assistant that remembers what the user has previously researched. Connect new findings to their existing knowledge when relevant. Always respond with valid JSON only. No markdown fences, no preamble.",
      messages: [
        {
          role: "user",
          content: `Health evidence analyst. Synthesize ONLY these verified sources.
TOPIC: "${query}"

VERIFIED SOURCES:
${srcText}

USER CONTEXT:
${context || "No context provided"}${teenNote}
${memoryBlock}
Return ONLY valid JSON:
{
  "evidence_summary": "2-4 sentences with inline citations [1], [2][3] for EVERY factual claim.",
  "personalized_interpretation": "2-4 sentences applying to user. Reference their past research when relevant (e.g. 'since you've been looking into X, this relates because...'). Citations [1] for every claim.",
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

CRITICAL: Every factual claim MUST have [X] citation numbers. This is the core feature — nothing uncited.
CRITICAL: Only reference sources [1] through [${Math.min(sources.length, 5)}]. Do NOT invent citation numbers beyond what is provided.
IMPORTANT: If the user has researched related topics before, weave that context naturally into the personalized_interpretation — act like a coach who remembers past conversations.`,
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

    // Record this search in history
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("search_history").insert({
          user_id: user.id,
          query,
        });
      }
    } catch { /* best-effort */ }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
