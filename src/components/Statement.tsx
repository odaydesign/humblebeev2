"use client";

import { useLayoutEffect, useMemo, useRef, Fragment } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { StatementSection } from "@/lib/content";
import { HOME_SECTION, homeSectionAttrs } from "./gallery/lib/page-tones";

gsap.registerPlugin(ScrollTrigger);

/**
 * Studio statement (07-studio-statement port) — full-width closing manifesto.
 * Words rise + fade in word-by-word, scrubbed to scroll position via
 * ScrollTrigger (keyed to the paragraph, not the section). The paragraph is
 * exposed to assistive tech as ONE sentence via sr-only; the animated word
 * spans are aria-hidden. Reduced motion / no-JS leaves every word visible.
 * Editable via Studio `text` field + in-canvas overlay (data-hb-overlay).
 */
export function Statement({ section }: { section: StatementSection }) {
  const rootRef = useRef<HTMLElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  const statement = section.text;

  const words = useMemo(() => statement.split(" "), [statement]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const paragraph = pRef.current;
    if (!root) return;

    const trigger = paragraph ?? root;
    const inners = Array.from(
      root.querySelectorAll<HTMLElement>("[data-hb-statement-word]"),
    );
    if (inners.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inners,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          duration: 1,
          stagger: { each: 0.06, from: "start" },
          scrollTrigger: {
            trigger,
            start: "top 88%",
            end: "center 58%",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        },
      );
    }, root);

    // The pinned section above (Challenges) inserts its pin-spacer in a
    // passive effect — after this layout effect. Re-measure once the pin
    // geometry exists, and again when fonts/images finish settling.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    void document.fonts?.ready.then(refresh);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [words.length]);

  return (
    <section
      ref={rootRef}
      {...homeSectionAttrs(HOME_SECTION.statement)}
      className="hb-statement"
      aria-label="Studio statement"
    >
      <div className="hb-statement-inner">
        <p ref={pRef} className="hb-statement-p" data-hb-overlay="text">
          <span className="sr-only">{statement}</span>
          <span aria-hidden="true">
            {words.map((word, i) => (
              <Fragment key={`${word}-${i}`}>
                <span className="hb-statement-word">
                  <span className="hb-statement-word-inner" data-hb-statement-word>
                    {word}
                  </span>
                </span>
                {i < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
