/**
 * CMS storage layer — single seam between the site/Studio and persistence.
 *
 * Source of truth: Supabase `cms_pages` (published + draft columns).
 * Fallback: the file store under src/lib/pages (+ src/lib/drafts for
 * unpublished changes) so the site keeps working if the DB is unreachable.
 *
 * Special slugs: "__home" (homepage sections doc), "__collections"
 * (shared story/work/program card lists).
 */
import fs from "fs";
import path from "path";
import { db, dbEnabled, type CmsRow } from "./db";
import type { PageData, PageIndexEntry, Collections } from "./pages";
import { getPage as fileGetPage, getPageIndex, getCollections as fileGetCollections } from "./pages";
import { menuDoc, defaultMenu, type MenuConfig } from "./menu";

const DRAFTS_DIR = path.join(process.cwd(), "src/lib/drafts");
const PAGES_DIR = path.join(process.cwd(), "src/lib/pages");
const INDEX = path.join(PAGES_DIR, "index.json");

export interface PageListItem extends PageIndexEntry {
  hasDraft: boolean;
  updatedAt?: string;
}

const fileFor = (slug: string) =>
  path.join(PAGES_DIR, slug.replace(/\//g, "__") + ".json");
const draftFor = (slug: string) =>
  path.join(DRAFTS_DIR, slug.replace(/\//g, "__") + ".json");

/* ── list ─────────────────────────────────────────────────── */

export async function listPages(includeDrafts = true): Promise<PageListItem[]> {
  const fileIdx = getPageIndex().map((e) => ({ ...e, hasDraft: false }));
  if (!dbEnabled) return mergeDraftFlags(fileIdx);
  try {
    const rows = includeDrafts ? await db.list() : await db.listSlugs();
    const bySlug = new Map<string, PageListItem>(fileIdx.map((e) => [e.slug, e]));
    for (const r of rows) {
      const full = r as CmsRow;
      bySlug.set(r.slug, {
        slug: r.slug,
        title: r.title,
        template: r.template as PageIndexEntry["template"],
        hasDraft: full.draft != null,
        updatedAt: full.updated_at,
      });
    }
    return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    return mergeDraftFlags(fileIdx);
  }
}

function mergeDraftFlags(list: PageListItem[]): PageListItem[] {
  if (fs.existsSync(DRAFTS_DIR)) {
    const draftSlugs = new Set(
      fs.readdirSync(DRAFTS_DIR).map((f) => f.replace(/\.json$/, "").replace(/__/g, "/"))
    );
    return list.map((e) => ({ ...e, hasDraft: e.hasDraft || draftSlugs.has(e.slug) }));
  }
  return list;
}

/* ── read ─────────────────────────────────────────────────── */

/** Editing view: draft if present, else published. */
export async function getDoc(slug: string): Promise<PageData | null> {
  let doc: PageData | null = null;
  if (dbEnabled) {
    try {
      const row = await db.get(slug);
      if (row) doc = row.draft ?? row.published;
    } catch {}
  }
  if (!doc && fs.existsSync(draftFor(slug)))
    doc = JSON.parse(fs.readFileSync(draftFor(slug), "utf8"));
  if (!doc) doc = fileGetPage(slug);
  // __menu has no file row — the editable doc materialises from defaults.
  if (!doc && slug === "__menu") return menuDoc() as unknown as PageData;
  return doc;
}

/** Public render view: published only. Never fetches the draft column so
 *  unpublished content can't appear in the page's serialized payload. */
export async function getPublished(slug: string): Promise<PageData | null> {
  if (dbEnabled) {
    try {
      const row = await db.getPublishedDoc(slug);
      if (row?.published) return row.published;
    } catch {}
  }
  return fileGetPage(slug);
}

export async function getCollectionsStore(): Promise<Collections> {
  if (dbEnabled) {
    try {
      const row = await db.getPublishedDoc("__collections");
      if (row?.published) return row.published;
    } catch {}
  }
  return fileGetCollections();
}

/** Public render view for the site menu — published __menu doc, else defaults. */
export async function getMenuConfig(): Promise<MenuConfig> {
  const doc = await getPublished("__menu");
  return (doc?.data as unknown as MenuConfig) ?? defaultMenu;
}

/* ── write ────────────────────────────────────────────────── */

export async function saveDraft(slug: string, doc: any) {
  if (dbEnabled) {
    await db.upsert({
      slug,
      title: doc.title ?? slug,
      template: doc.template ?? "freeform",
      draft: doc,
      updated_at: new Date().toISOString(),
    });
    return;
  }
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(draftFor(slug), JSON.stringify(doc));
}

export async function publish(slug: string) {
  if (dbEnabled) {
    const row = await db.get(slug);
    if (!row) throw new Error("not found");
    await db.update(slug, {
      published: row.draft ?? row.published,
      draft: null,
      updated_at: new Date().toISOString(),
    });
    return;
  }
  // file fallback: promote draft → pages + index
  const src = fs.existsSync(draftFor(slug)) ? draftFor(slug) : fileFor(slug);
  if (!fs.existsSync(src)) throw new Error("not found");
  const doc = JSON.parse(fs.readFileSync(src, "utf8"));
  fs.writeFileSync(fileFor(slug), JSON.stringify(doc));
  if (fs.existsSync(draftFor(slug))) fs.unlinkSync(draftFor(slug));
  const idx = getPageIndex();
  const i = idx.findIndex((e) => e.slug === slug);
  const meta = { slug, title: doc.title, template: doc.template };
  if (i >= 0) idx[i] = meta;
  else idx.push(meta);
  fs.writeFileSync(INDEX, JSON.stringify(idx, null, 1));
}

export async function discardDraft(slug: string) {
  if (dbEnabled) {
    await db.update(slug, { draft: null });
    return;
  }
  if (fs.existsSync(draftFor(slug))) fs.unlinkSync(draftFor(slug));
}

export async function deletePage(slug: string) {
  if (dbEnabled) {
    await db.remove(slug);
    return;
  }
  if (fs.existsSync(fileFor(slug))) fs.unlinkSync(fileFor(slug));
  if (fs.existsSync(draftFor(slug))) fs.unlinkSync(draftFor(slug));
  fs.writeFileSync(
    INDEX,
    JSON.stringify(getPageIndex().filter((e) => e.slug !== slug), null, 1)
  );
}

/* ── agent chat threads ───────────────────────────────────── */

const CHATS_DIR = path.join(process.cwd(), "src/lib/chats");

export interface ChatThread {
  id: string;
  title: string;
  messages: any[];
  updatedAt?: string;
}

export async function listChats(): Promise<ChatThread[]> {
  if (dbEnabled) {
    try {
      const rows = await db.listChats();
      return rows.map((r) => ({ id: r.id, title: r.title, messages: [], updatedAt: r.updated_at }));
    } catch {}
  }
  if (!fs.existsSync(CHATS_DIR)) return [];
  return fs
    .readdirSync(CHATS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const c = JSON.parse(fs.readFileSync(path.join(CHATS_DIR, f), "utf8"));
      return { id: c.id, title: c.title, messages: [], updatedAt: c.updatedAt };
    })
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getChat(id: string): Promise<ChatThread | null> {
  if (dbEnabled) {
    try {
      const r = await db.getChat(id);
      if (r) return { id: r.id, title: r.title, messages: r.messages ?? [], updatedAt: r.updated_at };
    } catch {}
  }
  const f = path.join(CHATS_DIR, id + ".json");
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  return null;
}

export async function saveChat(thread: { id?: string; title: string; messages: any[] }): Promise<ChatThread> {
  const now = new Date().toISOString();
  if (dbEnabled) {
    const rows = await db.upsertChat({ ...thread, updated_at: now });
    const r = Array.isArray(rows) ? rows[0] : rows;
    return { id: r.id, title: r.title, messages: r.messages ?? [], updatedAt: r.updated_at };
  }
  fs.mkdirSync(CHATS_DIR, { recursive: true });
  const id = thread.id ?? crypto.randomUUID();
  const doc = { id, title: thread.title, messages: thread.messages, updatedAt: now };
  fs.writeFileSync(path.join(CHATS_DIR, id + ".json"), JSON.stringify(doc));
  return doc;
}

export async function deleteChat(id: string) {
  if (dbEnabled) {
    await db.removeChat(id);
    return;
  }
  const f = path.join(CHATS_DIR, id + ".json");
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
