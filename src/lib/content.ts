/**
 * Content model for the site.
 *
 * This file is the single source of truth for all page content — the same
 * shape a headless CMS would return. Components receive their slice as props
 * and contain no copy of their own, so swapping this file for a CMS fetch
 * later requires no component changes.
 */

export interface LinkItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface CtaButton extends LinkItem {
  variant: "solid" | "ghost" | "blue";
}

/* ── Navigation ─────────────────────────────────────────────── */

export interface StoryCard {
  label: string;
  title: string;
  href: string;
  thumb: ImageAsset;
}

export interface NavContent {
  menuLabel: string;
  closeLabel: string;
  logo: ImageAsset;
  contactHref: string;
  contactIcon: ImageAsset;
  email: string;
  emailLabel: string;
  emailCopiedLabel: string;
  largeLinks: LinkItem[];
  smallLinks: LinkItem[];
  stories: StoryCard[];
}

export const navContent: NavContent = {
  menuLabel: "Menu",
  closeLabel: "x",
  logo: { src: "/assets/images/hblogo.svg", alt: "Humblebee" },
  contactHref: "/contact",
  contactIcon: { src: "/assets/images/contact_env.svg", alt: "Contact" },
  email: "hello@humblebee.se",
  emailLabel: "Say Hello",
  emailCopiedLabel: "Email copied",
  largeLinks: [
    { label: "Programs", href: "/programs" },
    { label: "Work", href: "/work" },
    { label: "CoVentures", href: "/programs/coventures-program" },
  ],
  smallLinks: [
    { label: "About", href: "/about-us" },
    { label: "Careers", href: "/careers" },
    { label: "Hire Us", href: "/hire-us" },
  ],
  stories: [
    {
      label: "Story",
      title: "CoVentures unlock new growth",
      href: "/stories/the-most-effective-weapon-any-company-can-use-but-most-choose-to-ignore",
      thumb: { src: "/assets/images/DSCF7762-cropped.jpg", alt: "" },
    },
    {
      label: "Work",
      title: "Emissions data improvements",
      href: "/work/wallenius-wilhelmsen",
      thumb: { src: "/assets/images/wal_wil_3.png", alt: "" },
    },
    {
      label: "Work",
      title: "CSR app initiative for Healthcare",
      href: "/work/corporate-social-responsibility-in-healthcare",
      thumb: { src: "/assets/images/mhc_csr.jpg", alt: "" },
    },
  ],
};

/* ── Page sections ──────────────────────────────────────────── */

export interface HeroSection {
  type: "hero";
  /** The greeting — rendered as the h1, e.g. "What's your next move?" */
  heading: string;
  /** aria-label for the ask-anything input */
  subheading?: string;
  /** legacy fields — unused by the conversational hero, kept for old docs */
  marqueeImages?: ImageAsset[];
  clientLogos?: ImageAsset[];
}

export interface ChallengePill {
  text: string;
  color: "orange" | "blue";
}

export interface ChallengesSection {
  type: "challenges";
  title: string;
  pills: ChallengePill[];
}

export interface StrategyMoveCard {
  title: string;
  body: string;
  image: ImageAsset;
  primaryCta: CtaButton;
  secondaryCta: CtaButton;
}

export interface StrategyMovesSection {
  type: "strategyMoves";
  heading: string;
  cards: StrategyMoveCard[];
}

export interface ProgramItem {
  title: string;
  subtitle: string;
  href: string;
}

export interface ProgramsSection {
  type: "programs";
  heading: string;
  subheading: string;
  cta: CtaButton;
  programs: ProgramItem[];
  allLink: CtaButton;
}

export interface StatementSection {
  type: "statement";
  text: string;
}

export interface TwoColumnsSection {
  type: "twoColumns";
  heading: string;
  image: ImageAsset;
  body: string;
  cta: CtaButton;
}

export interface HireCard {
  title: string;
  body: string;
  image: ImageAsset;
}

export interface HireSection {
  type: "hire";
  heading: string;
  cards: HireCard[];
  cta: CtaButton;
}

export interface FeatureBannerSection {
  type: "featureBanner";
  eyebrow: string;
  image: ImageAsset;
  heading: string;
  body: string;
  cta: CtaButton;
}

