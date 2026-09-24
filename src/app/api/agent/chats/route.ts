import { NextRequest, NextResponse } from "next/server";
import { listChats, getChat, saveChat, deleteChat } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET        → thread list (id/title/updatedAt)
 *  GET ?id=x  → full thread with messages
 *  POST {id?,title,messages} → create or update a thread, returns it
 *  DELETE ?id=x              → remove a thread
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const t = await getChat(id);
    return t ? NextResponse.json(t) : NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ chats: await listChats() });
}

export async function POST(req: NextRequest) {
  const { id, title, messages } = await req.json();
  if (!Array.isArray(messages))
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  const t = await saveChat({
    id: id || undefined,
    title: title || "New chat",
    messages,
  });
  return NextResponse.json(t);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteChat(id);
  return NextResponse.json({ ok: true });
}
