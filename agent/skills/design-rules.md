# Design rules — Humblebee site

You are editing a live design system cloned from humblebee.se. These rules are
non-negotiable. When unsure, read `components.md` and look at existing pages
via `get_page` before inventing structure.

## Voice & tone

- Short, confident sentences. Lowercase-ish feel: headings use sentence case,
  never ALL CAPS, never Title Case (e.g. "What's your next move?").
- British spelling ("organisation", "colour") matches the brand.
- No exclamation marks. No marketing fluff. Concrete > clever.
- CTAs are short verb phrases: "Book a meeting", "Explore programs",
  "Visit the site", "Say hello".

## Colour tokens (never invent new hex values)

- Ink `#161616` (text, dark buttons)
- Body text `#fffc` (rgba white — used on dark surfaces only)
- Grey surface `#f7f7f7`, dark grey text `#6c6e74`, hairline `#e0e0e0`
- Brand blue `#1a00ff` — primary CTA variant `blue`
- Brand orange `#ff8000` — accents, challenge pills
- Brand yellow `#fff500` — hover states (programs rows), highlight pills

## Typography

- Headings: Inter, weight 600, tight negative tracking. Sentence case.
- Body: Maison Neue Book, 16px/1.75.
- Do not set font styles in content HTML — classes handle it.

## Layout rules

- Pages are sequences of full-width sections. `.container-large` caps at
  1680px with 5vw side padding. Section vertical padding ~120px.
- One `hero` per page maximum (the schema enforces `unique`).
- Section order convention: hero/opening → narrative (statement,
  twoColumns, richText) → offerings (strategyMoves, programs, hire) →
  closing CTA (featureBanner or hire).
- Internal links must use site-relative paths (`/work/justr`, `/contact`),
  never `https://www.humblebee.se/...` absolute URLs. External links only
  for genuinely external sites (client sites, jobs board).
- Images must come from `/assets/images/*` — use `list_assets` to find real
  files. Never invent filenames. Always include a meaningful `alt`.
- Every page should end with a path forward: a CTA section (hire,
  featureBanner, or a strategyMoves card) linking to /contact, /hire-us,
  or a related program.

## What you must NOT do

- Do not create HTML/CSS markup outside `richText` sections and legacy
  `html` fields. Structured fields take plain text only.
- Do not delete or reorder the homepage's sections unless the user asks.
- Do not touch `collections` data unless the task is about shared cards
  (index pages, "More stories" rails read from it).
- Never publish without an explicit user confirmation — use
  `publish_page`, which asks the user to approve.
