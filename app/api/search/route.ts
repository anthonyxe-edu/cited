import { NextRequest, NextResponse } from "next/server";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { searchAllSources } from "@/lib/sources";

export async function POST(req: NextRequest) {
  const usage = await checkUsage();

  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Search limit reached", upgrade: usage.upgrade, plan: usage.plan },
      { status: 429 }
    );
  }

  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // Query real clinical databases — no AI generation of sources
    const sources = await searchAllSources(query);

    if (sources.length < 2) {
      return NextResponse.json({
        error: "Insufficient verified sources found",
        insufficient: true,
        sourceCount: sources.length,
        sources,
      });
    }

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
