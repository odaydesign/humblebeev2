import { NextRequest, NextResponse } from "next/server";
import {
  listPages,
  getDoc,
  getPublished,
  saveDraft,
  publish,
  discardDraft,
  deletePage,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const pub = req.nextUrl.searchParams.get("published");
  if (slug) {
    const doc = pub ? await getPublished(slug) : await getDoc(slug);
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(doc);
  }
  return NextResponse.json({ pages: await listPages() });
}

export async function POST(req: NextRequest) {
  const doc = await req.json();
  const slug = req.nextUrl.searchParams.get("slug") ?? doc.slug;
  if (!slug || !/^[a-z0-9_][a-z0-9\-/_]*$/.test(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }
  if (req.nextUrl.searchParams.get("publish")) {
    // save-then-publish in one call: draft = doc, then promote
    await saveDraft(slug, doc);
    await publish(slug);
    return NextResponse.json({ ok: true, published: true, slug });
  }
  await saveDraft(slug, doc);
  return NextResponse.json({ ok: true, draft: true, slug });
}

export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  if (req.nextUrl.searchParams.get("draft")) {
    await discardDraft(slug);
    return NextResponse.json({ ok: true });
  }
  await deletePage(slug);
  return NextResponse.json({ ok: true });
}
