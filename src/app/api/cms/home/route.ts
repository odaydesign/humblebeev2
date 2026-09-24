import { NextRequest, NextResponse } from "next/server";
import { getDoc, getPublished, saveDraft, publish, discardDraft } from "@/lib/store";
import { homeSections } from "@/lib/content";
import { db, dbEnabled } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const OLD_DRAFT = path.join(process.cwd(), "src/lib/home-draft.json");

/** The homepage is just another doc — slug "__home", data.sections. */
function baseDoc() {
  return { slug: "__home", title: "Home", template: "freeform", data: { sections: homeSections } };
}

export async function GET(req: NextRequest) {
  const pub = req.nextUrl.searchParams.get("published");
  const doc = pub ? await getPublished("__home") : await getDoc("__home");
  if (doc) return NextResponse.json(doc);
  // legacy fallback: pre-DB draft file, else static content.ts
  if (fs.existsSync(OLD_DRAFT))
    return NextResponse.json({
      ...baseDoc(),
      data: { sections: JSON.parse(fs.readFileSync(OLD_DRAFT, "utf8")).sections },
    });
  return NextResponse.json(baseDoc());
}

export async function POST(req: NextRequest) {
  const doc = await req.json();
  doc.slug = "__home";
  doc.title = doc.title || "Home";
  doc.template = "freeform";
  if (req.nextUrl.searchParams.get("publish")) {
    await saveDraft("__home", doc);
    await publish("__home");
  } else {
    await saveDraft("__home", doc);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await discardDraft("__home");
  return NextResponse.json({ ok: true });
}
