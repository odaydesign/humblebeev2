import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'src/lib/pages');

export interface PageIndexEntry {
  slug: string;
  title: string;
  template:
    | 'legacy'
    | 'program'
    | 'case'
    | 'story'
    | 'programsIndex'
    | 'workIndex'
    | 'storiesIndex'
    | 'freeform'
    | 'collections';
}

export interface FreeformData {
  sections: import('./content').Section[];
}

export interface ProgramData {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  outcomes: string[];
  outcomeHeading: string;
  statement: string;
  featuresHeading: string;
  featuresIntro: string;
  features: { title: string; body: string }[];
  forYouHeading: string;
  forYou: string[];
  opportunitiesHeading: string;
  opportunitiesIntro: string;
  opportunities: { title: string; body: string }[];
  cta?: {
    heading: string;
    body: string;
    btnLabel: string;
    btnHref: string;
    image: string;
  };
}

export interface CaseData {
  title: string;
  overview: string;
  siteLink?: string;
  siteLinkLabel?: string;
  meta: { label: string; value: string }[];
  bodyHtml: string;
  ctaHeading?: string;
  contact?: { image: string; name: string; email: string; phone: string };
  coffeeBanner?: {
    heading: string;
    body: string;
    btnHref: string;
    btnLabel: string;
    image: string;
  };
}

export interface StoryData {
  title: string;
  subtitle: string;
  author?: { image: string; name: string; date: string };
  heroImage?: string;
  heroAlt?: string;
  bodyHtml: string;
  writtenBy?: { image: string; name: string; email: string };
  related?: string[];
}

export interface StoryCard {
  href: string;
  image: string;
  alt: string;
  title: string;
  excerpt: string;
  authorImage: string;
  authorName: string;
  authorDate: string;
}

export interface WorkCard {
  href: string;
  image: string;
  alt: string;
  client: string;
  title: string;
  excerpt: string;
}

export interface Collections {
  stories: { items: StoryCard[]; categories: { name: string; hrefs: string[] }[] };
  work: { featured: WorkCard; items: WorkCard[] };
  programs: {
    heading: string;
    subheading: string;
    items: { href: string; title: string; subtitle: string }[];
  };
}

export interface PageData {
  slug: string;
  title: string;
  desc: string;
  template: PageIndexEntry['template'];
  html?: string;
  css?: string;
  data?: ProgramData | CaseData | StoryData | FreeformData;
}

export function getPageIndex(): PageIndexEntry[] {
  // Re-read each call — the Studio writes pages/index entries at runtime.
  return JSON.parse(
    fs.readFileSync(path.join(PAGES_DIR, 'index.json'), 'utf8')
  );
}

export function getPage(slug: string): PageData | null {
  const file = path.join(PAGES_DIR, slug.replace(/\//g, '__') + '.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function getCollections(): Collections {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/lib/collections.json'), 'utf8')
  );
}
