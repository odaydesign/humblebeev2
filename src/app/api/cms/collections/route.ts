import { NextRequest, NextResponse } from "next/server";
import { db, dbEnabled } from "@/lib/db";
import { getCollectionsStore } from "@/lib/store";
import { getCollections } from "@/lib/pages";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DRAFTS = path.join(process.cwd(), "src/lib/drafts");
const DRAFT_FILE = path.join(DRAFTS, "__collections.json");

async function editingView() {
  if (dbEnabled) {
    const row = await db.get("__collections");
    if (row) return { data: row.draft ?? row.published, hasDraft: row.draft != null };
  }
  if (fs.existsSync(DRAFT_FILE))
    return { data: JSON.parse(fs.readFileSync(DRAFT_FILE, "utf8")), hasDraft: true };
  return { data: await getCollectionsStore(), hasDraft: false };
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("published")) {
    return NextResponse.json({ data: await getCollectionsStore(), hasDraft: false });
  }
  return NextResponse.json(await editingView());
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const now = new Date().toISOString();
  const publish = req.nextUrl.searchParams.get("publish");
  if (dbEnabled) {
    if (publish) {
      await db.upsert({
        slug: "__collections",
        title: "Collections",
        template: "collections",
        published: data,
        draft: null,
        updated_at: now,
      });
    } else {
      await db.upsert({
        slug: "__collections",
        title: "Collections",
        template: "collections",
        draft: data,
        updated_at: now,
      });
    }
    return NextResponse.json({ ok: true, published: !!publish });
  }
  fs.mkdirSync(DRAFTS, { recursive: true });
  if (publish) {
    fs.writeFileSync(
      path.join(process.cwd(), "src/lib/collections.json"),
      JSON.stringify(data)
    );
    if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
  } else {
    fs.writeFileSync(DRAFT_FILE, JSON.stringify(data));
  }
  return NextResponse.json({ ok: true, published: !!publish });
}

export async function DELETE() {
  if (dbEnabled) await db.update("__collections", { draft: null });
  if (fs.existsSync(DRAFT_FILE)) fs.unlinkSync(DRAFT_FILE);
  return NextResponse.json({ ok: true });
}
