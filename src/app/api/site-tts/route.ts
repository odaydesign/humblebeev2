import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/site-chat";

/* Public hero TTS — Deepgram Flux via OpenRouter, billed on the same key.
   POST { text } → audio/mpeg bytes. Rate-limited tighter than chat:
   synthesis is the expensive call. */

const TTS_URL = "https://openrouter.ai/api/v1/audio/speech";
const MAX_CHARS = 1500;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip, "tts", 10)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  let text = "";
  try {
    const body = await req.json();
    if (typeof body?.text === "string") text = body.text.trim();
  } catch {
    /* fall through */
  }
  if (!text) return NextResponse.json({ error: "needs text" }, { status: 400 });
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENROUTER_API_KEY is not set" }, { status: 502 });

  const r = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://humblebee.local/",
      "X-Title": "HB Hero TTS",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_TTS_MODEL || "deepgram/flux-tts:free",
      input: text,
      voice: process.env.OPENROUTER_TTS_VOICE || "flux-wes-en",
      response_format: "mp3",
    }),
  });

  if (!r.ok) {
    const msg = await r.text().catch(() => "");
    return NextResponse.json(
      { error: `tts ${r.status}: ${msg.slice(0, 200)}` },
      { status: r.status === 429 ? 429 : 502 }
    );
  }

  const audio = await r.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
