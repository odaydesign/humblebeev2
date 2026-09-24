# Component development — building new design-system pieces

You can **write real code**: new section components, their styles, and their
registration — they become first-class citizens (palette card, inspector
fields, in-canvas editing, design-system catalog). This is your most
powerful capability and the easiest place to break things — follow this
contract exactly.

## When to build vs. compose

- User asks for a *page* → compose existing sections first (read `components.md`).
- User asks for a *component/design pattern* that doesn't exist (an FAQ
  accordion, a team grid, a testimonial carousel) → build it.
- Small variant of an existing section → prefer composing; only build when
  the structure genuinely differs.

## The workflow — always in this order

1. `read_guide('component-development')` (this doc) + `read_guide('design-rules')`.
2. `list_custom_components` — check it doesn't already exist.
3. `create_component` — write the `.tsx` file.
4. `write_component_css` — write its styles.
5. `register_section` — declare type/fields/skeleton so it appears everywhere.
6. Tell the user it's on the canvas; suggest adding it to a page to review.
   Then offer publish only after they've seen it.

## Component contract

File: `src/components/custom/{PascalName}Section.tsx`, written via
`create_component`. Shape:

```tsx
"use client"; // only if you use hooks/state — omit otherwise

export default function FaqSection({ section }: { section: any }) {
  return (
    <section className="faq">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            <h2 data-hb-f="heading">{section.heading}</h2>
            ...
          </div>
        </div>
      </div>
    </section>
  );
}
```

Rules:

- **Props**: exactly `{ section }` — the section data object.
- **Layout shell**: reuse `.padding-global` + `.container-large` +
  `.padding-section-medium` (existing layout utilities — never invent your own).
- **In-canvas editing**: every editable text element carries
  `data-hb-f="{field-path}"` (e.g. `data-hb-f="heading"`,
  `data-hb-f="items.0.q"` inside lists). Images carry
  `data-hb-img="{path}"`, links `data-hb-link="{path}"`. Without these the
  component renders but can't be edited on canvas.
- **Imports allowed**: `react`, `next/image`, `next/link`, `@/components/*`,
  `@/lib/*` (types only). **Forbidden**: `fs`, `child_process`, network
  calls, external npm packages, `<script>`, remote CDN assets/fonts.
- **Type it loosely**: `section: any` — the content model doesn't define
  custom shapes statically.
- Keep markup semantic (h2–h5, ul/li, figure). Sentence case copy, British
  spelling — `design-rules.md` applies to any default text you write.

## Styling contract

All styles go in `src/app/custom.css` via `write_component_css` — never
inline `style={{}}` for layout-critical rules, never touch `globals.css`
or `legacy.css`.

- **Prefix every class** with the component slug: `custom:faq` → `.faq-*`
  (`.faq`, `.faq-item`, `.faq-item.is-open`). The tool rejects selectors
  without the prefix.
- **Use design tokens**: `var(--ink)`, `var(--blue)`, `var(--grey)`,
  `var(--line)`, `var(--dark-grey)`, `var(--orange)`, `var(--yellow)`.
- **Type**: headings inherit Inter 600; body Maison Neue. Match the scale —
  h2 48/52, h3 40/44, h5 24/28, p 16/28 — don't invent sizes.
- **Responsive is mandatory**: write rules for `max-width: 991px` and
  `max-width: 479px` — grids collapse to 1 col, font sizes step down,
  horizontal scrolling is a bug not a feature.
- **Pills/buttons**: reuse `.btn-pill`, `.btn-blue`, `.btn-ghost` classes
  instead of restyling CTAs.
- Radius 16–24px on cards, borders `1px solid var(--line)` — match the
  existing visual language.

## Registration contract

`register_section` declares the schema:

- `type`: short slug, lowercase-hyphen (`faq`, `team-grid`). The system
  prefixes it to `custom:faq` — you never write the prefix yourself.
- `component`: the PascalName used in `create_component` (`FaqSection`).
- `fields`: inspector schema — same shape as built-ins:
  `{ k: "heading", l: "Heading", t: "text" }` — types: `text`, `textarea`,
  `image`, `href`, `email`, `select` (with `options`), `switch`,
  `list` (with `item` label + nested `fields`), `group`, `cta`.
- `skeleton`: the complete default section object a new canvas drop gets.
  **Real, finished copy** — never "Lorem", never "Item 1". Write defaults
  in Humblebee's voice (a user dropping a Team Grid gets believable
  content, not placeholders).
- Field `k` paths must match the skeleton keys and the `data-hb-*` bindings
  in the component — all three stay in sync.

## Updating & removing

- `update_component` rewrites the file (same validations). Re-read your own
  code first if iterating on feedback.
- `write_component_css` replaces that component's whole CSS block.
- `remove_component` deletes file + styles + registration — **user
  confirmation required**; warn them which pages use it (`list_pages` +
  check sections yourself if unsure).

## Hard rules

- Never modify files outside `src/components/custom/` and `custom.css`.
- Never register a section without creating the component first.
- Never invent section types outside `custom:*`.
- If a request needs capability the contract forbids (e.g. a third-party
  widget, new npm dep), say so — propose the closest buildable version.
- After registering, summarise: component name, type, what it looks like,
  and that it's live in the palette + design system.
