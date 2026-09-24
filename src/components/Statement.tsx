"use client";

import { useEffect, useRef } from "react";
import type { StatementSection } from "@/lib/content";

export function Statement({ section }: { section: StatementSection }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>(".word"));
    let last = -1;
    let raf = 0;

    const tick = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, (vh * 0.95 - rect.top) / (vh * 0.65 + el.offsetHeight))
      );
      if (Math.abs(progress - last) > 0.005) {
        last = progress;
        spans.forEach((span, i) => {
          span.style.color = progress > i / spans.length ? "#161616" : "#aaa";
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const words = section.text.split(" ");

  return (
    <section>
      <div className="padding-section-large">
        <div className="padding-global">
          <div className="container-large">
            <div className="statement-text">
              <h2 ref={ref} data-hb-overlay="text">
                {words.map((word, i) => (
                  <span key={i} className="word" style={{ color: "#aaa" }}>
                    {word}
                    {i < words.length - 1 ? " " : ""}
                  </span>
                ))}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
