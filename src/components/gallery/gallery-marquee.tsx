"use client";

import * as React from "react";

import {
  AsciiCard,
  CliCard,
  InvadersCard,
  PortfolioCard,
} from "./effects/gallery-live-cards";
import { PongCard } from "./effects/pong-card";
import { StudioPanelCard } from "./effects/studio-panel-card";
import { VinylPlayerCard } from "./effects/vinyl-player-card";
import { WireframeLayoutCard } from "./effects/wireframe-layout-card";
import { BrandsLoopCard } from "./effects/brands-loop-card";
import { HOME_SECTION, homeSectionAttrs } from "./lib/page-tones";
import { cn } from "./lib/utils";

/** Aspect-led formats — larger footprints, mixed rhythm in the strip. */
type CardFormat = "portrait" | "tall" | "square" | "landscape" | "wide";
type CardOffset = "up" | "mid" | "down";

type BaseItem = {
  id: string;
  title?: string;
  blurb?: string;
  /** @deprecated use format */
  size?: CardFormat;
  format?: CardFormat;
  offset?: CardOffset;
};

export type GalleryMarqueeItem =
  | (BaseItem & {
      kind?: "image";
      src: string;
      alt?: string;
    })
  | (BaseItem & {
      kind: "video";
      src: string;
      webm?: string;
      alt?: string;
    })
  | (BaseItem & {
      kind: "cli";
    })
  | (BaseItem & {
      kind: "ascii";
    })
  | (BaseItem & {
      kind: "game";
    })
  | (BaseItem & {
      kind: "pong";
    })
  | (BaseItem & {
      kind: "portfolio";
      meta?: string;
      tags?: string[];
    })
  | (BaseItem & {
      kind: "studio";
    })
  | (BaseItem & {
      kind: "vinyl";
    })
  | (BaseItem & {
      kind: "wireframe";
    })
  | (BaseItem & {
      kind: "brands";
      /** Client names for the reel — falls back to the built-in list. */
      clients?: string[];
    });

export type GalleryMarqueeProps = {
  items: GalleryMarqueeItem[];
  className?: string;
  /** Auto-scroll cruise speed in px/s */
  speed?: number;
};

/**
 * Size system (width-driven + aspect-ratio):
 * - portrait  3:4   — editorial photos, case cards
 * - tall      2:3   — arcade / terminal play surfaces
 * - square    1:1   — ascii / compact live tiles
 * - landscape 4:3   — workshop / product stills
 * - wide      16:9  — cinematic scenes
 */
const FORMAT: Record<CardFormat, string> = {
  portrait:
    "aspect-[3/4] h-auto w-[clamp(16rem,32vw,23rem)]",
  tall:
    "aspect-[2/3] h-auto w-[clamp(15rem,30vw,21rem)]",
  square:
    "aspect-square h-auto w-[clamp(17rem,34vw,25rem)]",
  landscape:
    "aspect-[4/3] h-auto w-[clamp(22rem,44vw,34rem)]",
  wide:
    "aspect-[16/9] h-auto w-[clamp(24rem,50vw,38rem)]",
};

const OFFSET: Record<CardOffset, string> = {
  up: "-translate-y-6 md:-translate-y-10",
  mid: "translate-y-0",
  down: "translate-y-6 md:translate-y-10",
};

function isPlayableKind(kind: string) {
  return (
    kind === "game" ||
    kind === "pong" ||
    kind === "vinyl" ||
    kind === "wireframe" ||
    kind === "brands"
  );
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

function itemKind(item: GalleryMarqueeItem) {
  return item.kind ?? "image";
}

/** Hover-to-play — pauses + resets the instant hover ends (guards play() race). */
function GalleryVideoCard({
  src,
  webm,
  alt,
  active,
}: {
  src: string;
  webm?: string;
  alt?: string;
  active: boolean;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const activeRef = React.useRef(active);
  activeRef.current = active;

  const stop = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {
      /* seek before metadata */
    }
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!active) {
      stop();
      return;
    }

    let cancelled = false;
    const run = el.play();
    if (run && typeof run.then === "function") {
      void run
        .then(() => {
          // Hover may have ended while play() was pending — force stop.
          if (cancelled || !activeRef.current) stop();
        })
        .catch(() => {
          /* autoplay blocked */
        });
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, stop]);

  return (
    <video
      ref={ref}
      className="size-full object-cover"
      muted
      playsInline
      preload="auto"
      aria-label={alt || "Video"}
      draggable={false}
    >
      {webm ? <source src={webm} type="video/webm" /> : null}
      <source src={src} type="video/mp4" />
    </video>
  );
}

