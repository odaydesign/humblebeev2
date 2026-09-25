/**
 * SVG path set for footer mark morphing (viewBox 0 0 66 80).
 * Final mark approximates the brand symbol: circular ring + centre bar.
 * Morph sources are polygon-ish (no arcs) so Flubber interpolates cleanly.
 */

function ellipsePoly(cx: number, cy: number, rx: number, ry: number, n = 28): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    pts.push(`${(cx + rx * Math.cos(a)).toFixed(2)} ${(cy + ry * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Tiny centre dot — animation start. */
export const MARK_DOT = ellipsePoly(33, 40, 3.2, 3.2, 16);

/** Growing disc. */
export const MARK_DISC = ellipsePoly(33, 40, 18, 18, 24);

/** Soft square — mid morph. */
export const MARK_SQUIRCLE =
  "M18 22c0-6 5-10 15-10s15 4 15 10v36c0 6-5 10-15 10s-15-4-15-10z";

/** Hexagon — second mid morph. */
export const MARK_HEX = "M33 8l22 14v28l-22 14-22-14v-28z";

/** Outer envelope of the brand mark (solid oval). */
export const MARK_OVAL_POLY = ellipsePoly(33, 40, 31, 38, 32);

/** Morph sequence for Flubber (single closed paths only). */
export const MARK_MORPH_PATHS = [
  MARK_DOT,
  MARK_DISC,
  MARK_HEX,
  MARK_SQUIRCLE,
  MARK_OVAL_POLY,
] as const;

/** Precise brand mark: outer oval (evenodd with inner = ring). */
export const MARK_RING_OUTER = MARK_OVAL_POLY;

export const MARK_RING_INNER = ellipsePoly(33, 40, 19, 22, 28);

/** Horizontal stripe across the ring (the “bee” band). */
export const MARK_BAR = "M8 33h50v14H8z";
