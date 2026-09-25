import * as React from "react";

/** Simplified geometric partner marks — B&W lab marks, not official trademarks. */

export type PartnerMark = {
  id: string;
  name: string;
  code: string;
  Mark: React.FC<{ className?: string }>;
};

function VolvoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="5.5" fill="currentColor" />
      <path d="M18 3v4M18 29v4M3 18h4M29 18h4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SpotifyMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="16" fill="currentColor" />
      <path
        d="M10 14c7-2.2 14-2 18 0M10 18.5c6-1.7 12-1.6 16 0M10 23c5-1.3 9.5-1.2 13 0"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KlarnaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="4" width="28" height="28" rx="4" fill="currentColor" />
      <path
        d="M12 11v14M12 18h12"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PolestarMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden>
      <path
        d="M18 2 L22 14 L34 18 L22 22 L18 34 L14 22 L2 18 L14 14 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IkeaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden>
      <ellipse cx="18" cy="18" rx="16" ry="12" fill="currentColor" />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fill="#fff"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.06em"
      >
        IKEA
      </text>
    </svg>
  );
}

function ScaniaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="4" fill="currentColor" />
      <path
        d="M18 6c4 3 6 7 6 12s-2 9-6 12c-4-3-6-7-6-12s2-9 6-12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export const HERO_PARTNERS_LEFT: PartnerMark[] = [
  { id: "volvo", name: "Volvo", code: "VOLVO", Mark: VolvoMark },
  { id: "polestar", name: "Polestar", code: "POLESTAR", Mark: PolestarMark },
  { id: "klarna", name: "Klarna", code: "KLARNA", Mark: KlarnaMark },
];

export const HERO_PARTNERS_RIGHT: PartnerMark[] = [
  { id: "spotify", name: "Spotify", code: "SPOTIFY", Mark: SpotifyMark },
  { id: "ikea", name: "IKEA", code: "IKEA", Mark: IkeaMark },
  { id: "scania", name: "Scania", code: "SCANIA", Mark: ScaniaMark },
];
