"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HumblebeeMark } from "./humblebee-mark";
import { defaultMenu, type MenuConfig } from "@/lib/menu";

export type HeaderLink = { label: string; href: string };

export type SiteHeaderProps = {
  links?: HeaderLink[];
  /** Featured case cards — omit or pass [] to hide the cases column. */
  cases?: MenuConfig["cases"];
  footnote?: string;
  city?: string;
  cta?: { label: string; href: string };
};

type MenuTone = "light" | "dark";

function parseCssColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const val = input.trim();
  if (!val || val === "transparent") return null;

  // Prefer canvas so oklch/lab/named colors all resolve the same way.
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
  return Boolean(el.closest(".hb-menu, .hb-menu-wrap, .hb-scrim, .hb-menu-spacer"));
}

/** Sample what's behind the pill and pick a glass tone that stays readable. */
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
        // Images / videos behind the bar count as mid-dark content.
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

/**
 * Morphing pill menu: a compact frosted pill (mark · word · two-line
 * toggle) whose box grows into a panel. Glass tone tracks the backdrop so
 * ink stays readable on light and dark sections. All content is driven by
 * the `__menu` CMS doc (defaults in src/lib/menu.ts).
 */
export function SiteHeader({
  links = defaultMenu.links,
  cases = defaultMenu.cases,
  footnote = defaultMenu.footnote,
  city = defaultMenu.city,
  cta = { label: defaultMenu.ctaLabel, href: defaultMenu.ctaHref },
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [tone, setTone] = React.useState<MenuTone>("light");
  const toggle = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const markRef = React.useRef<HTMLSpanElement>(null);
  const markAngle = React.useRef(0);
  const markVel = React.useRef(0);
  const markRaf = React.useRef(0);
  const markBooted = React.useRef(false);

  React.useEffect(() => setOpen(false), [pathname]);

  // Frosted glass tone: re-sample behind the pill on scroll / resize.
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
      // Probe just under the closed bar centre so we read page content,
      // not the glass itself.
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

  // Subtle underdamped spring on the mark when the panel opens/closes.
  React.useEffect(() => {
    if (!markBooted.current) {
      markBooted.current = true;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    markVel.current += open ? 260 : -260; // deg/s

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
      if (el) {
        el.style.transform = `rotate(${markAngle.current}deg)`;
      }

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

  return (
    <>
      <div
        className="hb-scrim"
        data-open={open}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <header className="hb-menu-wrap">
        <div
          ref={menuRef}
          className="hb-menu"
          data-open={open}
          data-tone={tone}
        >
          <div className="hb-menu-bar">
            <Link
              href="/"
              className="hb-menu-mark"
              aria-label="Humblebee — home"
              onClick={() => setOpen(false)}
            >
              <span ref={markRef} className="hb-menu-symbol-wrap">
                <HumblebeeMark className="hb-menu-symbol" />
              </span>
            </Link>

            <span className="hb-menu-word" aria-hidden>
              <span className="hb-menu-wordmark" />
            </span>
            <span className="sr-only">Humblebee</span>

            <button
              ref={toggle}
              type="button"
              className="hb-menu-toggle"
              aria-expanded={open}
              aria-controls="hb-menu-panel"
              data-hive-target
              onClick={() => setOpen((v) => !v)}
            >
              <span className="hb-menu-bars" aria-hidden>
                <i />
                <i />
              </span>
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            </button>
          </div>

          <div id="hb-menu-panel" className="hb-menu-content" inert={!open}>
            <div className="hb-menu-body">
              <nav className="hb-menu-nav" aria-label="Primary">
                {links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span data-hb-f={`links.${i}.label`}>{link.label}</span>
                  </Link>
                ))}
              </nav>

              {cases.length > 0 && (
                <div className="hb-menu-cases" aria-label="Featured work">
                  {cases.map((item, i) => (
                    <Link
                      key={i}
                      className="hb-menu-case"
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      <span className="hb-menu-case-media" data-hb-img={`cases.${i}.img`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.img} alt="" loading="lazy" />
                      </span>
                      <span className="hb-menu-case-copy">
                        <span className="hb-menu-case-title" data-hb-f={`cases.${i}.title`}>
                          {item.title}
                        </span>
                        <span className="hb-menu-case-blurb" data-hb-f={`cases.${i}.blurb`}>
                          {item.blurb}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="hb-menu-foot">
              <span data-hb-f="footnote">{footnote}</span>
              <div className="hb-menu-foot-end">
                <span data-hb-f="city">{city}</span>
                <Link
                  className="hb-menu-cta"
                  href={cta.href}
                  data-hb-link="ctaHref"
                  onClick={() => setOpen(false)}
                >
                  <span data-hb-f="ctaLabel">{cta.label}</span>
                  <i aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="hb-menu-spacer" aria-hidden />
    </>
  );
}
