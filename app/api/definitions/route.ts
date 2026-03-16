import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };
    if (!text) return NextResponse.json({ terms: [] });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are helping people who are not medical or science experts understand health research.

From the text below, identify 4–8 technical terms that a general audience might not know. Include:
- Research methodology terms (e.g. RCT, meta-analysis, placebo, confidence interval, cohort)
- Medical/physiological terms (e.g. bioavailability, cortisol, VO2 max, inflammatory markers)
- Anatomical or biomechanical terms specific to this topic
- Any abbreviation used in the text

For each term, write a plain-language definition: 1–2 short sentences, no jargon, as if explaining to a curious 16-year-old.

Return ONLY valid JSON in this exact format:
{"terms":[{"term":"...","definition":"..."}]}

Text:
${text.slice(0, 3000)}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ terms: [] });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ terms: parsed.terms ?? [] });
  } catch {
    return NextResponse.json({ terms: [] });
  }
}
