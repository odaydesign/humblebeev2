# Page authoring — doc shapes, paths, workflow

## Doc shape

Every page is a JSON document:

```json
{
  "slug": "work/justr",           // URL path without leading slash
  "title": "Construction Startup",
  "template": "case",             // freeform | program | case | story | legacy | *Index
  "desc": "SEO meta description", // optional
  "data": { ... },                // template-specific payload
  "html": "...", "css": "..."     // legacy template only
}
```

Special slugs: `__home` (homepage — a freeform doc), `__collections`
(shared card data — see collections.md).

## Addressing fields — dot paths

`update_page` / `update_collections` take ops with dot paths relative to
the doc root. Array indices are numeric segments.

- `title` → the page title
- `data.sections.0.heading` → first section's heading
- `data.sections.2.cards.0.primaryCta.label` → nested list item field
- `data.meta.0.value` → a case page's first meta row value

Ops:
- `{op:"set", path, value}` — create or replace
- `{op:"remove", path}` — delete a key/list item (list indices)
- `{op:"append", path, value}` — push value onto the array at path

Always `get_page` before updating — work from the actual current shape,
never from memory.

## Creating pages

1. Decide the template. New marketing/landing pages → `freeform`.
   Content types (story/case/program) → use the matching template and
   mirror an existing page's `data` shape exactly.
2. Slugs: lowercase, hyphenated, no leading slash. Nest under a folder to
   place the page in the sitemap (`stories/my-post`, `work/new-case`).
3. `create_page` writes a **draft** — the page is not live until
   published. Tell the user it's staged for review.
4. For freeform pages, call `get_component_schema` for each section type
   you plan to use, then adapt the skeleton content. Replace all
   placeholder copy — never leave "Card title" style stubs.
5. Link to real routes only — check `list_pages` for targets. If you
   reference a page that doesn't exist, create it or pick another target.

## Editing safely

- Prefer targeted `set` ops over rewriting whole `data` objects — fewer
  chances to clobber fields you didn't inspect.
- For `legacy` pages, edit `html`/`css`/`title`/`desc` — the html is real
  extracted markup; preserve its class names (they're styled by the
  shared stylesheet).
- Rich text fields (`richText.html`, story `bodyHtml`, case `overviewHtml`)
  accept HTML — keep it minimal: h2–h4, p, ul/ol, blockquote, strong, em, a.
