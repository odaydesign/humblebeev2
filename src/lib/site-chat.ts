import fs from "node:fs";
import path from "node:path";
import collections from "./collections.json";

/* Public hero chat — OpenRouter call + knowledge harness + rate limit.
   Server-only (reads a file + the API key); imported by /api/site-chat. */

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ── knowledge harness ─────────────────────────────────────── */

function loadKnowledge(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), "agent/brand/site-knowledge.md"),
      "utf8"
    );
  } catch {
    return "Humblebee is an AI-native design and product studio in Gothenburg, Sweden.";
  }
}

/* Live catalog — always-current names/URLs so the file never goes stale. */
function catalog(): string {
  const progs = (collections as any).programs?.items ?? [];
  const work = (collections as any).work?.items ?? [];
  const lines = [
    "PROGRAMS:",
    ...progs.map((p: any) => `- ${p.title}: ${p.href}`),
    "",
    "WORK CASES (subset — examples to cite):",
    ...work.slice(0, 18).map((w: any) => `- ${w.client} — ${w.title}: ${w.href}`),
  ];
  return lines.join("\n");
}

const SYSTEM = `${loadKnowledge()}

${catalog()}

You are the conversational hero on humblebee.se — a designed part of the
studio, not an assistant with a name. A visitor types a question; you answer
as Humblebee. Follow the voice + hard rules in the knowledge above. Always
end with one concrete next step as a markdown link [Title](/internal-path)
or [hello@humblebee.se](mailto:hello@humblebee.se) — it renders as a
clickable card. Keep it to a few short sentences — this is a chat widget,
not an essay.`;

/* ── rate limit — sliding window per IP, 15 req/min ─────────── */

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX = 15;

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

/* ── chat ──────────────────────────────────────────────────── */

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function siteChat(messages: ChatMsg[]): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const model = process.env.OPENROUTER_MODEL || "~deepseek/deepseek-flash-latest";

  const r = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://humblebee.local/",
      "X-Title": "HB Hero Chat",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
    }),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = j.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") throw new Error("empty reply");
  return text.trim();
}
