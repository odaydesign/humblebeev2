/**
 * Seed Supabase cms_pages from the file store: all pages + collections +
 * homepage. Run once after creating the table (and any time the files are
 * the newer source). Usage: node tools/seed_db.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const PAGES = path.join(root, "src/lib/pages");
const rows = [];

for (const f of fs.readdirSync(PAGES)) {
  if (!f.endsWith(".json") || f === "index.json") continue;
  const doc = JSON.parse(fs.readFileSync(path.join(PAGES, f), "utf8"));
  rows.push({
    slug: doc.slug,
    title: doc.title,
    template: doc.template,
    published: doc,
    draft: null,
    updated_at: new Date().toISOString(),
  });
}

// collections
const collections = JSON.parse(
  fs.readFileSync(path.join(root, "src/lib/collections.json"), "utf8")
);
rows.push({
  slug: "__collections",
  title: "Collections",
  template: "collections",
  published: collections,
  draft: null,
  updated_at: new Date().toISOString(),
});

// homepage — strip TS to JSON via the exported model is not possible from
// plain node; instead seed a minimal doc so /studio reads content.ts-backed
// data only when the row is absent. We still create the row so listPages
// shows it; published:null → store falls back to homeSections.
const homeDraft = path.join(root, "src/lib/home-draft.json");
rows.push({
  slug: "__home",
  title: "Home",
  template: "freeform",
  published: fs.existsSync(homeDraft)
    ? {
        slug: "__home",
        title: "Home",
        template: "freeform",
        data: { sections: JSON.parse(fs.readFileSync(homeDraft, "utf8")).sections },
      }
    : null,
  draft: null,
  updated_at: new Date().toISOString(),
});

const res = await fetch(`${URL}/rest/v1/cms_pages`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error("SEED FAILED", res.status, await res.text());
  process.exit(1);
}
console.log(`Seeded ${rows.length} rows into cms_pages`);
