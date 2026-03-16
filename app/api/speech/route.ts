import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "iP95p4xoKVk53GoZ742B"; // Chris - Charming, Down-to-Earth (free tier)

export async function POST(req: NextRequest) {
  try {
    const { text, query } = await req.json() as { text: string; query: string };
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    // Step 1: Rewrite as casual coach-speak via Claude Haiku
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      messages: [{
        role: "user",
        content: `You are a knowledgeable, friendly health coach giving a quick verbal summary to a friend. Rewrite the following research summary in casual spoken English — like you're texting a buddy who asked you a health question. Use plain words, natural pauses, the occasional "look," "honestly," "here's the thing," or "real talk." No jargon. No bullet points. Keep it under 100 words. Sound human, warm, and direct — not like a doctor, not like a robot.

Topic: ${query}

${text}`,
      }],
    });

    const coachScript = msg.content[0].type === "text" ? msg.content[0].text : text;

    // Step 2: Send to ElevenLabs TTS
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: coachScript,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.80,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      throw new Error(`ElevenLabs error ${ttsRes.status}: ${err}`);
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
