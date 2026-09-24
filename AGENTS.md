# Humblebee v2

A component-structured clone of https://www.humblebee.se (originally Webflow),
built as the foundation for a custom component CMS.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- GSAP + ScrollTrigger (the pinned "challenges" scroll animation)
- No Tailwind — single `src/app/globals.css` with design tokens as CSS vars

## Commands

- `npm run dev` — dev server (localhost:3000)
- `npm run build` — production build (static prerender)
- `npx tsc --noEmit` — typecheck

## Architecture (CMS-ready)

All content lives in **`src/lib/content.ts`** — a typed model with the same
shape a headless CMS would return. Components take their slice as props and
contain no hardcoded copy. `src/components/SectionRenderer.tsx` maps
`section.type` → component; `src/app/page.tsx` renders `homeSections` in order.
To wire a real CMS later: replace `homeSections`/`navContent`/`footerContent`
with a fetch, keep the types.

| type            | Component          | Notes                                        |
|-----------------|--------------------|----------------------------------------------|
| `hero`          | `Hero`             | heading, sub, CSS marquee strip, logo grid   |
| `challenges`    | `Challenges`       | client; GSAP pinned pills (desktop) / rotating deck (mobile) |
| `strategyMoves` | `StrategyMoves`    | image-left cards w/ solid + ghost CTAs       |
| `programs`      | `Programs`         | hover rows (yellow bg, blue arrow)           |
| `statement`     | `Statement`        | client; word-by-word scroll color reveal     |
| `twoColumns`    | `TwoColumns`       | image 512px + h4 + blue CTA                  |
| `hire`          | `Hire`             | 3-col card grid + blue CTA                   |
| `featureBanner` | `FeatureBanner`    | grey split banner (AI Readiness Report)      |

Chrome-level: `SiteNav` (pill nav + fullscreen overlay menu, client),
`SiteFooter`, shared `EmailCopyButton`, `ArrowIcon` variants.

## Subpages (all ~160 routes)

All scraped sitemap pages are generated as static routes via
`src/app/[...slug]/page.tsx` (catch-all + `generateStaticParams`,
`dynamicParams = false`). Page data lives in `src/lib/pages/{slug}.json`
(`index.json` = slug/title/template map) and is loaded by `src/lib/pages.ts`.

| template        | component                          | pages |
|-----------------|------------------------------------|-------|
| `program`       | `subpages/ProgramPage`             | 7     |
| `case`          | `subpages/CasePage`                | 23    |
| `story`         | `subpages/StoryPage`               | 82    |
| `programsIndex` | `subpages/ProgramsIndexPage`       | 1     |
| `workIndex`     | `subpages/WorkIndexPage`           | 1     |
| `storiesIndex`  | `subpages/StoriesIndexPage` (client tab filter) | 1 |
| `legacy`        | `subpages/LegacyPage` (sanitized extracted HTML + per-page `<style>`) | ~43 |

Shared bits: `subpages/BackButton`, `RichText` (`.w-richtext`),
`StoryCardItem`. Collection data (story/work/program cards) is in
`src/lib/collections.json`.

Styling for extracted markup comes from **`src/app/legacy.css`** — rules
ported from the original `webflow.css` for every class used across the
pages (incl. `:root` vars, `.w-richtext`, grids, media queries). New
components reuse the original class names so the ported CSS styles them.

**IMPORTANT:** `main` is a stacking context (`z-index:0`) so that
`.withbg_background-image-wrapper{z-index:-1}` hero images paint above
`main`'s white background — do not remove.

## Design system

`/design-system` is a living catalog of every building block, organised
bottom-up: foundations (tokens/type/breakpoints/interactions) → atoms →
molecules → sections → templates → all pages. Each entry documents its
source file, composition, content source and responsive behaviour, with a
live iframe preview (`/design-system/embed/<id>`) that answers media
queries at the iframe's width — the viewport buttons (Fit/1440/991/767/479)
demonstrate real responsive scaling.

- Registry + embed render map: `src/lib/design-system.tsx` (`LEVELS`,
  `EMBEDS`). Entry metadata: `composedOf`, `usedIn`, `content`,
  `responsive`, `refs` (cross-links), `pageHref` (live example route).
  Add new components there.
- Catalog page: `src/app/design-system/page.tsx` + `ds.css` (all styles
  `.ds-*` scoped). Client widgets: `Preview.tsx` (iframe + viewport
  resizer + auto-height via postMessage), `EmbedPing.tsx` (height
  reporter inside embeds), `SideBar.tsx` (filter + scroll-spy),
  `Swatch.tsx` (click-to-copy tokens).

## Studio — visual page builder (`/studio`)

A canvas-first CMS for section-based pages. Three-column layout: Add/Pages
+ Layers rail | live iframe canvas | schema-driven inspector.

- **`src/lib/section-schemas.ts`** — the editor contract: per section
  type, declarative `fields` (text/textarea/image/href/email/select/
  switch/cta/list with nested item fields), palette metadata, `unique`
  rule (hero max 1), `make()` factory. Add a `type` to `Section` in
  content.ts + a `SectionRenderer` case + a schema here to make it
  editable.
