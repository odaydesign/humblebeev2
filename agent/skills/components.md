# Component catalog — canvas sections

Pages with template `freeform` are built from `data.sections[]` — an ordered
list of typed blocks rendered by SectionRenderer. Use `get_component_schema`
for the exact field shape + a starter skeleton before creating sections.

| type            | Use for                                                            | Key fields |
|-----------------|--------------------------------------------------------------------|-----------|
| `hero`          | Page opener: big heading + sub + marquee images + client logos. Max 1/page. | heading, subheading, marqueeImages[], clientLogos[] |
| `challenges`    | Scroll-pinned pill sequence naming customer pains.                 | title, pills[{text,color:orange|blue}] |
| `strategyMoves` | Wide image-left cards with dual CTAs — offerings, featured work.   | heading, cards[{title,body,image,primaryCta,secondaryCta}] |
| `programs`      | Hoverable link rows to program pages.                              | heading, subheading, cta, programs[{title,subtitle,href}], allLink |
| `statement`     | Manifesto paragraph, word-by-word scroll reveal. Keep < 40 words.  | text |
| `twoColumns`    | Image + copy split — "who we are", single focused message.         | heading, image, body, cta |
| `hire`          | 3-card offering grid + centred CTA — "how to work with us".        | heading, cards[3]{title,body,image}, cta |
| `featureBanner` | Grey split banner for one featured thing (report, event, product). | eyebrow, image, heading, body, cta |
| `richText`      | Free-form text: headings, paragraphs, lists, quotes (HTML).        | html |

## CTA object shape

`{ label: string, href: string, variant: "solid"|"ghost"|"blue", external?: bool }`
- `solid` = ink pill (default), `blue` = brand blue (primary actions),
  `ghost` = text link with arrow (secondary).
- `external: true` only for off-site links.

## Composition recipes

- **Landing page:** hero → statement → strategyMoves → programs or hire →
  featureBanner.
- **Offering/service page:** hero → richText (details) → hire →
  featureBanner CTA.
- **Announcement:** statement (or slim hero) → richText → twoColumns CTA.
- Keep pages to 3–6 sections. Empty `clientLogos`/`marqueeImages` arrays
  are valid — the components degrade gracefully.

## Structured templates (not section-based)

`program`, `case`, `story`, `legacy`, `storiesIndex`, `workIndex`,
`programsIndex` have a fixed layout and a `data` object with their own
fields. Always `get_page` an existing example and mirror its shape exactly
before creating or editing one.
