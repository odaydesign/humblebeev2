/**
 * Minimal Supabase PostgREST client — server-side only.
 * No SDK dependency: plain fetch against /rest/v1 with the publishable key.
 * Falls back gracefully (returns null) when env vars are absent so the
 * file-based store keeps working offline.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const dbEnabled = !!(URL && KEY);

async function rest(path: string, init?: RequestInit) {
  const res = await fetch(`${URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export interface CmsRow {
  slug: string;
  title: string;
  template: string;
  published: any;
  draft: any;
  updated_at: string;
}

export const db = {
  /** Studio list — includes draft presence flag. */
  async list(): Promise<CmsRow[]> {
    return rest(
      "/cms_pages?select=slug,title,template,updated_at,draft&order=slug"
    );
  },
  /** Render-path list (generateStaticParams) — no draft column. */
  async listSlugs(): Promise<Pick<CmsRow, "slug" | "title" | "template">[]> {
    return rest("/cms_pages?select=slug,title,template&order=slug");
  },
  async get(slug: string): Promise<CmsRow | null> {
    const rows = await rest(`/cms_pages?slug=eq.${encodeURIComponent(slug)}`);
    return rows?.[0] ?? null;
  },
  /** Public render path — NEVER selects the draft column, so unpublished
   *  content can't leak into serialized fetch responses in page HTML. */
  async getPublishedDoc(slug: string): Promise<{ published: any } | null> {
    const rows = await rest(
      `/cms_pages?select=published&slug=eq.${encodeURIComponent(slug)}`
    );
    return rows?.[0] ?? null;
  },
  async upsert(row: Partial<CmsRow> & { slug: string }) {
    return rest("/cms_pages", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    });
  },
  async update(slug: string, patch: Partial<CmsRow>) {
    return rest(`/cms_pages?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  async remove(slug: string) {
    return rest(`/cms_pages?slug=eq.${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
  },
  /* ── agent chat threads ── */
  async listChats(): Promise<ChatRow[]> {
    return rest(
      "/cms_chats?select=id,title,updated_at&order=updated_at.desc"
    );
  },
  async getChat(id: string): Promise<ChatRow | null> {
    const rows = await rest(`/cms_chats?id=eq.${id}`);
    return rows?.[0] ?? null;
  },
  async upsertChat(row: Partial<ChatRow> & { id?: string }) {
    return rest("/cms_chats", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    });
  },
  async removeChat(id: string) {
    return rest(`/cms_chats?id=eq.${id}`, { method: "DELETE" });
  },
};

export interface ChatRow {
  id: string;
  title: string;
  messages: any[];
  created_at?: string;
  updated_at?: string;
}
