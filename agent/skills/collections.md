# Collections — shared card data

`__collections` is one JSON document with three groups:

- `stories` — `{items[], categories[]}` — items: `{href, image, alt,
  title, excerpt, authorImage, authorName, authorDate}`;
  `categories` feeds the index page filter tabs
- `work` — `{featured: {...}, items[]}` — case cards: `{href, image, alt,
  client, title, excerpt}`; `featured` is the big card at the top of /work
- `programs` — `{heading, subheading, items[]}` — items: `{href, title,
  subtitle}`

These cards power the **index pages** (`/stories`, `/work`, `/programs`)
and the **"More stories"/related rails** at the bottom of detail pages.

## Rules

- When you create a new `story`/`case`/`program` page, also add a
  matching card to the right list — otherwise it won't appear on the
  index page.
- `href` in a card must match the page slug exactly (`/stories/x` ↔
  slug `stories/x`).
- Card images: reuse the page's hero image from `/assets/images/*`.
- Keep card fields in the same shape as existing entries — `get_collections`
  first and mirror.
- `update_collections` uses the same dot-path ops as `update_page`,
  relative to the collections doc (`stories.items.0.title`,
  `{op:"append", path:"work.items", value:{...}}`).
- Collections changes are drafts too — they go live on publish
  (`publish_page` with slug `__collections`).
