import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Streams NDJSON agent events: tool_call / tool_result / done / error. */
export async function POST(req: NextRequest) {
  const { messages, model, currentSlug, components, files } = await req.json();
  if (!Array.isArray(messages) || !messages.length)
    return Response.json({ error: "messages required" }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (e: any) => ctrl.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await runAgent({ messages, model, currentSlug, components, files }, send);
      } catch (e: any) {
        send({ type: "error", error: e.message });
      }
      ctrl.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
