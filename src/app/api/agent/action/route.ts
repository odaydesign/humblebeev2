import { NextRequest, NextResponse } from "next/server";
import { executeConfirmed } from "@/lib/agent";

export const dynamic = "force-dynamic";

/** Executes an agent action the user approved in the Studio UI. */
export async function POST(req: NextRequest) {
  const { op, slug } = await req.json();
  if ((op !== "publish" && op !== "delete" && op !== "remove_component") || typeof slug !== "string")
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  try {
    await executeConfirmed(op, slug);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
