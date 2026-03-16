import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Source } from "@/types";
import { checkUsage, incrementUsage } from "@/lib/usage";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODELS = {
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-haiku-4-5-20251001",
};

export async function POST(req: NextRequest) {
  const usage = await checkUsage();

  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Search limit reached", upgrade: usage.upgrade, plan: usage.plan },
      { status: 429 }
    );
  }

  try {
    const { query, context } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchMsg = await (anthropic.messages.create as any)({
      model: MODELS[usage.model],
      max_tokens: 1400,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
      messages: [
        {
          role: "user",
          content: `Find 4-5 peer-reviewed papers about: "${query}"
Context: ${(context as string)?.substring(0, 100) || "general"}
Return JSON array only, no other text:
[{"title":"...","authors":"Last et al","year":"...","journal":"...","doi":"...","pmid":"...","source_db":"PubMed","abstract":"1 sentence","study_type":"RCT/meta-analysis/cohort"}]`,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawText = (searchMsg.content as any[])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text as string)
      .join("\n");

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "No papers found", insufficient: true, sourceCount: 0 },
        { status: 200 }
      );
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
        type: s.study_type || s.type || "article",
        source_db: s.source_db || "PubMed",
        abstract: s.abstract || "",
        citedByCount: 0,
        verified: !!(s.doi || s.pmid),
      }))
      .filter((s) => s.verified && s.url);

    // Increment usage after successful search
    if (usage.userId) {
      await incrementUsage(usage.userId, usage.model);
    }

    return NextResponse.json({
      sources,
      sourceCount: sources.length,
      model: usage.model,
      sonnetRemaining: usage.sonnetRemaining - (usage.model === "sonnet" ? 1 : 0),
      haikuRemaining: usage.haikuRemaining - (usage.model === "haiku" ? 1 : 0),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
