/**
 * Design system registry — every building block of the site, from smallest
 * atom to page template, with metadata + a live preview renderer.
 *
 * `LEVELS` drives the /design-system catalog page.
 * `EMBEDS` maps an id -> renderable node for iframe previews
 * (`/design-system/embed/[id]`), so each piece can be inspected at any
 * viewport width in isolation.
 */
import type { ReactNode } from "react";
import {
  homeSections,
  navContent,
  footerContent,
  type HeroSection,
  type ChallengesSection,
  type StrategyMovesSection,
  type ProgramsSection,
  type StatementSection,
  type TwoColumnsSection,
  type HireSection,
  type FeatureBannerSection,
} from "./content";
import {
  getCollections,
  getPage,
  type CaseData,
  type ProgramData,
  type StoryData,
} from "./pages";
import customSections from "./custom-sections.json";
import type { CustomSectionEntry } from "./section-schemas";
import { CustomSectionRenderer } from "@/components/CustomSection";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/hero/hero";
import { GalleryMarquee, HOME_GALLERY_ITEMS } from "@/components/gallery/gallery-marquee";
import { Challenges } from "@/components/Challenges";
import { StrategyMoves } from "@/components/StrategyMoves";
import { Programs } from "@/components/Programs";
import { Statement } from "@/components/Statement";
import { TwoColumns } from "@/components/TwoColumns";
import { Hire } from "@/components/Hire";
import { FeatureBanner } from "@/components/FeatureBanner";
import { EmailCopyButton } from "@/components/EmailCopyButton";
import { ArrowIcon, ArrowIconWhite, StoryArrowIcon } from "@/components/ArrowIcon";
import { BackButton } from "@/components/subpages/BackButton";
import { RichText } from "@/components/subpages/RichText";
import { StoryCardItem } from "@/components/subpages/StoryCardItem";
import { ProgramPage } from "@/components/subpages/ProgramPage";
import { CasePage } from "@/components/subpages/CasePage";
import { StoryPage } from "@/components/subpages/StoryPage";
import { ProgramsIndexPage } from "@/components/subpages/ProgramsIndexPage";
import { WorkIndexPage } from "@/components/subpages/WorkIndexPage";
import { StoriesIndexPage } from "@/components/subpages/StoriesIndexPage";
import { LegacyPage } from "@/components/subpages/LegacyPage";

/* ── Types ──────────────────────────────────────────────────── */

export interface DsEntry {
  /** unique id; also the embed route param when `embed` is true */
  id: string;
  name: string;
  /** source file */
  file: string;
  /** what it is / does */
  blurb: string;
  /** smaller pieces it is built from */
  composedOf?: string;
  /** sections/templates/pages that use it */
  usedIn?: string;
  /** where its content comes from */
  content?: string;
  /** responsive behaviour notes */
  responsive?: string;
  /** render in an iframe preview (isolated, media-query aware) */
  embed?: boolean;
  /** iframe height: initial + max cap (embeds auto-report real height) */
  height?: number;
  /** stage background for the iframe */
  stage?: "light" | "dark";
  /** ids of related entries — rendered as cross-reference chips */
  refs?: string[];
  /** a real page that uses this block */
  pageHref?: string;
}

export interface DsLevel {
  id: string;
  title: string;
  blurb: string;
  entries: DsEntry[];
}

/* ── Foundations ────────────────────────────────────────────── */

export const COLORS = [
  { name: "Ink", token: "--ink", value: "#161616", use: "Headings, dark surfaces, overlay bg" },
  { name: "Body", token: "--body", value: "#fffc", use: "Body copy (85% white on white)" },
  { name: "White", token: "--white", value: "#ffffff", use: "Page background" },
  { name: "Grey", token: "--grey", value: "#f7f7f7", use: "Alt section / card background" },
  { name: "Dark grey", token: "--dark-grey", value: "#6c6e74", use: "Secondary text, meta labels" },
  { name: "Line", token: "--line", value: "#e0e0e0", use: "Borders, dividers" },
  { name: "Blue", token: "--blue", value: "#1a00ff", use: "Primary CTAs, hover arrows" },
  { name: "Orange", token: "--orange", value: "#ff8000", use: "Challenge pills, accents" },
  { name: "Yellow", token: "--yellow", value: "#fff500", use: "Program row hover, CTA banner" },
  { name: "Purple", token: "--purple", value: "#9013fe", use: "Author email link" },
];