- **Canvas** `src/app/studio/preview/page.tsx` — renders the working doc
  with real `SiteNav`/`SiteFooter`/`SectionRenderer`; postMessage
  protocol: `{hbDoc}` in, `{hbSel}` in, `{hbReady}`/`{hbSelect}`/
  `{hbInsert:{type,index}}` out. Drop position computed from section
  midpoints; blue line marks the insertion index.
- **Shell** `src/app/studio/StudioApp.tsx` + `Inspector.tsx` +
  `studio.css` — page switcher, slug/title, viewport widths (Fit/1440/
  991/767/479), palette (drag or click-to-insert after selection),
  layers (drag reorder + ↑↓/⧉/✕), inspector (datalists: `hb-assets`
  images, `hb-slugs` internal links).
- **Persistence** `src/app/api/cms/` — `pages` (GET/POST/DELETE →
  `src/lib/pages/{slug}.json` + `index.json`, `template:"freeform"`,
  routed by the catch-all via `FreeformPage`), `home` (draft →
  `src/lib/home-draft.json`, `page.tsx` prefers it over `homeSections`),
  `assets` (image list for pickers). Dev-server persistence — swap for a
  DB later; the doc shape is already CMS-serialisable.
- **`richText`** — 9th section type, free HTML via `subpages/RichText`
  inside standard padding/container wrappers.

### All pages editable + draft/publish (Supabase-backed)

- **`cms_pages` table** (Supabase `public`): `slug` pk, `title`,
  `template`, `published jsonb`, `draft jsonb` (nullable working copy),
  `updated_at`. Rows `__home` (homepage sections doc) and
  `__collections` (shared story/work/program cards) are special. Seeded
  from files via `tools/seed_db.mjs`.
