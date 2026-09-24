"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ChallengesSection } from "@/lib/content";

const TILTS = [-5, 4, -3, 5, -4, 3, -6, 4, -5, 3];
const STACK_ANGLES = [2, -4, 3.5, -2.5, 4, -1.5, 2.5, -3, 4.5, -2];

export function Challenges({ section }: { section: ChallengesSection }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    const stage = stageRef.current;
    const title = titleRef.current;
    if (!root || !stage || !title) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const ctx = gsap.context(() => {
      const pills = Array.from(
        root.querySelectorAll<HTMLElement>(".challenge-pill")
      );

      /* ── Mobile: rotating card deck ── */
      if (window.innerWidth < 768) {
        ScrollTrigger.config({ ignoreMobileResize: true });
        const cards = Array.from(
          root.querySelectorAll<HTMLElement>(".challenge-stack-card")
        );
        if (!cards.length) return;

        gsap.set(title, { opacity: 0, y: 16 });
        gsap.set(cards, { opacity: 0 });
        cards.forEach((card, i) => {
          gsap.set(card, {
            y: i * 10,
            scale: 1 - i * 0.048,
            rotation: STACK_ANGLES[i % STACK_ANGLES.length],
            zIndex: cards.length - i,
          });
        });

        let busy = false;
        const advance = () => {
          if (busy) return;
          busy = true;
          const top = cards[0];
          gsap.to(top, {
            x: "-145%",
            rotation: -22,
            opacity: 0,
            duration: 0.42,
            ease: "power2.in",
            onComplete: () => {
              cards.push(cards.shift()!);
              gsap.set(top, {
                x: 0,
                y: cards.length * 10,
                scale: 0.82,
                rotation: 3,
                opacity: 0,
                zIndex: 0,
              });
              cards.forEach((card, i) => {
                gsap.to(card, {
                  y: i * 10,
                  scale: 1 - i * 0.048,
                  rotation: STACK_ANGLES[i % STACK_ANGLES.length],
                  opacity: i === 0 ? 1 : i === 1 ? 0.75 : i === 2 ? 0.45 : 0,
                  zIndex: cards.length - i,
                  duration: 0.38,
                  ease: "power2.out",
                });
              });
              gsap.delayedCall(0.4, () => {
                busy = false;
              });
            },
          });
        };

        const introTl = gsap.timeline({
          scrollTrigger: { trigger: stage, start: "top 70%" },
          onComplete: () => {
            interval = setInterval(advance, 2800);
          },
        });
        introTl.to(title, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" });
        introTl.to(cards[2], { opacity: 0.45, duration: 0.4, ease: "power2.out" }, "-=0.1");
        introTl.to(cards[1], { opacity: 0.75, duration: 0.4, ease: "power2.out" }, "-=0.25");
        introTl.to(cards[0], { opacity: 1, duration: 0.6, ease: "back.out(1.3)" }, "-=0.25");
        return;
      }

      /* ── Desktop: pinned scroll sequence ── */
      pills.forEach((el, i) => {
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          rotation: TILTS[i % TILTS.length],
          opacity: 0,
          scale: 0.8,
        });
      });
      gsap.set(title, { opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=" + (300 + pills.length * 600),
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
        },
      });
      tl.to({}, { duration: 0.4 });
      tl.to(title, { opacity: 0.18, scale: 0.92, duration: 1, ease: "power1.out" }, ">");
      pills.forEach((el, i) => {
        const tilt = TILTS[i % TILTS.length];
        tl.fromTo(
          el,
          { opacity: 0, scale: 0.8, y: 70, rotation: tilt - 6 },
          { opacity: 1, scale: 1, y: 0, rotation: tilt, duration: 1.6, ease: "back.out(1.4)" },
          i === 0 ? ">-0.4" : ">+0.4"
        );
        tl.to({}, { duration: 1.1 });
      });
      tl.to({}, { duration: 0.5 });
      ScrollTrigger.refresh();
    }, root);

    return () => {
      ctx.revert();
      if (interval) clearInterval(interval);
    };
  }, [section]);

  return (
    <section ref={rootRef} className="challenges">
      <div ref={stageRef} className="challenges-stage">
        <div ref={titleRef} className="challenges-title" data-hb-f="title">
          {section.title}
        </div>
        {section.pills.map((pill, i) => (
          <div key={pill.text} className={`challenge-pill ${pill.color}`}>
            <span data-hb-f={`pills.${i}.text`}>{pill.text}</span>
          </div>
        ))}
        <div ref={stackRef} className="challenge-stack">
          {section.pills.map((pill, i) => (
            <div
              key={pill.text}
              className={`challenge-stack-card ${pill.color}`}
              data-hb-f={`pills.${i}.text`}
            >
              {pill.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
