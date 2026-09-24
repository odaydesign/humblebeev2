# Humblebee v2

A self-hosted, component-driven CMS and website — a structured rebuild of
[humblebee.se](https://www.humblebee.se) (originally Webflow) that turns the
site into a fully editable, AI-assisted platform.

Three surfaces:

| Surface | Route | What it is |
|---|---|---|
| **Site** | `/` + ~160 routes | The public website — homepage, programs, work, stories, legacy pages |
| **Studio** | `/studio` | Visual CMS — page canvas, layers, inspector, site board, AI agent chat |
| **Design system** | `/design-system` | Living catalog — tokens → atoms → sections → templates → pages, with live embeds |

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in Supabase + OpenRouter keys
npm run dev                  # → http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npx tsc --noEmit` | Typecheck |
| `node tools/shoot.mjs /route out [scrollY] [width]` | Screenshot a page (puppeteer + local Chrome) |

## How it's structured

```
src/
  app/                 Next.js App Router
    page.tsx           Homepage (published doc → fallback content.ts)
    [...slug]/         Catch-all — renders all pages by template
    studio/            The CMS shell (StudioApp, AgentChat, Board, Inspector, preview iframe)
    design-system/     Catalog + live embeds (/design-system/embed/<id>)
    api/cms/           pages · home · collections · assets · board · thumb · upload
    api/agent/         agent · action (confirmed ops) · chats · test-tools
  components/          Section components (Hero, Challenges, …) + SectionRenderer
    subpages/          Page templates (program / case / story / legacy / indexes)
    custom/            AI-generated components + generated index.ts
  lib/
    content.ts         Typed Section model + homepage fallback content
    pages/             All page docs (JSON), index.json = slug/title/template map
    section-schemas.ts Editor contract — fields, palette metadata, make() factories
    template-schemas.ts Inspectors for structured templates (program/case/story)
    store.ts           Storage seam — Supabase-first, file fallback
    db.ts              PostgREST client
    agent.ts           Tool loop, tool defs, executors, system prompt
    custom-sections.json  AI-built component registry
    design-system.tsx  Catalog registry (levels, entries, embeds)
agent/skills/          The agent's rulebook (design-rules, components,
                       page-authoring, publishing, collections,
                       component-development) — read on demand via read_guide
tools/                 extract_pages.py · port_css.py · seed_db.mjs · shoot.mjs
_source/               Scraped original site (reference + regeneration input)
public/assets/         Fonts (Inter, Maison Neue) + extracted images
public/uploads/        Chat attachments (gitignored)
```

## Data & publishing model

- Every page is a **doc**: `{slug, title, template, data|sections}` stored in
  Supabase `cms_pages` (`published` + nullable `draft`).
- Studio edits write **drafts**; Publish promotes draft → published. The public
  site only ever reads `published` (revalidates ~30s). File fallback under
  `src/lib/` keeps everything working without Supabase.
- `__home` (homepage sections) and `__collections` (shared story/work/program
  cards) are special doc slugs.
- Chat threads persist in `cms_chats`.

## The Studio (`/studio`)

- **Canvas** — live iframe preview at real breakpoints (Fit/1440/991/767/479).
  Click text to edit inline (`data-hb-*` bindings), ⌘Z undo, ⌘S save.
- **Palette** — drag or click sections onto the canvas; inspector edits fields
  (text, images w/ asset picker, links, lists, CTAs).
- **Layers** — reorder (drag/↑↓), duplicate, delete sections.
- **Pages tree** — searchable nested sitemap; folders expand/collapse.
- **Board** — Figma-style spatial map of all pages: real thumbnails, hierarchy
  edges, group frames, zoom/pan, drag-to-arrange (positions persist), create
  pages on the canvas.
- **Agent tab** — chat that drives the whole CMS.

## The AI agent

OpenRouter-backed (DeepSeek Flash by default) tool-use loop in `src/lib/agent.ts`:

- **Reads** pages, schemas, collections, and its `agent/skills/*.md` rulebook;
  **writes** drafts only — `create_page`, `edit_page` (dot-path ops),
  `add_section`, `edit_collection`, etc.
- **Gated actions** — `publish_page`, `delete_page`, `remove_component` return
  pending confirmations rendered as Approve/Deny cards in chat.
- **Builds components** — given a plain-English idea, it writes a real
  `.tsx` file in `src/components/custom/`, scoped CSS in `src/app/custom.css`,
  and registers it (`custom:*` type) so it appears in the palette, inspector,
  design system, and render path — with in-canvas editing bindings.
- **Steering** — attach components (▦ picker) to force exact section types;
  attach files (📎 or paste): text/code is inlined into context, images upload
  to `/uploads/` for use in image fields.
- **Threads** — conversations persist; the last thread restores on load, and
  pages the agent touched auto-open in the canvas.

## Design system (`/design-system`)

Bottom-up catalog: foundations (color/type/spacing/breakpoints) → atoms →
molecules → sections → templates → pages. Each entry lists source files,
composition, content source and responsive behaviour, with a live embed that
answers media queries at the iframe's width.

## Conventions that matter

- **CSS tokens** in `src/app/globals.css` (`:root`) — ink `#161616`, blue
  `#1a00ff`, orange `#ff8000`, yellow `#fff500`; Inter headings, Maison Neue
  body; breakpoints 991/767/479. No Tailwind.
- **Legacy markup** (`legacy` template pages) is sanitized extracted HTML
  styled by `src/app/legacy.css` — regenerate with `tools/port_css.py`.
- **Never select `draft`** in `getPublishedDoc`/`listSlugs` — unpublished
  content must not leak into Flight-serialized responses.
- `AGENTS.md` is the agent-facing contract — keep it and `agent/skills/` in
  sync with architecture changes.

## Deployment notes

- Standard Next.js deploy works for the site. Studio + CMS APIs are
  dev-server-oriented (filesystem writes, local Chrome thumbnails) — host the
  editing environment separately or move store writes to Supabase-only.
- `cms_pages` currently has public read+write policies (dev). Before exposing
  Studio publicly: gate `/studio` + `/api/cms` behind auth, restrict write
  policies to `authenticated` (anon read-only on `published`).
