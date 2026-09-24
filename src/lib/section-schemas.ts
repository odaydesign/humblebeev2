/**
 * Declarative field schemas for every canvas section type — the contract
 * between the Studio inspector and the typed content model. Each schema
 * describes the editable fields (dot-paths into the section object), the
 * palette card metadata, layout rules (unique-per-page), and a factory for
 * new sections dropped onto the canvas.
 */
import type { Section } from "./content";
import customSections from "./custom-sections.json";

/** Registry entry for agent-built components (see
 *  agent/skills/component-development.md). `skeleton` doubles as the
 *  factory payload — `make` returns a deep copy. */
export interface CustomSectionEntry {
  type: `custom:${string}`;
  component: string;
  name: string;
  icon: string;
  blurb: string;
  unique?: boolean;
  fields: Field[];
  skeleton: Record<string, any>;
}

const CUSTOM_SCHEMAS: SectionSchema[] = (customSections as CustomSectionEntry[]).map((c) => ({
  type: c.type,
  name: c.name,
  icon: c.icon,
  blurb: c.blurb,
  unique: c.unique,
  fields: c.fields,
  make: () => structuredClone(c.skeleton) as Section,
}));

export type Field =
  | { k: string; l: string; t: "text" | "textarea" | "image" | "href" | "email"; hint?: string }
  | { k: string; l: string; t: "select"; options: { v: string; l: string }[] }
  | { k: string; l: string; t: "switch" }
  | { k: string; l: string; t: "list"; item: string; fields: Field[] }
  | { k: string; l: string; t: "group"; fields: Field[] }
  | { k: string; l: string; t: "cta" };

export interface SectionSchema {
  type: string;
  name: string;
  icon: string;
  blurb: string;
  /** at most one per page */
  unique?: boolean;
  fields: Field[];
  make: () => Section;
}

const IMG = { src: "/assets/images/humblebee-office.avif", alt: "" };

