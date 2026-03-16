import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { JournalEntry, Source } from "@/types";
import { checkRateLimit } from "@/lib/ratelimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req);
  if (limited) return limited;

  try {
    const { query, entries, profileContext } = await req.json() as {
      query: string;
      entries: JournalEntry[];
      profileContext?: string;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // ── Step 1: Search PubMed broadly — no journal specifics here.
    // Journal entries are personal variables, not search terms.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchMsg = await (anthropic.messages.create as any)({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
      messages: [
        {
          role: "user",
          content: `Find 4-5 peer-reviewed papers about: "${query}"
Return JSON array only, no other text:
[{"title":"...","authors":"Last et al","year":"...","journal":"...","doi":"...","pmid":"...","source_db":"PubMed","abstract":"1 sentence","study_type":"RCT/meta-analysis/cohort"}]`,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSearch = (searchMsg.content as any[])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text as string)
      .join("\n");

    const jsonMatch = rawSearch.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No papers found for this topic.", insufficient: true });
    }

    const rawSources: Record<string, string>[] = JSON.parse(jsonMatch[0]);
    const sources: Source[] = rawSources
      .map((s) => ({
        title: s.title || "Untitled",
        authors: s.authors || "",
        year: s.year || "",
        journal: s.journal || "",
        doi: s.doi || null,
        pmid: s.pmid || null,
        url: s.doi
          ? `https://doi.org/${s.doi}`
          : s.pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}`
          : null,
        type: s.study_type || "article",
        source_db: s.source_db || "PubMed",
        abstract: s.abstract || "",
        citedByCount: 0,
        verified: !!(s.doi || s.pmid),
      }))
      .filter((s) => s.verified && s.url);

    if (sources.length < 2) {
      return NextResponse.json({ error: "Insufficient sources found.", insufficient: true, sources });
    }

    // ── Step 2: Build journal context block
    const journalBlock = entries.length > 0
      ? entries
          .slice(0, 12) // cap to avoid token overload
          .map((e, i) => `Entry ${i + 1}${e.title ? ` — ${e.title}` : ""} [${e.type}]:\n${e.content}`)
          .join("\n\n")
      : "No journal entries provided.";

    const srcText = sources
      .slice(0, 5)
      .map(
        (s, i) =>
          `[${i + 1}] ${s.title} (${s.authors}, ${s.year}, ${s.journal})${
            s.abstract ? `\n${s.abstract.substring(0, 180)}` : ""
          }`
      )
      .join("\n");

    // ── Step 3: Analyze — evidence stays broad, personalization uses journal data
    const analyzeMsg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      system:
        "You are a health science research assistant. Always respond with valid JSON only. No markdown fences, no preamble.",
      messages: [
        {
          role: "user",
          content: `TOPIC: "${query}"

VERIFIED SOURCES:
${srcText}

USER PROFILE:
${profileContext || "Not provided"}

PERSONAL JOURNAL ENTRIES:
${journalBlock}

INSTRUCTIONS:
- evidence_summary: Synthesize what the research says broadly about the topic. Cite [1][2] for every claim. Do NOT mention the user's journal here.
- personalized_interpretation: Use the journal entries deeply. Map the research findings onto the user's SPECIFIC situation (their workouts, diet, sleep, symptoms, etc.). Be direct and concrete. Cite [X] for every claim.
- practical_steps: Give 3-4 HIGHLY SPECIFIC steps calibrated to what the journal reveals. Not generic advice — reference their actual habits. Cite [X].
- context_fit.matches: Ways the research directly applies to this user's situation.
- context_fit.gaps: What the research doesn't cover about their specific case.
- context_fit.track_next: Exact metrics or habits the user should track given their journal.

Return ONLY valid JSON:
{
  "evidence_summary": "2-4 sentences with [1][2] citations.",
  "personalized_interpretation": "2-4 sentences using journal specifics with [X] citations.",
  "context_fit": {
    "matches": ["..."],
    "gaps": ["..."],
    "track_next": ["..."]
  },
  "evidence_quality": {
    "level": "High/Moderate/Low",
    "explanation": "1-2 sentences."
  },
  "practical_steps": [
    "Specific step with [X] citation",
    "Specific step with [X] citation",
    "Specific step with [X] citation"
  ],
  "safety_note": "One safety or limitation note."
}`,
        },
      ],
    });

    const rawAnalyze = analyzeMsg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n");

    const result = JSON.parse(rawAnalyze.replace(/```json|```/g, "").trim());
    result.sources = sources;
    result.last_updated = new Date().toISOString().split("T")[0];

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
