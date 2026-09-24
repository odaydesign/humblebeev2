import { NextRequest, NextResponse } from "next/server";
import { runTool } from "@/lib/agent";

export const dynamic = "force-dynamic";

/** Dev smoke-test: POST {tool, args} → executes one agent tool. */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  const { tool, args } = await req.json();
  const pending: any[] = [];
  const touched = new Set<string>();
  try {
    const result = await runTool(tool, args ?? {}, pending, touched);
    return NextResponse.json({ result: JSON.parse(result), pending, touched: [...touched] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