function itemCaption(item: GalleryMarqueeItem) {
  const title = item.title?.trim();
  const blurb = item.blurb?.trim();
  if (!title && !blurb) return null;
  return {
    title: title || null,
    blurb:
      blurb ||
      "A Humblebee build — design and engineering in the same room.",
  };
}

/**
 * Mixed-content strip: photos + video + live CLI / ASCII / arcade / portfolio cards.
 * Hover → caption slides out from under the card; hover game/pong/vinyl/wireframe → strip stops to play.
 * Video cards play while hovered, then hard-stop + reset on leave.
 */
export function GalleryMarquee({
  items,
  className,
  speed = 38,
}: GalleryMarqueeProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const speedTargetRef = React.useRef(speed);
  const focusLoopRef = React.useRef<number | null>(null);
  const cruiseSpeedRef = React.useRef(speed);
  /** Pixel offset along the track — driven by transform, not scrollLeft (Safari). */
  const offsetRef = React.useRef(0);

  const loop = React.useMemo(() => [...items, ...items], [items]);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [focusLoop, setFocusLoop] = React.useState<number | null>(null);

  const setPlayFocus = React.useCallback((loopIndex: number | null) => {
    focusLoopRef.current = loopIndex;
    setFocusLoop(loopIndex);
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const prefersReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cruise = prefersReduce ? 0 : speed;
    cruiseSpeedRef.current = cruise;
    // Don't override a playable-card pause if the effect re-runs mid-hover.
    if (focusLoopRef.current === null) {
      speedTargetRef.current = cruise;
    }

    let vel = 0;
    let target = focusLoopRef.current === null ? cruise : 0;
    let from = 0;
    let transStart = performance.now();
    let transDur = 1.0;

    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let dragSamples: { v: number; t: number }[] = [];
    /** Half of the duplicated strip — one full set of items including trailing gap. */
    let halfWidth = 0;

    const measureHalf = () => {
      const kids = track.children;
      const n = items.length;
      if (n <= 0 || kids.length < n * 2) {
        halfWidth = track.scrollWidth > 0 ? track.scrollWidth / 2 : 0;
        return;
      }
      // Distance from start of first copy to start of second — includes flex gap.
      const first = kids[0] as HTMLElement;
      const second = kids[n] as HTMLElement;
      halfWidth = Math.max(0, second.offsetLeft - first.offsetLeft);
      if (halfWidth <= 0) {
        halfWidth = track.scrollWidth > 0 ? track.scrollWidth / 2 : 0;
      }
    };

    const wrapOffset = (value: number) => {
      if (halfWidth <= 0) return value;
      let next = value;
      // Keep offset in [0, half) for seamless looping of the duplicated strip.
      while (next >= halfWidth) next -= halfWidth;
      while (next < 0) next += halfWidth;
      return next;
    };

    const applyTransform = () => {
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    };

    const glideTo = (next: number, durationSec: number) => {
      from = vel;
      target = next;
      transStart = performance.now();
      transDur = Math.max(0.01, durationSec);
    };

    const onPointerDown = (e: PointerEvent) => {
      // Playable / live cards own their pointer events — never start a drag.
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-playable], [data-live-card]")) {
        return;
      }
      if (e.pointerType !== "mouse" || e.button !== 0) {
        vel = 0;
        target = 0;
        return;
      }
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      dragSamples = [];
      vel = 0;
      target = 0;
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add("is-dragging");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(1, now - lastT);
      offsetRef.current = wrapOffset(offsetRef.current - dx);
      applyTransform();
      const instant = (-dx / dt) * 1000;
      dragSamples.push({ v: instant, t: now });
      if (dragSamples.length > 6) dragSamples.shift();
      lastX = e.clientX;
      lastT = now;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        if (!prefersReduce) glideTo(speedTargetRef.current, 0.9);
        return;
      }
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");

      const now = performance.now();
      const recent = dragSamples.filter((s) => now - s.t < 120);
      const throwVel =
        recent.length > 0
          ? recent.reduce((a, s) => a + s.v, 0) / recent.length
          : 0;
      const flung = Math.max(-900, Math.min(900, throwVel));
      vel = flung;
      from = flung;
      target = speedTargetRef.current;
      transStart = performance.now();
      transDur = Math.min(1.6, 0.55 + Math.abs(flung) / 1200);
      dragSamples = [];
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    viewport.addEventListener("lostpointercapture", onPointerUp);

    measureHalf();
    applyTransform();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const prev = halfWidth;
            measureHalf();
            if (halfWidth > 0 && prev > 0) {
              offsetRef.current = wrapOffset(offsetRef.current);
              applyTransform();
            }
          })
        : null;
    ro?.observe(track);

    let raf = 0;
    let last = performance.now();
    let lastDesired = cruise;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (halfWidth <= 0) measureHalf();

      const desired = speedTargetRef.current;
      if (desired !== lastDesired && !dragging) {
        lastDesired = desired;
        glideTo(desired, desired < cruise ? 0.55 : 0.85);
      }

      if (!dragging) {
        const elapsed = (now - transStart) / (transDur * 1000);
        const t = Math.min(1, Math.max(0, elapsed));
        vel = from + (target - from) * smoothstep(t);
        if (Math.abs(vel) > 0.01) {
          offsetRef.current = wrapOffset(offsetRef.current + vel * dt);
          applyTransform();
        }
      }

      raf = requestAnimationFrame(tick);
    };

    if (!prefersReduce) glideTo(cruise, 1.1);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      viewport.removeEventListener("lostpointercapture", onPointerUp);
    };
  }, [items.length, speed]);

  const renderBody = (item: GalleryMarqueeItem, loopIndex: number) => {
    const live = focusLoop === loopIndex || hovered === loopIndex;
    if (item.kind === "cli") {
      return <CliCard active={live} />;
    }
    if (item.kind === "ascii") {
      return <AsciiCard active={live} />;
    }
    if (item.kind === "game") {
      return <InvadersCard focused={focusLoop === loopIndex} />;
    }
    if (item.kind === "pong") {
      return <PongCard focused={focusLoop === loopIndex} />;
    }
    if (item.kind === "portfolio") {
      return (
        <PortfolioCard title={item.title} meta={item.meta} tags={item.tags} />
      );
    }
    if (item.kind === "studio") {
      return <StudioPanelCard active={live} />;
    }
    if (item.kind === "vinyl") {
      return <VinylPlayerCard focused={focusLoop === loopIndex} />;
    }
    if (item.kind === "wireframe") {
      return <WireframeLayoutCard focused={focusLoop === loopIndex} />;
    }
    if (item.kind === "brands") {
      return (
        <BrandsLoopCard
          focused={focusLoop === loopIndex}
          names={item.clients}
        />
      );
    }
    if (item.kind === "video") {
      return (
        <GalleryVideoCard
          src={item.src}
          webm={item.webm}
          alt={item.alt ?? item.title}
          active={hovered === loopIndex}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.src}
        alt={item.alt ?? item.title ?? ""}
        draggable={false}
        loading="lazy"
        className="size-full object-cover"
      />
    );
  };

  return (
    <section
      {...homeSectionAttrs(HOME_SECTION.gallery)}
      className={cn("hb-gallery-marquee relative py-24 md:py-28", className)}
      aria-label="Selected work"
    >
      <div
        ref={viewportRef}
        className="hb-gallery-marquee-viewport cursor-grab px-6 active:cursor-grabbing md:px-10 lg:px-14"
      >
        <div
          ref={trackRef}
          className="hb-gallery-marquee-track flex items-center gap-8 will-change-transform md:gap-11 lg:gap-14"
        >
        {loop.map((item, i) => {
          const format = item.format ?? item.size ?? "square";
          const offset = item.offset ?? "mid";
          const kind = itemKind(item);
          const caption = itemCaption(item);
          const isHovered = hovered === i;
          const isLive = kind !== "image" && kind !== "video";
          const isPlayable = isPlayableKind(kind);
          return (
            <figure
              key={`${item.id}-${i}`}
              data-active={isHovered ? "true" : "false"}
              data-hovered={isHovered ? "true" : "false"}
              data-kind={kind}
              data-format={format}
              data-offset={offset}
              data-live-card={isLive ? "true" : undefined}
              data-playable={isPlayable ? "true" : undefined}
              className={cn(
                "hb-gallery-marquee-card relative shrink-0 select-none",
                OFFSET[offset],
              )}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                setHovered(i);
                if (isLive) {
                  setPlayFocus(i);
                  // Only playable arcade cards stop the strip; others keep cruising.
                  if (isPlayable) {
                    speedTargetRef.current = 0;
                  }
                }
              }}
              onPointerLeave={() => {
                setHovered((h) => (h === i ? null : h));
                if (focusLoopRef.current === i) {
                  setPlayFocus(null);
                  if (isPlayable) {
                    speedTargetRef.current = cruiseSpeedRef.current;
                  }
                }
              }}
            >
              <div
                className={cn(
                  "hb-gallery-marquee-card-face relative z-[1] overflow-hidden rounded-[1.35rem] bg-muted md:rounded-[1.75rem]",
                  FORMAT[format],
                )}
              >
                {renderBody(item, i)}
              </div>
              {caption ? (
                <figcaption
                  className="hb-gallery-caption"
                  aria-hidden={!isHovered}
                >
                  {caption.title ? (
                    <p className="hb-gallery-caption-title">{caption.title}</p>
                  ) : null}
                  <p className="hb-gallery-caption-body">{caption.blurb}</p>
                </figcaption>
              ) : null}
            </figure>
          );
        })}
        </div>
      </div>
    </section>
  );
}