export interface RichTextSection {
  type: "richText";
  html: string;
}

/** Agent-built sections — type is namespaced `custom:slug`, shape is
 *  declared by its registry entry (custom-sections.json), so the model is
 *  intentionally loose here. The `custom:` prefix keeps discriminated
 *  narrowing intact for the built-in types above. */
export interface CustomSection {
  type: `custom:${string}`;
  [k: string]: any;
}

export type Section =
  | HeroSection
  | ChallengesSection
  | StrategyMovesSection
  | ProgramsSection
  | StatementSection
  | TwoColumnsSection
  | HireSection
  | FeatureBannerSection
  | RichTextSection
  | CustomSection;

export const homeSections: Section[] = [
  {
    type: "hero",
    heading: "What's your next move?",
    subheading:
      "We help ambitious organisations discover and build their next advantage.",
    marqueeImages: [
      { src: "/assets/images/image1.png", alt: "Logo" },
      { src: "/assets/images/image4.png", alt: "Logo" },
      { src: "/assets/images/image3_wide.png", alt: "Logo", width: 597 },
      { src: "/assets/images/image10.png", alt: "Logo" },
      { src: "/assets/images/image6.png", alt: "Logo" },
      { src: "/assets/images/image5.png", alt: "Logo" },
      { src: "/assets/images/image7.png", alt: "Logo" },
      { src: "/assets/images/image8_wide.png", alt: "Logo", width: 597 },
      { src: "/assets/images/image2.png", alt: "Logo" },
      { src: "/assets/images/image9.png", alt: "Logo" },
    ],
    clientLogos: [
      { src: "/assets/images/volvo.png", alt: "Volvo" },
      { src: "/assets/images/sandvik.png", alt: "Sandvik" },
      { src: "/assets/images/molnlycke.png", alt: "Mölnlycke" },
      { src: "/assets/images/polestar.png", alt: "Polestar" },
      { src: "/assets/images/tyrens.png", alt: "Tyréns" },
      { src: "/assets/images/walwil.png", alt: "Wallenius Wilhelmsen" },
      { src: "/assets/images/stena.png", alt: "Stena" },
      { src: "/assets/images/astra.png", alt: "AstraZeneca" },
    ],
  },
  {
    type: "challenges",
    title: "We understand your main challenges",
    pills: [
      { text: "AI stuck in pilot projects", color: "orange" },
      { text: "No clear new revenue streams", color: "blue" },
      { text: "Customer experience falling behind", color: "orange" },
      { text: "Aftermarket underperforming", color: "blue" },
      { text: "Workforce productivity held back", color: "orange" },
      { text: "Legacy systems for a different era", color: "blue" },
      { text: "Products not yet connected", color: "orange" },
      { text: "Sustainability requirements tightening", color: "blue" },
      { text: "Machine data collected, rarely used", color: "orange" },
      { text: "Moving slower than the market", color: "blue" },
    ],
  },
  {
    type: "strategyMoves",
    heading: "Your next move",
    cards: [
      {
        title: "Growing revenue?",
        body: "Where will your next revenue stream come from? We help industrial and B2B companies unlock new revenue from existing products, customers and operations.",
        image: { src: "/assets/images/stena_square.jpg", alt: "" },
        primaryCta: {
          label: "Revenue Program",
          href: "/programs/revenue-growth-program",
          variant: "solid",
        },
        secondaryCta: {
          label: "Case Study",
          href: "/work/justr",
          variant: "ghost",
        },
      },
      {
        title: "Improving customer experience?",
        body: "What if your customers loved doing business with you? We design experiences that drive loyalty, reduce churn, and make your brand the easy choice.",
        image: { src: "/assets/images/hellberg_1.webp", alt: "" },
        primaryCta: {
          label: "CX Program",
          href: "/programs/customer-experience-program",
          variant: "solid",
        },
        secondaryCta: {
          label: "Case Study",
          href: "/work/hultafors-group-a-web-platform-for-a-multi-brand-organisation",
          variant: "ghost",
        },
      },
      {
        title: "Launching new products?",
        body: "What if you had the team to finally build that product? Whether it's been stuck on your roadmap for months or years, we provide the design and engineering expertise to take it from concept to launch.",
        image: { src: "/assets/images/essve2.avif", alt: "" },
        primaryCta: {
          label: "Products Program",
          href: "/programs/strategic-products-program",
          variant: "solid",
        },
        secondaryCta: {
          label: "Case Study",
          href: "/work/wallenius-wilhelmsen",
          variant: "ghost",
        },
      },
    ],
  },
  {
    type: "programs",
    heading: "Programs",
    subheading: "Our proven programs to help create your next advantage.",
    cta: { label: "Explore Programs", href: "/programs", variant: "solid" },
    programs: [
      {
        title: "AI Adoption",
        subtitle: "What if AI created measurable business value?",
        href: "/programs/ai-adoption-program",
      },
      {
        title: "Go-To-Market",
        subtitle: "What if your next launch landed perfectly?",
        href: "/programs/go-to-market-program",
      },
      {
        title: "Connected Products",
        subtitle: "What if your physical product had real-time intelligence built in?",
        href: "/programs/connected-products-program",
      },
    ],
    allLink: { label: "All Programs", href: "/programs", variant: "ghost" },
  },
  {
    type: "statement",
    text: "We are a studio of designers and engineers helping companies navigate a rapidly changing world. We work across AI, digital products, new ventures and organisational change to solve complex business challenges.",
  },
  {
    type: "twoColumns",
    heading: "Who we are",
    image: { src: "/assets/images/humblebee-office.avif", alt: "" },
    body: "A product design and engineering studio helping B2B companies launch digital products, services and new ventures.",
    cta: { label: "Book a meeting", href: "/contact", variant: "blue" },
  },
  {
    type: "hire",
    heading: "How to work with us",
    cards: [
      {
        title: "Expert Consultants",
        body: "Need additional capability? Bring in experienced designers, software engineers and product specialists who can strengthen your team from day one.",
        image: { src: "/assets/images/gustaf.png", alt: "" },
      },
      {
        title: "Project Team",
        body: "Need something built? A cross-functional Humblebee team takes ownership. From strategy and design to engineering and launch.",
        image: { src: "/assets/images/projectteam.png", alt: "" },
      },
      {
        title: "CoVenture Team",
        body: "Looking for your next advantage? Partner with us to discover, validate and launch new ventures with shared ambition and shared commitment.",
        image: { src: "/assets/images/coven.png", alt: "" },
      },
    ],
    cta: { label: "Hire Us", href: "/hire-us", variant: "blue" },
  },
  {
    type: "featureBanner",
    eyebrow: "AI Readiness Report",
    image: { src: "/assets/images/aiready.png", alt: "AI Readiness Report" },
    heading: "Are you more AI-ready than your competitors?",
    body: "The AI Readiness Report benchmarks your business, identifies where AI can have the biggest impact, and puts a value on each opportunity. It's free for selected companies during launch.",
    cta: {
      label: "Apply",
      href: "https://aireadiness.humblebee.se",
      variant: "solid",
      external: true,
    },
  },
];

/* ── Footer ─────────────────────────────────────────────────── */

export interface FooterContent {
  largeLinks: LinkItem[];
  smallLinks: LinkItem[];
  bottomLeft: LinkItem[];
  bottomRight: LinkItem[];
}

export const footerContent: FooterContent = {
  largeLinks: navContent.largeLinks,
  smallLinks: navContent.smallLinks,
  bottomLeft: [
    { label: "Stories", href: "/stories" },
    { label: "Responsible AI", href: "/responsible-ai" },
    { label: "Cookie settings", href: "#" },
  ],
  bottomRight: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/humblebee", external: true },
    { label: "Instagram", href: "https://www.instagram.com/wearehumblebee", external: true },
    { label: "Facebook", href: "https://www.facebook.com/wearehumblebee", external: true },
  ],
};

/* ── Metadata ───────────────────────────────────────────────── */

export const siteMeta = {
  title: "Welcome to Humblebee - a digital studio in Sweden",
  description:
    "We're a studio of designers and engineers helping companies navigate a rapidly changing world. We work across AI, digital products and new ventures. We partner well with B2B and industrial companies.",
};