export const TYPE_SCALE = [
  { el: "h1", size: "64/80", tracking: "-3.2px", use: "Page & hero titles" },
  { el: "h2", size: "48/52", tracking: "-2.4px", use: "Section headings" },
  { el: "h3", size: "40/44", tracking: "-2px", use: "Card titles, statements" },
  { el: "h4", size: "32/36", tracking: "-1.6px", use: "Sub-sections, related lists" },
  { el: "h5", size: "24/28", tracking: "-1.2px", use: "List items, small cards" },
  { el: "p", size: "16/28", tracking: "0", use: "Body — Maison Neue Book" },
];

export const BREAKPOINTS = [
  { bp: "> 991px", label: "Desktop", notes: "Full grids, pinned scroll animations, hover states" },
  { bp: "≤ 991px", label: "Tablet", notes: "Grids collapse to 1–2 cols, nav pill compacts" },
  { bp: "≤ 767px", label: "Mobile landscape", notes: "Challenges becomes card deck, footer stacks" },
  { bp: "≤ 479px", label: "Mobile", notes: "Menu overlay centres, headings scale down" },
];

/* ── Registry ───────────────────────────────────────────────── */

const BUILTIN_LEVELS: DsLevel[] = [
  {
    id: "foundations",
    title: "Foundations",
    blurb:
      "Design tokens every component consumes — colour, type, spacing, breakpoints, and shared interaction patterns.",
    entries: [], // rendered as custom blocks on the catalog page
  },
  {
    id: "atoms",
    title: "Atoms",
    blurb:
      "The smallest pieces — icons, buttons, links, pills, the logo. Everything else is composed of these.",
    entries: [
      {
        id: "arrow-icons",
        refs: ["buttons","nav-story-card","program-row","strategy-card"],

        name: "Arrow Icons",
        file: "src/components/ArrowIcon.tsx",
        blurb:
          "Three variants of the right-arrow motif: `ArrowIcon` (currentColor, for light surfaces), `ArrowIconWhite` (solid CTAs), `StoryArrowIcon` (long line arrow, dark overlay cards).",
        composedOf: "SVG + .sm-icon wrapper",
        usedIn: "Buttons, program rows, nav story cards, strategy cards",
        responsive: "Fixed 20px; line-arrow scales with card width",
        embed: true,
        height: 110,
      },
      {
        id: "buttons",
        refs: ["arrow-icons","strategy-card","programs","hire","feature-banner"],

        name: "Buttons",
        file: "src/app/globals.css (.btn-pill, .btn-blue, .btn-ghost)",
        blurb:
          "Three button styles. `.btn-pill` — black pill + white arrow (primary nav/card CTA). `.btn-blue` — solid blue pill with label block (page-level CTA). `.btn-ghost` — outlined ghost button (secondary CTA).",
        usedIn: "Programs, StrategyMoves, Hire, FeatureBanner, program/case CTAs",
        responsive: "Full-width taps wrap at ≤479px on some pages",
        embed: true,
        height: 200,
      },
      {
        id: "email-copy",
        refs: ["site-nav","site-footer"],

        name: "Email Copy Button",
        file: "src/components/EmailCopyButton.tsx",
        blurb:
          'Pill that reads "Say Hello", reveals the address on hover, copies to clipboard on click and shows a check. Client component.',
        usedIn: "Nav overlay, footer",
        content: "navContent.email / emailLabel / emailCopiedLabel",
        embed: true,
        height: 110,
      },
      {
        id: "back-button",
        refs: ["case","story"],

        name: "Back Button",
        file: "src/components/subpages/BackButton.tsx",
        blurb: "Reversed line-arrow + label. Used at the top of detail pages.",
        usedIn: "Case pages, story pages",
        embed: true,
        height: 90,
      },
      {
        id: "challenge-pill",
        refs: ["challenges"],

        name: "Challenge Pill",
        file: "src/components/Challenges.tsx (.challenge-pill)",
        blurb:
          "Rounded colour-coded label — 10 variants cycling ink/orange/blue. The building block of the scroll-pinned challenges animation.",
        usedIn: "Challenges section",
        responsive: "Re-used as rotating deck cards on ≤767px",
        embed: true,
        height: 140,
      },
      {
        id: "logo",
        refs: ["site-nav","site-footer","nav-pill"],

        name: "Brand Logo",
        file: "public/assets/images/hblogo.svg",
        blurb: "HUMBLEBEE wordmark SVG, centred in the nav pill and reused in the footer.",
        usedIn: "SiteNav, SiteFooter",
        embed: true,
        height: 90,
      },
      {
        id: "rich-text",
        refs: ["case","story","legacy"],

        name: "Rich Text",
        file: "src/components/subpages/RichText.tsx",
        blurb:
          "Renders extracted CMS HTML inside `.w-richtext` — ported Webflow rules reset first/last-child margins and style figures, blockquotes, lists.",
        usedIn: "Case bodies, story bodies, legacy pages",
        embed: true,
        height: 340,
      },
    ],
  },
  {
    id: "molecules",
    title: "Molecules",
    blurb:
      "Atoms joined into small repeatable units — rows, cards, and info blocks that appear inside sections and templates.",
    entries: [
      {
        id: "nav-pill",
        refs: ["logo","site-nav"],

        name: "Nav Pill",
        file: "src/components/SiteNav.tsx (.nav-pill)",
        blurb:
          "Floating capsule = menu button + centred logo + contact icon. Inverts to dark/translucent when the overlay opens.",
        composedOf: "nav-menu-btn + nav-brand + nav-contact-btn",
        responsive: "Keeps layout down to 390px; overlay handles the rest",
        embed: true,
        height: 120,
      },
      {
        id: "nav-story-card",
        refs: ["arrow-icons","site-nav"],

        name: "Nav Story Card",
        file: "src/components/SiteNav.tsx (.nav-story-card)",
        blurb:
          "Menu overlay right-column card: square thumb + label + line-arrow + title. Arrow slides on hover.",
        composedOf: "img + label + StoryArrowIcon + title",
        usedIn: "Nav overlay (×3)",
        embed: true,
        stage: "dark",
        height: 300,
      },
      {
        id: "program-row",
        refs: ["arrow-icons","programs","programs-index"],

        name: "Program Row",
        file: "src/components/Programs.tsx (.programs-item)",
        blurb:
          "Full-width hover row — title + subtitle, circular arrow on the right. Hover floods the row yellow and the arrow circle blue.",
        composedOf: "h5 title + subtitle + ArrowIcon circle",
        usedIn: "Programs section, /programs index",
        responsive: "Text wraps, arrow persists at all widths",
        embed: true,
        height: 120,
      },
      {
        id: "story-card",
        refs: ["author-block","stories-index","story"],

        name: "Story Card",
        file: "src/components/subpages/StoryCardItem.tsx",
        blurb:
          'Image + linked heading + excerpt + author row. `variant="index"` (h5, on /stories grid) or `variant="more"` (h4, related list).',
        composedOf: "work_image + link-heading + text-block-9 + author_wrapper",
        usedIn: "Stories index, More stories lists",
        responsive: "3-col grid → 1-col at ≤767px",
        embed: true,
        height: 480,
      },
      {
        id: "work-card",
        refs: ["work-index","case"],

        name: "Work Card",
        file: "src/components/subpages/WorkIndexPage.tsx (.work_item)",
        blurb: "Case-study card: image + client eyebrow + title + excerpt. Grid item on /work.",
        composedOf: "work_image + text-block-13 client + h4.heading-19 + paragraph-9",
        usedIn: "Work index grid",
        responsive: "Grid collapses to single column ≤767px",
        embed: true,
        height: 520,
      },
      {
        id: "author-block",
        refs: ["story-card","story"],

        name: "Author Block",
        file: "src/components/subpages/StoryPage.tsx (.author_wrapper)",
        blurb:
          "Circular avatar + name + date/email. Two skins: `.author_wrapper` (article top & cards) and `.is-story` (Written-by footer).",
        usedIn: "Story pages, story cards",
        embed: true,
        height: 140,
      },
      {
        id: "meta-list",
        refs: ["case"],

        name: "Case Meta List",
        file: "src/components/subpages/CasePage.tsx (.overview_list)",
        blurb: "Label/value rows on the right of a case overview — Client, Industry, Outcome.",
        usedIn: "Case pages",
        responsive: "Stacks under the overview text on mobile",
        embed: true,
        height: 240,
      },
      {
        id: "contact-block",
        refs: ["case"],

        name: "Contact Block",
        file: "src/components/subpages/CasePage.tsx (.work-contact)",
        blurb: "Portrait + name + mailto + tel. The human CTA at the end of case pages.",
        usedIn: "Case pages (before coffee banner)",
        embed: true,
        height: 200,
      },
      {
        id: "hire-card",
        refs: ["hire"],

        name: "Hire Card",
        file: "src/components/Hire.tsx (.hire-card)",
        blurb: "Image card + h5 + copy — a single offering in the Hire grid.",
        usedIn: "Hire section (×3)",
        responsive: "3-col → 1-col at ≤991px",
        embed: true,
        height: 440,
      },
      {
        id: "strategy-card",
        refs: ["buttons","strategy-moves"],

        name: "Strategy Card",
        file: "src/components/StrategyMoves.tsx (.strategy-move-card)",
        blurb: "Wide image-left card with title, body and solid + ghost CTA pair.",
        composedOf: "img + h3 + p + btn-pill + btn-ghost",
        usedIn: "StrategyMoves section (×3)",
        responsive: "Stacks image-over-text at ≤767px",
        embed: true,
        height: 420,
      },
    ],
  },
  {
    id: "sections",
    title: "Sections",
    blurb:
      "Full-width organisms — the homepage's building blocks plus site chrome. Each maps to a `section.type` in the content model, so a CMS can order them freely.",
    entries: [
      {
        id: "site-nav",
        refs: ["nav-pill","nav-story-card","email-copy","logo"],
        pageHref: "/",

        name: "Site Navigation",
        file: "src/components/SiteNav.tsx",
        blurb:
          "Chrome: floating nav pill + fullscreen menu overlay (large links, small links, email pill, 3 story cards). Click Menu inside the preview.",
        composedOf: "nav-pill + nav-overlay (nav-links-large, nav-links-small, EmailCopyButton, nav-story-card ×3)",
        content: "navContent",
        responsive: "Overlay centres links ≤479px; story cards drop below",
        embed: true,
        height: 560,
      },
      {
        id: "hero",
        refs: ["logo"],
        pageHref: "/",

        name: "Hero",
        file: "src/components/hero/hero.tsx",
        blurb:
          "Conversational hero — greeting + ask-anything input; keyword-routed simulated replies, caret boot (orbit → dot → line), typing sound.",
        composedOf: "greeting h1 + chat thread + composer (custom caret) + Enter pill + mute toggle",
        content: "homeSections[type=hero]",
        responsive: "fluid clamp() type; thread scrolls inside min-height",
        embed: true,
        height: 700,
      },
      {
        id: "gallery",
        refs: [],
        pageHref: "/",

        name: "Gallery Marquee",
        file: "src/components/gallery/gallery-marquee.tsx",
        blurb:
          "Infinite draggable strip — case images + hover-play video + live tiles (CLI terminal, ASCII generator, Space Invaders, online Pong, vinyl deck, wireframe board, brands reel). Hover slides a caption out from under the card; playable cards pause the strip.",
        composedOf: "viewport (drag scrub) + track (duplicated items) + cards + captions + progress dots",
        content: "Section[type=gallery].items — id/kind/src/title/blurb/format/offset per card",
        responsive: "fluid clamp() card widths; md/lg gaps + paddings via scoped utilities",
        embed: true,
        height: 640,
      },
      {
        id: "challenges",
        refs: ["challenge-pill"],
        pageHref: "/",

        name: "Challenges",
        file: "src/components/Challenges.tsx",
        blurb:
          "GSAP ScrollTrigger pinned sequence — title fades while 10 coloured pills fly in over a scrubbed scroll. Mobile swaps to an auto-rotating card deck. Scroll inside the preview.",
        composedOf: "challenges-stage + challenges-title + challenge-pill ×10",
        content: "homeSections[type=challenges]",
        responsive: "Pinned scrub ≥768px; rotating deck ≤767px",
        embed: true,
        height: 560,
      },
      {
        id: "strategy-moves",
        refs: ["strategy-card"],
        pageHref: "/",

        name: "Strategy Moves",
        file: "src/components/StrategyMoves.tsx",
        blurb: "Section heading + three strategy cards (see Molecule: strategy-card).",
        composedOf: "h2 + strategy-move-card ×3",
        content: "homeSections[type=strategyMoves]",
        responsive: "Cards stack image-over-text ≤767px",
        embed: true,
        height: 720,
      },
      {
        id: "programs",
        refs: ["program-row","buttons"],
        pageHref: "/",

        name: "Programs",
        file: "src/components/Programs.tsx",
        blurb: "Heading + sub + pill CTA, then a list of hoverable program rows + ghost All Programs link.",
        composedOf: "programs-header + programs-item ×4 + btn-ghost",
        content: "homeSections[type=programs]",
        embed: true,
        height: 620,
      },
      {
        id: "statement",
        pageHref: "/",

        name: "Statement (word reveal)",
        file: "src/components/Statement.tsx",
        blurb: "Manifesto text that colours in word-by-word as it crosses the viewport (GSAP ScrollTrigger).",
        content: "homeSections[type=statement]",
        responsive: "Same behaviour all widths; text size scales down",
        embed: true,
        height: 420,
      },
      {
        id: "two-columns",
        refs: ["buttons"],
        pageHref: "/",

        name: "Two Columns",
        file: "src/components/TwoColumns.tsx",
        blurb: "'Who we are' — 512px image column + h4 copy column + blue CTA.",
        composedOf: "h2 + img + h4 + btn-blue",
        content: "homeSections[type=twoColumns]",
        responsive: "Columns stack ≤991px",
        embed: true,
        height: 560,
      },
      {
        id: "hire",
        refs: ["hire-card","buttons"],
        pageHref: "/",

        name: "Hire",
        file: "src/components/Hire.tsx",
        blurb: "Heading + 3 hire-card grid + centred blue CTA.",
        composedOf: "h2 + hire-card ×3 + btn-blue",
        content: "homeSections[type=hire]",
        responsive: "Grid → 1-col ≤991px",
        embed: true,
        height: 640,
      },
      {
        id: "feature-banner",
        refs: ["buttons"],
        pageHref: "/",

        name: "Feature Banner",
        file: "src/components/FeatureBanner.tsx",
        blurb: "Grey split banner — left h2 + image, right h4 + copy + CTA pair (AI Readiness Report).",
        composedOf: "h2 + img + h4 + p + btn-pill + btn-ghost",
        content: "homeSections[type=featureBanner]",
        responsive: "Splits stack ≤767px",
        embed: true,
        height: 480,
      },
      {
        id: "site-footer",
        refs: ["email-copy","logo"],
        pageHref: "/",

        name: "Site Footer",
        file: "src/components/SiteFooter.tsx",
        blurb:
          "Black footer: large link group, small links + email pill, bottom row (social/legal). Hover any link — siblings fade.",
        composedOf: "footer-links-large + footer-links-small + EmailCopyButton + footer-bottom-row",
        content: "footerContent + navContent",
        responsive: "Groups stack ≤767px",
        embed: true,
        stage: "dark",
        height: 560,
      },
    ],
  },
  {
    id: "templates",
    title: "Templates",
    blurb:
      "Page-level compositions rendered by `src/app/[...slug]/page.tsx` from typed JSON — the unit a CMS page maps to. Each preview is a real page render.",
    entries: [
      {
        id: "program",
        refs: ["rich-text","buttons"],
        pageHref: "/programs/ai-adoption-program",

        name: "Program Detail",
        file: "src/components/subpages/ProgramPage.tsx",
        blurb:
          "Hero split → outcomes list → statement → black features grid → 'Is this for you' → impact grid → yellow CTA.",
        usedIn: "7 program pages (/programs/*)",
        content: "ProgramData — src/lib/pages/programs__*.json",
        responsive: "Hero split stacks, grids collapse ≤767px",
        embed: true,
        height: 800,
      },
      {
        id: "case",
        refs: ["back-button","meta-list","rich-text","contact-block"],
        pageHref: "/work/justr",

        name: "Case Study",
        file: "src/components/subpages/CasePage.tsx",
        blurb: "Back → title → overview + meta list → richtext body → contact → coffee banner.",
        usedIn: "23 work pages (/work/*)",
        content: "CaseData — src/lib/pages/work__*.json",
        embed: true,
        height: 800,
      },
      {
        id: "story",
        refs: ["back-button","author-block","rich-text","story-card"],
        pageHref: "/stories/what-is-the-cloud",

        name: "Story Article",
        file: "src/components/subpages/StoryPage.tsx",
        blurb:
          "Back → title/subtitle → author → hero → richtext → share row → written-by → More stories.",
        usedIn: "82 story pages (/stories/*)",
        content: "StoryData — src/lib/pages/stories__*.json",
        responsive: "Narrow .container-story column; related grid collapses",
        embed: true,
        height: 800,
      },
      {
        id: "programs-index",
        refs: ["program-row"],
        pageHref: "/programs",

        name: "Programs Index",
        file: "src/components/subpages/ProgramsIndexPage.tsx",
        blurb: "H1 + subheading + all program rows.",
        usedIn: "/programs",
        content: "collections.programs",
        embed: true,
        height: 700,
      },
      {
        id: "work-index",
        refs: ["work-card"],
        pageHref: "/work",

        name: "Work Index",
        file: "src/components/subpages/WorkIndexPage.tsx",
        blurb: "H1 + featured case (split hero card) + work-item grid.",
        usedIn: "/work",
        content: "collections.work (featured + items)",
        responsive: "Featured split stacks ≤767px",
        embed: true,
        height: 800,
      },
      {
        id: "stories-index",
        refs: ["story-card"],
        pageHref: "/stories",

        name: "Stories Index",
        file: "src/components/subpages/StoriesIndexPage.tsx",
        blurb: "H1 + category tabs (All / How we work / Humblebee stories / Meet the bees) + story-card grid. Client-side filter.",
        usedIn: "/stories",
        content: "collections.stories (items + categories)",
        embed: true,
        height: 800,
      },
      {
        id: "legacy",
        refs: ["rich-text"],
        pageHref: "/contact",

        name: "Legacy Page",
        file: "src/components/subpages/LegacyPage.tsx",
        blurb:
          "Fallback renderer — sanitized extracted markup + per-page CSS for the ~43 unique pages (about, contact, careers, journeys, fast-track, events…).",
        usedIn: "All non-collection routes",
        content: "PageData.html + PageData.css",
        embed: true,
        height: 800,
      },
    ],
  },
];