/** Mixed content — real case photos + live interactive tiles. */
export const HOME_GALLERY_ITEMS: GalleryMarqueeItem[] = [
  {
    id: "welding-ui",
    kind: "image",
    src: "/gallery/welding-ui.png",
    title: "Weld control",
    blurb: "Industrial UI with machine-grade clarity — jobs, current, and feed at a glance.",
    format: "square",
    offset: "up",
  },
  {
    id: "wave",
    kind: "video",
    src: "/video/wave.mp4",
    webm: "/video/wave.webm",
    title: "Hello from the hive",
    blurb: "Hover to animate — a small wave from the studio.",
    format: "square",
    offset: "mid",
  },
  {
    id: "cli",
    kind: "cli",
    title: "Studio CLI",
    blurb: "A terminal that ships taste — scaffolding, agents, and status in one calm stream.",
    format: "tall",
    offset: "down",
  },
  {
    id: "polestar-interior",
    kind: "image",
    src: "/gallery/polestar-interior.png",
    title: "Polestar interior",
    blurb: "Configurator as product — interior exploration on a calm, focused canvas.",
    format: "wide",
    offset: "mid",
  },
  {
    id: "ascii",
    kind: "ascii",
    title: "Signal field",
    blurb: "ASCII as material — watching form emerge from noise before the UI hardens.",
    format: "square",
    offset: "up",
  },
  {
    id: "brands",
    kind: "brands",
    title: "Through time",
    blurb:
      "Hover to pause the strip, then drag or scroll the name reel — brands we've built with through time.",
    format: "portrait",
    offset: "mid",
  },
  {
    id: "workshop-board",
    kind: "image",
    src: "/gallery/workshop-board.png",
    title: "Workshop board",
    blurb: "Strings, stickies, and narrative — shaping the product in the room together.",
    format: "square",
    offset: "down",
  },
  {
    id: "studio",
    kind: "studio",
    title: "Studio instrument",
    blurb: "Gothenburg HQ on the clock — local time, weather, and a few engineered datapoints.",
    format: "square",
    offset: "down",
  },
  {
    id: "wireframe",
    kind: "wireframe",
    title: "Layout board",
    blurb:
      "Hover to pause, drag wireframe blocks, hit the dice for a new page layout. UX first.",
    format: "landscape",
    offset: "mid",
  },
  {
    id: "polestar-space-warp",
    kind: "image",
    src: "/gallery/polestar-space-warp.png",
    title: "Space Warp",
    blurb: "Playable moments in the car — entertainment that feels native to the cockpit.",
    format: "wide",
    offset: "up",
  },
  {
    id: "vinyl",
    kind: "vinyl",
    title: "Turntable",
    blurb: "Hover to pause the strip, then click the deck — tonearm drops, platter spins, soft loop plays. Leave the card and it cues back up.",
    format: "square",
    offset: "mid",
  },
  {
    id: "design-review",
    kind: "image",
    src: "/gallery/design-review.png",
    title: "Design review",
    blurb: "Wireframes on the wall — pointing at the before so the after can get sharper.",
    format: "square",
    offset: "mid",
  },
  {
    id: "game",
    kind: "game",
    title: "Playable pause",
    blurb: "Hover to pause the strip, then play — mouse or ← → and space.",
    format: "tall",
    offset: "down",
  },
  {
    id: "polestar-order",
    kind: "image",
    src: "/gallery/polestar-order.png",
    title: "Order flow",
    blurb: "Step by step to a Polestar 2 — quiet progress, clear decisions.",
    format: "square",
    offset: "up",
  },
  {
    id: "pong",
    kind: "pong",
    title: "Pong link",
    blurb: "Hover to pause, then play with mouse or ↑↓. Find another visitor online — or keep a calm match vs CPU.",
    format: "portrait",
    offset: "mid",
  },
  {
    id: "justr",
    kind: "image",
    src: "/gallery/justr-app.png",
    title: "Justr.",
    blurb: "Heavy machinery, light interface — results you can share from the field.",
    format: "square",
    offset: "down",
  },
  {
    id: "studio-portrait",
    kind: "image",
    src: "/gallery/studio-portrait.png",
    title: "Studio people",
    blurb: "The hive behind the work — craft, curiosity, and a good hat.",
    format: "square",
    offset: "mid",
  },
  {
    id: "portfolio",
    kind: "portfolio",
    title: "Intelligent checkout",
    meta: "2025 · Fintech",
    tags: ["AI", "UX", "Build"],
    blurb: "A case study card in the flow — quiet type, clear tags, no noise.",
    format: "square",
    offset: "up",
  },
  {
    id: "returns",
    kind: "image",
    src: "/gallery/returns-dashboard.png",
    title: "Manage returns",
    blurb: "Desktop clarity for messy logistics — returns that feel intentional.",
    format: "square",
    offset: "down",
  },
  {
    id: "swarm",
    kind: "image",
    src: "/gallery/swarm-hero.png",
    title: "Swarm",
    blurb: "A hero that sells the offer — exclusive gigs, sharp signal, no noise.",
    format: "square",
    offset: "up",
  },
  {
    id: "smart-home",
    kind: "image",
    src: "/gallery/smart-home.png",
    title: "Living room",
    blurb: "Climate control with soft glass and warm light — comfort you can feel.",
    format: "square",
    offset: "mid",
  },
  {
    id: "ace-studio",
    kind: "image",
    src: "/gallery/ace-studio.png",
    title: "AI Agent Canvas",
    blurb: "From canvas to conversation — framing agents where the team can see them.",
    format: "landscape",
    offset: "down",
  },
];
