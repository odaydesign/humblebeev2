import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/site-chat";

/* Public hero TTS — Gemini Flash Lite TTS via OpenRouter, billed on the
   same key. POST { text } → audio/wav. Rate-limited tighter than chat:
   synthesis is the expensive call. Gemini TTS only emits raw PCM, so we
   wrap it in a WAV header before sending to the browser. */

const TTS_URL = "https://openrouter.ai/api/v1/audio/speech";
const MAX_CHARS = 1500;
const PCM_RATE = Number(process.env.OPENROUTER_TTS_RATE || 24000); // Gemini TTS output rate

function wavHeader(dataLen: number, rate: number): Buffer {
  const b = Buffer.alloc(44);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataLen, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataLen, 40);
  return b;
}

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
      model: process.env.OPENROUTER_TTS_MODEL || "google/gemini-3.8-flash-lite-tts",
      input: text,
      voice: process.env.OPENROUTER_TTS_VOICE || "Zephyr",
      response_format: "pcm",
    }),
  });

  if (!r.ok) {
    const msg = await r.text().catch(() => "");
    return NextResponse.json(
      { error: `tts ${r.status}: ${msg.slice(0, 200)}` },
      { status: r.status === 429 ? 429 : 502 }
    );
  }

  const pcm = Buffer.from(await r.arrayBuffer());
  const wav = Buffer.concat([wavHeader(pcm.length, PCM_RATE), pcm]);
  return new Response(new Uint8Array(wav), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
    },
  });
}