/* ── Embed render map ───────────────────────────────────────── */

function sec<T extends { type: string }>(type: string): T {
  const s = homeSections.find((x) => x.type === type);
  if (!s) throw new Error(`no section of type ${type}`);
  return s as unknown as T;
}

const collections = getCollections();

/** Bare-stage wrapper used by a few molecule previews. */
function stage(children: ReactNode, dark = false, pad = 24) {
  return (
    <div
      style={{
        padding: pad,
        background: dark ? "#161616" : "#fff",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

export const EMBEDS: Record<string, () => ReactNode> = {
  /* atoms */
  "arrow-icons": () =>
    stage(
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <span className="sm-icon"><ArrowIcon /></span>
        <span style={{ background: "#1a00ff", padding: 12, borderRadius: 999 }}>
          <ArrowIconWhite />
        </span>
        <span style={{ background: "#161616", padding: "12px 20px", borderRadius: 12 }}>
          <StoryArrowIcon />
        </span>
      </div>
    ),
  buttons: () =>
    stage(
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <a className="btn-pill" href="#"><span>Button Pill</span><ArrowIconWhite /></a>
        <a className="btn-blue" href="#"><div className="btn-blue-label">Button Blue</div></a>
        <a className="btn-ghost" href="#"><span>Button Ghost</span><ArrowIcon /></a>
      </div>
    ),
  "email-copy": () =>
    stage(
      <EmailCopyButton
        email={navContent.email}
        label={navContent.emailLabel}
        copiedLabel={navContent.emailCopiedLabel}
      />
    ),
  "back-button": () => stage(<BackButton href="#" label="Back" />),
  "challenge-pill": () =>
    stage(
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="challenge-pill"><span>Strategy</span></div>
        <div className="challenge-pill orange"><span>Branding</span></div>
        <div className="challenge-pill blue"><span>Technology</span></div>
      </div>
    ),
  logo: () =>
    stage(
      // eslint-disable-next-line @next/next/no-img-element
      <img src={navContent.logo.src} alt={navContent.logo.alt} style={{ width: 180 }} />
    ),
  "rich-text": () =>
    stage(
      <RichText
        html={`<h2>Rich text heading</h2><p>Body copy inside <strong>.w-richtext</strong> — extracted HTML renders with ported Webflow styles, local images and reset margins.</p><ul><li>List item one</li><li>List item two</li></ul><blockquote>Blockquote styling comes along too.</blockquote>`}
      />
    ),

  /* molecules */
  "nav-pill": () =>
    stage(
      <div style={{ position: "relative", height: 90 }}>
        <nav className="nav-pill" style={{ position: "absolute" }}>
          <button className="nav-menu-btn" type="button">
            <span className="nav-menu-label">{navContent.menuLabel}</span>
          </button>
          <div className="nav-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href="/"><img src={navContent.logo.src} alt={navContent.logo.alt} /></a>
          </div>
          <a href={navContent.contactHref} className="nav-contact-btn" aria-label="Contact">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={navContent.contactIcon.src} alt={navContent.contactIcon.alt} />
          </a>
        </nav>
      </div>
    ),
  "nav-story-card": () =>
    stage(
      <div style={{ maxWidth: 400, display: "grid", gap: 16 }}>
        {navContent.stories.map((s) => (
          <a key={s.href} href={s.href} className="nav-story-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.thumb.src} alt={s.thumb.alt} className="nav-story-thumb" />
            <div className="nav-story-info">
              <div className="nav-story-meta">
                <div className="nav-story-label">{s.label}</div>
                <StoryArrowIcon />
              </div>
              <div className="nav-story-title">{s.title}</div>
            </div>
          </a>
        ))}
      </div>,
      true
    ),
  "program-row": () =>
    stage(
      <div className="programs-list" style={{ margin: 0 }}>
        {collections.programs.items.slice(0, 2).map((p) => (
          <a key={p.href} href={p.href} className="programs-item">
            <div className="programs-item-info">
              <h5 className="programs-item-title">{p.title}</h5>
              <div className="programs-item-subtitle">{p.subtitle}</div>
            </div>
            <div className="programs-item-btn"><ArrowIcon /></div>
          </a>
        ))}
      </div>
    ),
  "story-card": () =>
    stage(
      <div style={{ maxWidth: 420 }}>
        <StoryCardItem card={collections.stories.items[0]} />
      </div>
    ),
  "work-card": () =>
    stage(
      <div style={{ maxWidth: 560 }}>
        {(() => {
          const w = collections.work.items[0];
          return (
            <div role="listitem" className="work_item w-dyn-item">
              <a href={w.href} className="work_image-wrapper w-inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={w.alt} src={w.image} className="work_image" />
              </a>
              <div>
                <div className="margin-bottom margin-xxsmall">
                  <div className="text-block-13">{w.client}</div>
                </div>
                <div className="margin-bottom margin-xsmall">
                  <a href={w.href} className="link-heading-white w-inline-block">
                    <h4 className="heading-19">{w.title}</h4>
                  </a>
                </div>
                <p className="paragraph-9">{w.excerpt}</p>
              </div>
            </div>
          );
        })()}
      </div>
    ),
  "author-block": () =>
    stage(
      <div style={{ display: "grid", gap: 40 }}>
        <div className="author_wrapper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={collections.stories.items[0].authorImage} alt="" className="author-img" />
          <div className="author_info">
            <div className="author_name">{collections.stories.items[0].authorName}</div>
            <div className="author_date">Mar 12, 2025</div>
          </div>
        </div>
        <div className="author_wrapper is-story">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={collections.stories.items[0].authorImage} alt="" className="author-img-story" />
          <div className="author_info">
            <div className="author_date">Written by</div>
            <div>{collections.stories.items[0].authorName}</div>
            <a href={`mailto:${navContent.email}`} className="text-color-purple">{navContent.email}</a>
          </div>
        </div>
      </div>
    ),
  "meta-list": () =>
    stage(
      <div className="overview_list" style={{ maxWidth: 360 }}>
        {(getPage("work/justr")?.data as CaseData | undefined)?.meta.map((m, i) => (
          <div key={i}>
            <div className="overview-title">{m.label}</div>
            <div>{m.value}</div>
          </div>
        ))}
      </div>
    ),
  "contact-block": () =>
    stage(
      (() => {
        const c = (getPage("work/justr")?.data as CaseData | undefined)?.contact;
        return c ? (
          <div className="work-contact">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt={c.name} className="contact-person-img" />
            <div className="work-contact-info">
              <h4 className="text-size-medium text-align-left">{c.name}</h4>
              <a href={`mailto:${c.email}`}>{c.email}</a>
              {c.phone && <a href={`tel:${c.phone}`}>{c.phone}</a>}
            </div>
          </div>
        ) : null;
      })()
    ),
  "hire-card": () =>
    stage(
      <div style={{ maxWidth: 420 }}>
        {(() => {
          const s = sec<HireSection>("hire");
          const c = s.cards[0];
          return (
            <div className="hire-card">
              <div className="hire-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image.src} alt={c.image.alt} />
              </div>
              <div className="hire-card-text"><h5>{c.title}</h5><div>{c.body}</div></div>
            </div>
          );
        })()}
      </div>
    ),
  "strategy-card": () =>
    stage(
      (() => {
        const s = sec<StrategyMovesSection>("strategyMoves");
        const c = s.cards[0];
        return (
          <div className="strategy-move-card">
            <div className="strategy-move-card-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image.src} alt={c.image.alt} />
            </div>
            <div className="strategy-move-card-content">
              <div className="strategy-move-card-info">
                <h3 className="strategy-move-card-title">{c.title}</h3>
                <p className="strategy-move-card-body">{c.body}</p>
              </div>
              <div className="strategy-move-card-ctas">
                <a href={c.primaryCta.href} className="btn-pill"><span>{c.primaryCta.label}</span><ArrowIconWhite /></a>
                <a href={c.secondaryCta.href} className="btn-ghost"><span>{c.secondaryCta.label}</span><ArrowIcon /></a>
              </div>
            </div>
          </div>
        );
      })()
    ),

  /* sections */
  "site-nav": () => <SiteNav content={navContent} />,
  hero: () => <Hero section={sec<HeroSection>("hero")} />,
  gallery: () => <GalleryMarquee items={HOME_GALLERY_ITEMS} />,
  challenges: () => <Challenges section={sec<ChallengesSection>("challenges")} />,
  "strategy-moves": () => <StrategyMoves section={sec<StrategyMovesSection>("strategyMoves")} />,
  programs: () => <Programs section={sec<ProgramsSection>("programs")} />,
  statement: () => <Statement section={sec<StatementSection>("statement")} />,
  "two-columns": () => <TwoColumns section={sec<TwoColumnsSection>("twoColumns")} />,
  hire: () => <Hire section={sec<HireSection>("hire")} />,
  "feature-banner": () => <FeatureBanner section={sec<FeatureBannerSection>("featureBanner")} />,
  "site-footer": () => <SiteFooter content={footerContent} nav={navContent} />,

  /* templates — real page data */
  program: () => (
    <ProgramPage data={getPage("programs/ai-adoption-program")!.data as ProgramData} />
  ),
  case: () => <CasePage data={getPage("work/justr")!.data as CaseData} />,
  story: () => (
    <StoryPage
      data={getPage("stories/what-is-the-cloud")!.data as StoryData}
      allStories={collections.stories.items}
    />
  ),
  "programs-index": () => <ProgramsIndexPage data={collections.programs} />,
  "work-index": () => <WorkIndexPage data={collections.work} />,
  "stories-index": () => <StoriesIndexPage data={collections.stories} />,
  legacy: () => {
    const p = getPage("contact")!;
    return <LegacyPage html={p.html || ""} css={p.css} />;
  },
};

/* ── Agent-built components ─────────────────────────────────── */

const customRegistry = customSections as CustomSectionEntry[];
const slugOf = (t: string) => t.replace(/^custom:/, "");

export const LEVELS: DsLevel[] = [
  ...BUILTIN_LEVELS,
  ...(customRegistry.length
    ? [
        {
          id: "custom",
          title: "Custom",
          blurb:
            "Sections designed and built by the Studio agent. Each maps to a `custom:*` section type and works everywhere built-ins do — palette, inspector, canvas editing.",
          entries: customRegistry.map((c) => ({
            id: `custom-${slugOf(c.type)}`,
            name: c.name,
            file: `src/components/custom/${c.component}.tsx`,
            blurb: `${c.blurb} (agent-built)`,
            embed: true,
            height: 480,
          })),
        } as DsLevel,
      ]
    : []),
];

const customEmbeds: Record<string, () => ReactNode> = Object.fromEntries(
  customRegistry.map((c) => [
    `custom-${slugOf(c.type)}`,
    () => stage(<CustomSectionRenderer section={structuredClone(c.skeleton) as any} />),
  ])
);

const ALL_EMBEDS: Record<string, () => ReactNode> = { ...EMBEDS, ...customEmbeds };

export function getEmbedIds(): string[] {
  return Object.keys(ALL_EMBEDS);
}

export function getEmbed(id: string): (() => ReactNode) | undefined {
  return ALL_EMBEDS[id];
}
