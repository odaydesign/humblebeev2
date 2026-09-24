import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "src/lib/board-positions.json");

function read(): Record<string, { x: number; y: number }> {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

/** GET → saved board positions { slug: {x,y} }. */
export async function GET() {
  return NextResponse.json({ positions: read() });
}

/** POST {positions: {slug:{x,y}}} → merged + persisted. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const incoming = body?.positions;
  if (typeof incoming !== "object" || incoming == null)
    return NextResponse.json({ error: "positions object required" }, { status: 400 });
  const cur = read();
  for (const [slug, p] of Object.entries(incoming)) {
    const pt = p as any;
    if (typeof pt?.x === "number" && typeof pt?.y === "number")
      cur[slug] = { x: Math.round(pt.x), y: Math.round(pt.y) };
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(cur, null, 2) + "\n");
  return NextResponse.json({ ok: true, positions: cur });
}
