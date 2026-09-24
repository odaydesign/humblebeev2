/* Enrichment for internal links the hero chat recommends — turns a bare
   href into a rich card (kind + title + blurb + image). Client-safe.
   Covers what site-knowledge.md tells the model to link; unknown paths
   render as a generic card with the link's own label. */

export interface LinkCard {
  kind: string;
  title: string;
  blurb?: string;
  image?: string;
}

export const LINK_CARDS: Record<string, LinkCard> = {
  /* ── programs ── */
  "/programs/revenue-growth-program": {
    kind: "Program",
    title: "Revenue Growth",
    blurb: "Find and unlock the revenue B2B companies are sitting on.",
  },
  "/programs/ai-adoption-program": {
    kind: "Program",
    title: "AI Adoption",
    blurb: "Move AI from copilots and chatbots to real business problems.",
  },
  "/programs/customer-experience-program": {
    kind: "Program",
    title: "Customer Experience",
    blurb: "Fix the experience of buying, using and owning what you sell.",
  },
  "/programs/strategic-products-program": {
    kind: "Program",
    title: "Strategic Products",
    blurb: "The team to finally build the product you've been putting off.",
  },
  "/programs/go-to-market-program": {
    kind: "Program",
    title: "Go-To-Market",
    blurb: "Launch great products so they actually land.",
  },
  "/programs/connected-products-program": {
    kind: "Program",
    title: "Connected Products",
    blurb: "Real-time intelligence inside physical products.",
  },
  "/programs/coventures-program": {
    kind: "Program",
    title: "CoVentures",
    blurb: "Build tomorrow's business alongside today's — together.",
  },
  "/programs": {
    kind: "Page",
    title: "All programs",
    blurb: "Every program starts with a question you haven't answered yet.",
  },

  /* ── work cases ── */
  "/work/service-acceleration-at-polestar": {
    kind: "Case",
    title: "Polestar — Digital Services",
    blurb: "An ecosystem of modern digital services for a progressive car company.",
    image: "/assets/images/65fac158e1b0ca7283ac71b7_main.avif",
  },
  "/work/building-a-lab-with-volvo-cars": {
    kind: "Case",
    title: "Volvo Cars — LABS",
    blurb: "Established Volvo's innovation lab and its ways of working.",
    image: "/assets/images/65fad4bc45f429887a2a9ee8_main.avif",
  },
  "/work/wound-support-as-a-service": {
    kind: "Case",
    title: "Mölnlycke — Wound Support",
    blurb: "Instant access to wound-care decisions, as a digital service.",
    image: "/assets/images/65fac11ce845cdc83b466682_main.avif",
  },
  "/work/an-mvp-in-5-weeks-with-stena-metall": {
    kind: "Case",
    title: "Stena Metall — MVP in 5 weeks",
    blurb: "From problem space to running service in five weeks.",
    image: "/assets/images/65fad9f2c99b3b92ca5fc00f_main.avif",
  },
  "/work/surgical-science-cloud-training": {
    kind: "Case",
    title: "Surgical Science — Cloud simulators",
    blurb: "Laparoscopy training moved to the cloud.",
    image: "/assets/images/main.avif",
  },
  "/work/hultafors-group-a-web-platform-for-a-multi-brand-organisation": {
    kind: "Case",
    title: "Hultafors Group — Web platform",
    blurb: "Strategy and production for a multi-brand platform.",
    image: "/assets/images/hultafors_mega_square.avif",
  },
  "/work/measuring-urban-biodiversity": {
    kind: "Case",
    title: "Bloom — Urban biodiversity",
    blurb: "Beehives as biodiversity sensors for cities and property owners.",
    image: "/assets/images/bloom_tn.jpg",
  },
  "/work/justr": {
    kind: "Case",
    title: "Justr — Co-ventured startup",
    blurb: "A new business model and digital service for construction.",
    image: "/assets/images/justr-min.avif",
  },
  "/work/parenting-meets-ai-agent-technology": {
    kind: "Case",
    title: "PLH — Parenting meets AI",
    blurb: "AI agents trained on evidence-based parenting programmes.",
    image: "/assets/images/parenting_humblebee.jpg",
  },
  "/work/sustainable-urban-last-mile-solutions": {
    kind: "Case",
    title: "Velove — Last-mile delivery",
    blurb: "Sustainable urban logistics, as a long-term partner.",
    image: "/assets/images/velove_thumb.avif",
  },
  "/work": {
    kind: "Page",
    title: "Our work",
    blurb: "Real products and services we've designed and built.",
  },

  /* ── utility pages ── */
  "/contact": { kind: "Page", title: "Start a project", blurb: "Tell us what you're building." },
  "/hire-us": { kind: "Page", title: "Hire us", blurb: "Ways to work with the studio." },
  "/careers": { kind: "Page", title: "Careers", blurb: "Join the studio." },
  "/stories": { kind: "Page", title: "Stories", blurb: "Thinking and writing from the studio." },
  "/about-us": { kind: "Page", title: "About us", blurb: "Who we are and how we work." },
  "mailto:hello@humblebee.se": {
    kind: "Email",
    title: "hello@humblebee.se",
    blurb: "Easiest next step — a real conversation with a human.",
  },
};
