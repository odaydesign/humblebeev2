/**
 * Homepage sheet colors + section map.
 * Edit tones / blend ranges here — PageTone reads this file.
 *
 * Sequence: white → black → white → yellow
 *   hero + gallery   white
 *   global-team      black (holds for full pin)
 *   next-move        white
 *   statement        white (handoff to yellow on its exit)
 *   footer           yellow
 */

export const PAGE_TONES = {
  white: "#ffffff",
  black: "#000000",
  yellow: "#f7e731",
} as const;

export type PageToneName = keyof typeof PAGE_TONES;

/** Stable section ids — match `id` / `data-section` on each landmark. */
export const HOME_SECTION = {
  hero: "hero",
  gallery: "gallery",
  globalTeam: "global-team",
  nextMove: "next-move",
  statement: "statement",
  programs: "programs",
  footer: "footer",
} as const;

export type HomeSectionId = (typeof HOME_SECTION)[keyof typeof HOME_SECTION];

export const HOME_SECTION_TONE: Record<HomeSectionId, PageToneName> = {
  [HOME_SECTION.hero]: "white",
  [HOME_SECTION.gallery]: "white",
  [HOME_SECTION.globalTeam]: "black",
  [HOME_SECTION.nextMove]: "white",
  [HOME_SECTION.statement]: "white",
  [HOME_SECTION.programs]: "white",
  [HOME_SECTION.footer]: "yellow",
};

/**
 * One ordered color machine (no overlapping tweens).
 * Each blend uses the section’s edge vs viewport — progress 0→1 across start→end.
 *
 * `viewport` is where that edge sits at the start/end of the blend
 * (1 = bottom of viewport, 0 = top, negative = above viewport).
 */
export type ToneBlend = {
  id: string;
  /** Section whose edge drives the blend */
  section: HomeSectionId;
  edge: "top" | "bottom";
  /** Edge position as a fraction of viewport height when blend starts */
  startView: number;
  /** Edge position as a fraction of viewport height when blend ends */
  endView: number;
  from: PageToneName;
  to: PageToneName;
};

/**
 * Evaluated bottom → top (later blends win once their progress > 0).
 * Keep Global Team → white on the team section’s EXIT so the pin stays black.
 */
export const HOME_TONE_BLENDS: ToneBlend[] = [
  {
    id: "gallery-white → team-black",
    section: HOME_SECTION.gallery,
    edge: "bottom",
    startView: 0.55,
    endView: 0,
    from: "white",
    to: "black",
  },
  {
    id: "team-black → next-move-white",
    section: HOME_SECTION.globalTeam,
    edge: "bottom",
    // Only after the pinned team section has nearly left.
    startView: 0.35,
    endView: -0.05,
    from: "black",
    to: "white",
  },
  {
    // The statement section now sits between next-move and the footer, so the
    // white→yellow handoff keys off the STATEMENT's bottom edge — yellow only
    // arrives as the statement exits, not while it is still being read.
    id: "statement-white → footer-yellow",
    section: HOME_SECTION.statement,
    edge: "bottom",
    startView: 0.12,
    endView: -0.2,
    from: "white",
    to: "yellow",
  },
];

/** Soft follow — higher = snappier, lower = silkier. */
export const HOME_TONE_SMOOTHING = 0.55;

/** DOM attrs for a homepage landmark. */
export function homeSectionAttrs(section: HomeSectionId) {
  return {
    id: section,
    "data-section": section,
    "data-page-tone": HOME_SECTION_TONE[section],
  } as const;
}
