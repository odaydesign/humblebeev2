"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuTone = "light" | "dark";

type MenuLink = { label?: string; href?: string };

type MenuCase = {
  title?: string;
  blurb?: string;
  href?: string;
  image?: { src?: string; alt?: string };
};

/**
 * Site menu as a canvas section: a frosted pill (mark · wordmark ·
 * hamburger) whose own box grows into a full panel. Contents stay in
 * normal flow and are clipped by the travelling edges, so it reads as one
 * object changing shape rather than a card fading in over a button.
 *
 * Closed glass samples the page behind the pill (light/dark) so the ink
 * stays readable; the open panel is always solid white.
 *
 * Placement: component CSS may not use `fixed`, so the bar is an
 * absolutely-positioned overlay anchored to the top of this section, with a
 * spacer reserving the closed height. Drop it at the top of a page and it
 * behaves like a header there — it does not follow the reader down the page.
 */
export default function MorphMenuSection({ section }: { section: any }) {
  const pathname = usePathname();
  const links: MenuLink[] = Array.isArray(section?.links) ? section.links : [];
  const cases: MenuCase[] = Array.isArray(section?.cases) ? section.cases : [];
  const cta = section?.cta ?? { label: "Start a project", href: "/contact" };

  const markSrc = section?.markImage?.src || "/uploads/symbol.png";
  const wordmarkSrc = section?.wordmarkImage?.src || "/uploads/wordmark.png";

  const [open, setOpen] = React.useState(false);
  const [tone, setTone] = React.useState<MenuTone>("light");
  const toggle = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLSpanElement>(null);
  const markAngle = React.useRef(0);
  const markVel = React.useRef(0);
  const markRaf = React.useRef(0);
  const markBooted = React.useRef(false);

  /* Route change always closes the panel. */
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Glass tone sampling — keep ink readable on light and dark sections. */
  React.useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const forced = document.documentElement.dataset.menuToneOverride;
      if (forced === "light" || forced === "dark") {
        setTone(forced);
        return;
      }
      const menu = menuRef.current;
      if (!menu) return;
      const rect = menu.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = Math.min(window.innerHeight - 2, rect.top + Math.min(rect.height, 60) + 8);
      const next = sampleMenuTone(x, y);
      setTone((prev) => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hb-menu-tone-override", schedule);
    const ro = new ResizeObserver(schedule);
    if (menuRef.current) ro.observe(menuRef.current);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hb-menu-tone-override", schedule);
      ro.disconnect();
    };
  }, [pathname, open]);

  /* Mark spring — an impulse on open/close, underdamped settle. */
  React.useEffect(() => {
    if (!markBooted.current) {
      markBooted.current = true;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    markVel.current += open ? 260 : -260;

    cancelAnimationFrame(markRaf.current);
    let last = performance.now();
    const stiffness = 190;
    const damping = 13;

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const accel = -stiffness * markAngle.current - damping * markVel.current;
      markVel.current += accel * dt;
      markAngle.current += markVel.current * dt;

      const el = markRef.current;
      if (el) el.style.transform = `rotate(${markAngle.current}deg)`;

      if (Math.abs(markAngle.current) > 0.05 || Math.abs(markVel.current) > 0.5) {
        markRaf.current = requestAnimationFrame(step);
      } else {
        markAngle.current = 0;
        markVel.current = 0;
        if (el) el.style.transform = "";
      }
    };

    markRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(markRaf.current);
  }, [open]);

  /* Escape closes and returns focus to the toggle. */
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Scroll lock while open, compensating for the scrollbar gap. */
  React.useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <section className="morph-menu-section">
      <div className="morph-menu-scrim" data-open={open} onClick={close} aria-hidden />

      <header className="morph-menu-wrap">
        <div ref={menuRef} className="morph-menu-pill" data-open={open} data-tone={tone}>
          <div className="morph-menu-bar">
            <Link
              href="/"
              className="morph-menu-mark"
              aria-label="Humblebee Studio — home"
              onClick={close}
            >
              <span ref={markRef} className="morph-menu-symbol-wrap">
                <span
                  className="morph-menu-symbol"
                  data-hb-img="markImage"
                  style={
                    {
                      "--morph-menu-mark-mask": `url("${markSrc}")`,
                    } as React.CSSProperties
                  }
                />
              </span>
            </Link>

            <span className="morph-menu-word" aria-hidden>
              <span
                className="morph-menu-wordmark"
                data-hb-img="wordmarkImage"
                style={
                  {
                    "--morph-menu-word-mask": `url("${wordmarkSrc}")`,
                  } as React.CSSProperties
                }
              />
            </span>
            <span className="morph-menu-sr">Humblebee</span>

            <button
              ref={toggle}
              type="button"
              className="morph-menu-toggle"
              aria-expanded={open}
              aria-controls="morph-menu-panel"
              data-hive-target
              onClick={() => setOpen((v) => !v)}
            >
              <span className="morph-menu-bars" aria-hidden>
                <i />
                <i />
              </span>
              <span className="morph-menu-sr">{open ? "Close menu" : "Open menu"}</span>
            </button>
          </div>

          <div id="morph-menu-panel" className="morph-menu-content" inert={!open}>
            <div className="morph-menu-main">
              <nav className="morph-menu-nav" aria-label="Primary">
                {links.map((link, i) => (
                  <Link
                    key={`${link.href}-${i}`}
                    href={link.href || "/"}
                    data-hb-link={`links.${i}.href`}
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={close}
                  >
                    <span data-hb-f={`links.${i}.label`}>{link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="morph-menu-cases" role="group" aria-label="Featured work">
                {cases.map((item, i) => (
                  <Link
                    key={`${item.href}-${i}`}
                    className="morph-menu-case"
                    href={item.href || "/work"}
                    data-hb-link={`cases.${i}.href`}
                    onClick={close}
                  >
                    <span className="morph-menu-case-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image?.src}
                        alt=""
                        data-hb-img={`cases.${i}.image`}
                        loading="lazy"
                      />
                    </span>
                    <span className="morph-menu-case-copy">
                      <span className="morph-menu-case-title" data-hb-f={`cases.${i}.title`}>
                        {item.title}
                      </span>
                      <span className="morph-menu-case-blurb" data-hb-f={`cases.${i}.blurb`}>
                        {item.blurb}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="morph-menu-foot">
              <span data-hb-f="studioLine">{section?.studioLine}</span>
              <div className="morph-menu-foot-end">
                <span data-hb-f="location">{section?.location}</span>
                <Link
                  className="morph-menu-cta"
                  href={cta?.href || "/contact"}
                  data-hb-link="cta.href"
                  onClick={close}
                >
                  <span data-hb-f="cta.label">{cta?.label}</span>
                  <i aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Reserves the closed-bar height so page content never sits under it. */}
      <div className="morph-menu-spacer" aria-hidden />
    </section>
  );
}

function parseCssColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const val = (input || "").trim();
  if (!val || val === "transparent") return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = val;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return null;
    return { r, g, b, a: a / 255 };
  } catch {
    return null;
  }
}

function relativeLuminance(r: number, g: number, b: number) {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function isMenuChrome(el: Element) {
  return Boolean(
    el.closest(".morph-menu-pill, .morph-menu-wrap, .morph-menu-scrim, .morph-menu-spacer")
  );
}

/** Sample what sits behind the pill and pick a glass tone that stays readable. */
function sampleMenuTone(clientX: number, clientY: number): MenuTone {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!(el instanceof HTMLElement) || isMenuChrome(el)) continue;

    let node: HTMLElement | null = el;
    while (node && node !== document.documentElement) {
      if (isMenuChrome(node)) {
        node = node.parentElement;
        continue;
      }
      const style = getComputedStyle(node);
      const color = parseCssColor(style.backgroundColor);
      if (color && color.a >= 0.35) {
        if (node.tagName === "IMG" || node.tagName === "VIDEO" || node.tagName === "CANVAS") {
          return "dark";
        }
        return relativeLuminance(color.r, color.g, color.b) < 0.45 ? "dark" : "light";
      }
      node = node.parentElement;
    }
  }

  const body = parseCssColor(getComputedStyle(document.body).backgroundColor);
  if (body && body.a >= 0.35) {
    return relativeLuminance(body.r, body.g, body.b) < 0.45 ? "dark" : "light";
  }
  return "light";
}