const BUILTIN_SCHEMAS: SectionSchema[] = [
  {
    type: "hero",
    name: "Hero",
    icon: "▲",
    blurb: "Conversational hero — greeting + ask-anything input with simulated replies. Page opener.",
    unique: true,
    fields: [
      { k: "heading", l: "Greeting", t: "text" },
      { k: "subheading", l: "Input aria-label", t: "text" },
    ],
    make: () => ({
      type: "hero",
      heading: "What's your next move?",
      subheading: "Ask Humblebee anything",
    }),
  },
  {
    type: "challenges",
    name: "Challenges",
    icon: "●",
    blurb: "Scroll-pinned sequence — title fades while coloured pills fly in.",
    fields: [
      { k: "title", l: "Title", t: "text" },
      {
        k: "pills", l: "Pills", t: "list", item: "pill",
        fields: [
          { k: "text", l: "Text", t: "text" },
          {
            k: "color", l: "Colour", t: "select",
            options: [
              { v: "orange", l: "Orange" },
              { v: "blue", l: "Blue" },
            ],
          },
        ],
      },
    ],
    make: () => ({
      type: "challenges",
      title: "We understand your main challenges",
      pills: [
        { text: "AI stuck in pilot projects", color: "orange" },
        { text: "No clear new revenue streams", color: "blue" },
        { text: "Legacy systems for a different era", color: "orange" },
      ],
    }),
  },
  {
    type: "strategyMoves",
    name: "Strategy Moves",
    icon: "◆",
    blurb: "Heading + wide image-left cards with dual CTAs.",
    fields: [
      { k: "heading", l: "Heading", t: "text" },
      {
        k: "cards", l: "Cards", t: "list", item: "card",
        fields: [
          { k: "title", l: "Title", t: "text" },
          { k: "body", l: "Body", t: "textarea" },
          { k: "image", l: "Image", t: "image" },
          { k: "primaryCta", l: "Primary CTA", t: "cta" },
          { k: "secondaryCta", l: "Secondary CTA", t: "cta" },
        ],
      },
    ],
    make: () => ({
      type: "strategyMoves",
      heading: "Your next move",
      cards: [
        {
          title: "Card title",
          body: "Describe the offer in one or two sentences.",
          image: IMG,
          primaryCta: { label: "Learn more", href: "/contact", variant: "solid" },
          secondaryCta: { label: "Case Study", href: "/work", variant: "ghost" },
        },
      ],
    }),
  },
  {
    type: "programs",
    name: "Programs List",
    icon: "≡",
    blurb: "Hoverable program rows + header CTA + All link.",
    fields: [
      { k: "heading", l: "Heading", t: "text" },
      { k: "subheading", l: "Subheading", t: "text" },
      { k: "cta", l: "Header CTA", t: "cta" },
      {
        k: "programs", l: "Rows", t: "list", item: "row",
        fields: [
          { k: "title", l: "Title", t: "text" },
          { k: "subtitle", l: "Subtitle", t: "text" },
          { k: "href", l: "Link", t: "href" },
        ],
      },
      { k: "allLink", l: "All link", t: "cta" },
    ],
    make: () => ({
      type: "programs",
      heading: "Programs",
      subheading: "Our proven programs to help create your next advantage.",
      cta: { label: "Explore Programs", href: "/programs", variant: "solid" },
      programs: [
        { title: "Program row", subtitle: "One-line promise", href: "/programs" },
      ],
      allLink: { label: "All Programs", href: "/programs", variant: "ghost" },
    }),
  },
  {
    type: "statement",
    name: "Statement",
    icon: "¶",
    blurb: "Manifesto text that colours in word-by-word on scroll.",
    fields: [{ k: "text", l: "Text", t: "textarea" }],
    make: () => ({
      type: "statement",
      text: "Write a bold statement — each word reveals as the reader scrolls.",
    }),
  },
  {
    type: "twoColumns",
    name: "Two Columns",
    icon: "◫",
    blurb: "Image column + copy column + blue CTA.",
    fields: [
      { k: "heading", l: "Heading", t: "text" },
      { k: "image", l: "Image", t: "image" },
      { k: "body", l: "Body", t: "textarea" },
      { k: "cta", l: "CTA", t: "cta" },
    ],
    make: () => ({
      type: "twoColumns",
      heading: "Who we are",
      image: IMG,
      body: "A product design and engineering studio helping companies launch digital products, services and new ventures.",
      cta: { label: "Book a meeting", href: "/contact", variant: "blue" },
    }),
  },
  {
    type: "hire",
    name: "Hire Cards",
    icon: "▦",
    blurb: "3-card offering grid + centred blue CTA.",
    fields: [
      { k: "heading", l: "Heading", t: "text" },
      {
        k: "cards", l: "Cards", t: "list", item: "card",
        fields: [
          { k: "title", l: "Title", t: "text" },
          { k: "body", l: "Body", t: "textarea" },
          { k: "image", l: "Image", t: "image" },
        ],
      },
      { k: "cta", l: "CTA", t: "cta" },
    ],
    make: () => ({
      type: "hire",
      heading: "How to work with us",
      cards: [
        { title: "Card one", body: "Offering description.", image: IMG },
        { title: "Card two", body: "Offering description.", image: IMG },
        { title: "Card three", body: "Offering description.", image: IMG },
      ],
      cta: { label: "Hire Us", href: "/hire-us", variant: "blue" },
    }),
  },
  {
    type: "featureBanner",
    name: "Feature Banner",
    icon: "◈",
    blurb: "Grey split banner — heading + image left, copy + CTAs right.",
    fields: [
      { k: "eyebrow", l: "Eyebrow", t: "text" },
      { k: "image", l: "Image", t: "image" },
      { k: "heading", l: "Heading", t: "text" },
      { k: "body", l: "Body", t: "textarea" },
      { k: "cta", l: "CTA", t: "cta" },
    ],
    make: () => ({
      type: "featureBanner",
      eyebrow: "Featured",
      image: { src: "/assets/images/aiready.png", alt: "" },
      heading: "Banner heading",
      body: "Supporting copy for the feature.",
      cta: { label: "Apply", href: "/contact", variant: "solid" },
    }),
  },
  {
    type: "richText",
    name: "Rich Text",
    icon: "✎",
    blurb: "Free text block — paragraphs, headings, lists, quotes.",
    fields: [{ k: "html", l: "Content (HTML)", t: "textarea" }],
    make: () => ({
      type: "richText",
      html: "<h3>Text section</h3><p>Write freely — headings, paragraphs, lists and quotes render with the site typography.</p>",
    }),
  },
];

/** All section schemas — built-ins plus agent-registered customs (palette,
 *  inspector and the agent all read this merged list). */
export const SECTION_SCHEMAS: SectionSchema[] = [...BUILTIN_SCHEMAS, ...CUSTOM_SCHEMAS];
export const SCHEMA_BY_TYPE = new Map(SECTION_SCHEMAS.map((s) => [s.type, s]));

/* ── dot-path helpers (shared by inspector + preview) ───────── */

export function getPath(obj: any, path: string) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setPath(obj: any, path: string, value: any) {
  const keys = path.split(".");
  const last = keys.pop()!;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let parent = clone;
  for (const k of keys) {
    parent[k] = Array.isArray(parent[k]) ? [...parent[k]] : { ...parent[k] };
    parent = parent[k];
  }
  parent[last] = value;
  return clone;
}
