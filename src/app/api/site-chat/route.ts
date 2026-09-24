import { NextRequest, NextResponse } from "next/server";
import { rateLimited, siteChat, type ChatMsg } from "@/lib/site-chat";

/* Public hero chat. No auth — guarded by per-IP rate limit + input caps.
   Body: { messages: [{role:"user"|"assistant", content}] } → { reply }. */

const MAX_MSG_LEN = 500;
const MAX_TURNS = 8;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  let body: { messages?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const msgs = (body.messages ?? [])
    .filter(
      (m): m is ChatMsg =>
        m && (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" && m.content.length > 0
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_LEN) }));

  if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
    return NextResponse.json({ error: "needs a user message" }, { status: 400 });
  }

  try {
    const reply = await siteChat(msgs);
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chat failed" },
      { status: 502 }
    );
  }
}
