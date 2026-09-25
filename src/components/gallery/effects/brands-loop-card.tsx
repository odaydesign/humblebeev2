"use client";

import * as React from "react";

import { marqueeItems } from "../lib/brands-data";
import { cn } from "../lib/utils";

type BrandRow = { name: string };

const AUTO_PX_PER_SEC = 28;

/**
 * Continuous vertical brand-name scroll — drag or wheel to scrub the reel.
 * `names` overrides the built-in client list (CMS-editable).
 */
export function BrandsLoopCard({
  focused,
  names,
}: {
  focused?: boolean;
  names?: string[];
}) {
  const rows = React.useMemo<BrandRow[]>(
    () => (names?.length ? names : marqueeItems).map((name) => ({ name })),
    [names],
  );
  const loop = React.useMemo(() => [...rows, ...rows], [rows]);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(0);
  const halfRef = React.useRef(0);
  const dragRef = React.useRef<{ y: number; origin: number } | null>(null);
  const resumeAtRef = React.useRef(0);
  const reduceRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);

  const applyOffset = React.useCallback((raw: number) => {
    const half = halfRef.current;
    let next = raw;
    if (half > 0) {
      next = ((next % half) + half) % half;
    }
    offsetRef.current = next;
    const el = trackRef.current;
    if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
  }, []);

  const measure = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    halfRef.current = track.scrollHeight / 2;
    applyOffset(offsetRef.current);
  }, [applyOffset]);

  React.useEffect(() => {
    reduceRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Auto-scroll — pauses while dragging / shortly after wheel, or when reduced motion.
  React.useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canAuto =
        !reduceRef.current &&
        !dragRef.current &&
        now >= resumeAtRef.current;
      if (canAuto) {
        applyOffset(offsetRef.current + AUTO_PX_PER_SEC * dt);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [applyOffset]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !focused) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      applyOffset(offsetRef.current + e.deltaY);
      resumeAtRef.current = performance.now() + 900;
    };

    root.addEventListener("wheel", onWheelNative, { passive: false });
    return () => root.removeEventListener("wheel", onWheelNative);
  }, [focused, applyOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!focused) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { y: e.clientY, origin: offsetRef.current };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.stopPropagation();
    e.preventDefault();
    const dy = e.clientY - drag.y;
    applyOffset(drag.origin - dy);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDragging(false);
    resumeAtRef.current = performance.now() + 900;
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "hb-brands-loop relative flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#ececec] text-ink",
        focused ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-pointer",
      )}
      role="region"
      aria-label={`Brands we've worked with. ${focused ? "Drag or scroll to browse." : "Hover to interact."} ${rows.map((b) => b.name).join(", ")}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        ref={trackRef}
        className="hb-brands-loop-track absolute inset-x-0 top-0 flex flex-col justify-start will-change-transform pt-3"
        aria-hidden
      >
        {loop.map((row, i) => (
          <div
            key={`${row.name}-${i}`}
            className="hb-brands-loop-row px-4 text-left leading-[0.95]"
          >
            <span className="font-sans text-[clamp(1.35rem,5.2vw,2.05rem)] font-semibold tracking-[-0.04em] text-ink">
              {row.name}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-10 bg-gradient-to-b from-[#ececec] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-t from-[#ececec] to-transparent" />
    </div>
  );
}