- **`src/lib/db.ts`** — dependency-free PostgREST fetch client
  (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` in `.env.local`).
  `getPublishedDoc`/`listSlugs` NEVER select the `draft` column — the
  render path can't leak unpublished content into Flight-serialized
  fetch responses (this actually happened once — keep it that way).
- **`src/lib/store.ts`** — the storage seam: `listPages`, `getDoc`
  (draft ?? published), `getPublished`, `saveDraft`, `publish`,
  `discardDraft`, `deletePage`, `getCollectionsStore`. DB-first with
  file fallback (`src/lib/drafts/` for unpublished, `pages/` promoted
  on publish) when env is absent or DB unreachable.
- **Render**: `[...slug]` and `page.tsx` read `getPublished` with
  `revalidate = 30` + `dynamicParams = true` — publishes go live within
  ~30s, new pages resolve without a rebuild.
- **Studio**: Pages tab lists every page grouped by template + filter +
  draft dots; `program`/`case`/`story` get structured inspectors
  (`src/lib/template-schemas.ts` — fields incl. `group` + scalar lists);
  `legacy` edits title/desc/html/css; `__collections` edits shared
  cards. Save draft / Publish / Discard per doc. Preview iframe renders
  the working doc through the real template components.
- **APIs**: `/api/cms/pages` (GET list|slug, POST draft, POST ?publish,
  DELETE ?slug | &draft=1), `/api/cms/home`, `/api/cms/collections`,
  `/api/cms/assets`, `/api/cms/upload` (chat attachments → `public/uploads/`,
  gitignored; images return a `/uploads/x` path usable in image fields).
- **RLS caveat**: cms_pages has public read+write policies (dev). For
  production: gate /studio + /api/cms behind auth, restrict write
  policies to `authenticated`, keep anon read-only on published — or
  move writes behind a service-role key held server-side.

### AI agent (Studio chat)

`/studio` → **Agent** tab — a chat that drives the whole CMS via tools.

- `src/lib/agent.ts` — OpenRouter tool loop (`/api/agent`), executors map
  to the store layer. `publish_page`/`delete_page` never execute in the
  loop: they return pending confirmations rendered as Approve/Deny cards
  in chat; approval calls `/api/agent/action` → `executeConfirmed`.
- `agent/skills/*.md` — the agent's rulebook (design-rules, components,
  page-authoring, publishing, collections), read on demand via the
  `read_guide` tool. Keep these updated — they are the agent contract.
- Writes are always drafts. Dot-path ops (`set`/`append`/`remove`) patch
  docs; `create_page` validates section types + unique-hero.
- Env: `OPENROUTER_API_KEY` (+ optional `OPENROUTER_MODEL`) in
  `.env.local`. Default model: `~deepseek/deepseek-flash-latest`
  (OpenRouter alias — floats to newest DeepSeek Flash; pin
  `deepseek/deepseek-v4-flash-0731` via env for reproducibility).
- Chat threads persist in `cms_chats` (Supabase) with file fallback at
  `src/lib/chats/`; `/api/agent/chats` = list/get/upsert/delete. The
  client auto-saves after each exchange and auto-opens the page the
  agent touched (`touched` slugs → openDoc).
- `/api/agent/test-tools` — dev-only executor smoke-test endpoint.
- **Attachments**: 📎 picker or paste in the composer. `image/*` uploads to
  `public/uploads/` → agent gets the path for `img`/`bgImage` fields; text/code
  files (≤24KB) are inlined into the agent context; other binaries upload as
  paths. Chips record attachments on the message; `files` field persisted in
  `cms_chats`.

### In-canvas editing

Components carry `data-hb-*` bindings (harmless on the live site). The
preview iframe (`studio/preview`) routes clicks on them:

- `data-hb-f="path"` → contentEditable inline edit (Enter/blur commits,
  Esc cancels; `data-hb-multi` allows Enter newlines)
- `data-hb-overlay="path"` → floating textarea for fields split across
  nodes (Statement words)
- `data-hb-html="path"` → editable HTML block (`RichText hbPath` prop;
  commits innerHTML → `bodyHtml`/`html` fields)
- `data-hb-img` / `data-hb-link` → click selects + focuses the matching
  inspector field (`#f-<key>`)
- legacy pages → any element editable, whole-DOM serialized back to
  `doc.html` on blur

All edits postMessage `{hbEdit:{sec,path,value}}` / `{hbEditHtml}` to
StudioApp which applies them via `setPath` (dot-paths relative to the
section for freeform, `doc.data` for structured templates). Undo stack
(⌘Z) + ⌘S quick-save in StudioApp.
- Not linked from the site nav; `robots: noindex`.

## Regenerating page data

- `tools/extract_pages.py` — parses `_source/pages/**/*.html` →
  `src/lib/pages/*.json` + `collections.json`; rewrites CDN image URLs via
  `_source/imgmap.json`, strips `srcset`/`data-w-id`/IX inline styles,
  extracts structured fields per template.
- `tools/port_css.py` — rebuilds `src/app/legacy.css` from
  `_source/webflow.css` for classes in `_source/legacy_classes.txt`
  minus classes already defined in `globals.css`.
- `tools/shoot.mjs` — `node tools/shoot.mjs /route out [scrollY] [width]`
  screenshots a page via puppeteer-core + local Chrome.

## Design tokens (`:root` in globals.css)

- Ink `#161616`, body `#fffc`, grey `#f7f7f7`, dark-grey `#6c6e74`, line `#e0e0e0`
- Brand: blue `#1a00ff`, orange `#ff8000`, yellow `#fff500` (programs hover)
- Type: Inter 600 headings (h1 64/80 → h5 24/28, tight negative tracking),
  Maison Neue Book 16px/1.75 body — woff2 files in `public/assets/fonts/`
- Layout: `.padding-global` 5vw, `.container-large` max 1680px,
  section padding 120px; breakpoints 991 / 767 / 479

## Reference material

`_source/` holds the scraped original (`index.html`, `body_pretty.html`,
`webflow.css`, `custom_styles.txt`, `inline_scripts.js`, `asset_map.json`,
`imgmap.json`, plus `pages/**/*.html` — all 158 sitemap routes). Useful when
porting more pages. `puppeteer-core` (devDep) drives local Chrome for
visual-diff screenshots.

## Studio — site board

`/studio` topbar toggles **Page | Board**. The board (`src/app/studio/Board.tsx`)
is a Figma-style spatial overview: every page as a thumbnail card, edges
showing URL hierarchy, wheel-zoom to cursor, drag-to-pan, drag cards to
rearrange. Positions persist in `src/lib/board-positions.json` via
`/api/cms/board`. Thumbnails are puppeteer screenshots cached to
`public/thumbs/` by `/api/cms/thumb` (lazy-generates on first view,
regenerates on publish; needs local Chrome, CHROME_PATH overrides).

### Site menu (`__menu` doc)

The site header is `src/components/menu/site-header.tsx` (morphing frosted
pill, ported from `Humblebeev3/docs/agent-components/01-menu` — class names
`hb-menu*`/`hb-scrim`/`data-hive-target`, `@property --menu-w/h` morph and
glass `data-tone` sampling are spec-mandated; `menu.css` imported in
layout). Config = `MenuConfig` in `src/lib/menu.ts`, stored as the `__menu`
doc's `data` (links, cases, footnote, city, cta). `getMenuConfig()` in
store.ts = published-or-default. Studio: Workspace → Menu pin edits it like
a structured template; canvas shows the menu over the real homepage, and
nav/case/CTA labels are `data-hb-f` inline-editable. `SiteNav` is retired —
page renders mount `SiteHeader`.

### Site menu (`__menu` doc)

The site header is `src/components/menu/site-header.tsx` (morphing frosted
pill, ported from `Humblebeev3/docs/agent-components/01-menu` — class names
`hb-menu*`/`hb-scrim`/`data-hive-target`, `@property --menu-w/h` morph and
glass `data-tone` sampling are spec-mandated; `menu.css` imported in
layout). Config = `MenuConfig` in `src/lib/menu.ts`, stored as the `__menu`
doc's `data` (links, cases, footnote, city, cta). `getMenuConfig()` in
store.ts = published-or-default. Studio: Workspace → Menu pin edits it like
a structured template; canvas shows the menu over the real homepage, and
nav/case/CTA labels are `data-hb-f` inline-editable. `SiteNav` is retired —
page renders mount `SiteHeader`.
