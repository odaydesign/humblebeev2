"use client";

import * as React from "react";

import type { PartnerMark } from "./partner-marks";

const GLYPHS = "01░▒▓█#@$%<>/\\|*+=~ABCDEF";
const HEX = "0123456789ABCDEF";

type Phase = "scramble" | "lock" | "reveal" | "hold";

type AsciiBrandRevealProps = {
  partners: PartnerMark[];
  delayMs?: number;
  className?: string;
  reduceMotion?: boolean;
  align?: "left" | "right";
};

function randGlyph(pool: string) {
  return pool[(Math.random() * pool.length) | 0] ?? "0";
}

function seedCells(cols: number, rows: number, salt: number): string[] {
  return Array.from({ length: cols * rows }, (_, i) => HEX[(i * 7 + salt * 3) % HEX.length]!);
}

function buildTargetGrid(code: string, cols: number, rows: number): string[] {
  const cells = Array.from({ length: cols * rows }, () => "·");
  const text = code.slice(0, Math.max(4, cols - 4));
  const startCol = Math.max(1, Math.floor((cols - text.length) / 2));
  const row = Math.floor(rows / 2);
  for (let i = 0; i < text.length; i += 1) {
    cells[row * cols + startCol + i] = text[i] ?? "·";
  }
  // Sprinkle a few “resolved” bits around the name so the lock reads as data settling.
  for (let r = 0; r < rows; r += 1) {
    if (r === row) continue;
    cells[r * cols + startCol] = "·";
    cells[r * cols + startCol + text.length - 1] = "·";
  }
  return cells;
}

/**
 * Corner brand vignette: noisy hex/ASCII → locks a callsign → reveals SVG mark.
 */
export function AsciiBrandReveal({
  partners,
  delayMs = 0,
  className = "",
  reduceMotion = false,
  align = "left",
}: AsciiBrandRevealProps) {
  const cols = 20;
  const rows = 4;
  const salt = align === "right" ? 11 : 3;

  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>(reduceMotion ? "hold" : "scramble");
  const [cells, setCells] = React.useState(() => seedCells(cols, rows, salt));
  const [mounted, setMounted] = React.useState(false);
  const [reveal, setReveal] = React.useState(reduceMotion ? 1 : 0);

  const partner = partners[index % partners.length]!;
  const Mark = partner.Mark;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    if (reduceMotion) {
      setPhase("hold");
      setReveal(1);
      const id = window.setInterval(() => {
        setIndex((i) => (i + 1) % partners.length);
      }, 4000);
      return () => window.clearInterval(id);
    }

    let cancelled = false;
    let brandIndex = 0;
    let phaseLocal: Phase = "scramble";
    let scrambleTimer = 0;
    let lockTimer = 0;
    let revealTimer = 0;
    let holdTimer = 0;
    let scrambleTick = 0;
    let lockTick = 0;

    const clearAll = () => {
      window.clearTimeout(scrambleTimer);
      window.clearTimeout(lockTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(holdTimer);
      window.clearInterval(scrambleTick);
      window.clearInterval(lockTick);
    };

    const runScramble = () => {
      phaseLocal = "scramble";
      setPhase("scramble");
      setReveal(0);
      setCells(seedCells(cols, rows, salt + brandIndex));

      scrambleTick = window.setInterval(() => {
        if (cancelled) return;
        setCells((prev) =>
          prev.map((ch) => (Math.random() > 0.4 ? randGlyph(Math.random() > 0.5 ? HEX : GLYPHS) : ch)),
        );
      }, 48);

      scrambleTimer = window.setTimeout(() => {
        window.clearInterval(scrambleTick);
        runLock();
      }, 1200);
    };

    const runLock = () => {
      phaseLocal = "lock";
      setPhase("lock");
      const target = buildTargetGrid(partners[brandIndex % partners.length]!.code, cols, rows);
      const order = Array.from({ length: cols * rows }, (_, i) => i).sort((a, b) => {
        const ra = Math.abs(Math.floor(a / cols) - Math.floor(rows / 2));
        const rb = Math.abs(Math.floor(b / cols) - Math.floor(rows / 2));
        return ra - rb || a - b;
      });
      let frozen = 0;

      lockTick = window.setInterval(() => {
        if (cancelled) return;
        frozen = Math.min(cols * rows, frozen + 3);
        const mask = new Set(order.slice(0, frozen));
        setCells(() =>
          Array.from({ length: cols * rows }, (_, i) => {
            if (mask.has(i)) return target[i]!;
            return randGlyph(i % 2 === 0 ? HEX : GLYPHS);
          }),
        );
        if (frozen >= cols * rows) {
          window.clearInterval(lockTick);
          setCells(target);
          runReveal();
        }
      }, 55);
    };

    const runReveal = () => {
      phaseLocal = "reveal";
      setPhase("reveal");
      // Ease the logo in over ~700ms via CSS; we just flip the class.
      setReveal(1);
      revealTimer = window.setTimeout(() => {
        if (cancelled) return;
        phaseLocal = "hold";
        setPhase("hold");
        holdTimer = window.setTimeout(() => {
          if (cancelled) return;
          brandIndex = (brandIndex + 1) % partners.length;
          setIndex(brandIndex);
          runScramble();
        }, 2800);
      }, 900);
    };

    const boot = window.setTimeout(() => {
      if (!cancelled) runScramble();
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(boot);
      clearAll();
      void phaseLocal;
    };
  }, [mounted, partners, delayMs, reduceMotion, cols, rows, salt]);

  const showLogo = reveal > 0;

  return (
    <div
      className={`hb-ascii-brand ${className}`}
      data-align={align}
      data-phase={phase}
      data-reveal={showLogo ? "true" : "false"}
      aria-hidden
    >
      <div className="hb-ascii-brand-meta">
        <span>{phase === "hold" || phase === "reveal" ? "partner" : "sig://stream"}</span>
        <span className="hb-ascii-brand-code">{partner.code}</span>
      </div>

      <div className="hb-ascii-brand-stage">
        <pre
          className="hb-ascii-brand-grid"
          data-fade={showLogo ? "true" : "false"}
        >
          {Array.from({ length: rows }, (_, r) => (
            <span key={r} className="hb-ascii-brand-row">
              {cells.slice(r * cols, r * cols + cols).join("")}
              {r < rows - 1 ? "\n" : ""}
            </span>
          ))}
        </pre>

        <div className="hb-ascii-brand-logo" data-show={showLogo ? "true" : "false"}>
          <Mark className="hb-ascii-brand-svg" />
          <span className="hb-ascii-brand-name">{partner.name}</span>
        </div>
      </div>
    </div>
  );
}
