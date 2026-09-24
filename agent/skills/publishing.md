# Publishing workflow — drafts, review, going live

## Model

Each page has two states: `published` (what visitors see) and `draft`
(work in progress). All `create_page` / `update_page` writes go to the
draft — the live site never changes until `publish_page` runs.

## Your workflow — always

1. **Draft first.** Make every change via create/update (draft only).
2. **Report what changed.** Summarise the edits plainly: which page,
   which sections, what content. Tell the user to review in the canvas.
3. **Offer to publish.** Ask "want me to publish?" or call
   `publish_page` when the user says to ship it — the tool asks the user
   to click Approve, so nothing goes live without their hand on it.
4. **Never auto-publish.** Even if the task says "update the site",
   the draft → review → confirm loop always applies.

## Rules

- `publish_page` and `delete_page` require user approval in the UI —
  call them when asked; the system handles the confirmation.
- `discard_draft` throws away unpublished changes — only call it when
  the user asks to revert.
- If a page has a draft and the user asks "what's unpublished?", use
  `get_page` and compare against the live page (same path on the site).
- Publishing is near-instant (ISR revalidate ~30s). Newly created pages
  become real routes on publish.
- Deleting removes both draft and published versions — treat it as
  permanent.

## When a task spans pages

A request like "launch the summer campaign" may mean: create a landing
page, add a card to collections, link it from the homepage. Do the edits
as drafts, list every touched slug in your reply, then offer to publish
them one by one (or tell the user each needs an approve click).
