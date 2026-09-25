"use client";

import * as React from "react";

import { cn } from "../lib/utils";

type BlockKind =
  | "nav"
  | "hero"
  | "heading"
  | "text"
  | "image"
  | "cards"
  | "cta"
  | "form"
  | "sidebar"
  | "footer"
  | "search"
  | "avatar";

type Block = {
  id: string;
  kind: BlockKind;
  /** percent of artboard */
  x: number;
  y: number;
  w: number;
  h: number;
};

const YELLOW = "#f7e731";
const GRID = 2; // % snap
const M = 6; // page margin
const G = 2; // gutter between blocks
const COL = (100 - M * 2 - G) / 2; // half width with gutter
const FULL = 100 - M * 2;

const LABELS: Record<BlockKind, string> = {
  nav: "Nav",
  hero: "Hero",
  heading: "Heading",
  text: "Text",
  image: "Image",
  cards: "Cards",
  cta: "Button",
  form: "Form",
  sidebar: "Sidebar",
  footer: "Footer",
  search: "Search",
  avatar: "Avatar",
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

/**
 * Non-overlapping webpage presets — stacked / columns with consistent gutters.
 * No nested overlays (hero is one block; heading/cta are siblings in flow).
 */
const PRESETS: Block[][] = [
  // Landing
  [
    { id: "nav", kind: "nav", x: M, y: 4, w: FULL, h: 6 },
    { id: "hero", kind: "hero", x: M, y: 12, w: FULL, h: 24 },
    { id: "cards", kind: "cards", x: M, y: 40, w: FULL, h: 22 },
    { id: "text", kind: "text", x: M, y: 66, w: FULL, h: 12 },
    { id: "footer", kind: "footer", x: M, y: 84, w: FULL, h: 8 },
  ],
  // Blog
  [
    { id: "nav", kind: "nav", x: M, y: 4, w: FULL, h: 6 },
    { id: "heading", kind: "heading", x: M, y: 14, w: COL * 1.35, h: 6 },
    { id: "text", kind: "text", x: M, y: 24, w: COL * 1.35, h: 40 },
    {
      id: "sidebar",
      kind: "sidebar",
      x: M + COL * 1.35 + G,
      y: 24,
      w: FULL - COL * 1.35 - G,
      h: 40,
    },
    { id: "image", kind: "image", x: M, y: 68, w: COL * 1.35, h: 12 },
    { id: "footer", kind: "footer", x: M, y: 86, w: FULL, h: 6 },
  ],
  // Product
  [
    { id: "nav", kind: "nav", x: M, y: 4, w: FULL, h: 6 },
    { id: "image", kind: "image", x: M, y: 14, w: COL, h: 52 },
    { id: "heading", kind: "heading", x: M + COL + G, y: 14, w: COL, h: 7 },
    { id: "text", kind: "text", x: M + COL + G, y: 24, w: COL, h: 16 },
    { id: "cta", kind: "cta", x: M + COL + G, y: 44, w: 28, h: 7 },
    { id: "form", kind: "form", x: M + COL + G, y: 54, w: COL, h: 12 },
    { id: "footer", kind: "footer", x: M, y: 72, w: FULL, h: 7 },
    { id: "cards", kind: "cards", x: M, y: 82, w: FULL, h: 12 },
  ],
  // Dashboard
  [
    { id: "nav", kind: "nav", x: M, y: 3, w: FULL, h: 6 },
    { id: "sidebar", kind: "sidebar", x: M, y: 12, w: 18, h: 66 },
    { id: "search", kind: "search", x: 26, y: 12, w: 48, h: 6 },
    { id: "avatar", kind: "avatar", x: 76, y: 12, w: 18, h: 6 },
    { id: "cards", kind: "cards", x: 26, y: 22, w: 68, h: 18 },
    { id: "hero", kind: "hero", x: 26, y: 44, w: 40, h: 34 },
    { id: "text", kind: "text", x: 68, y: 44, w: 26, h: 34 },
    { id: "footer", kind: "footer", x: M, y: 84, w: FULL, h: 8 },
  ],
  // Magazine
  [
    { id: "nav", kind: "nav", x: M, y: 4, w: FULL, h: 5 },
    { id: "hero", kind: "hero", x: M, y: 12, w: 50, h: 34 },
    { id: "image", kind: "image", x: M + 50 + G, y: 12, w: FULL - 50 - G, h: 16 },
    { id: "text", kind: "text", x: M + 50 + G, y: 30, w: FULL - 50 - G, h: 16 },
    { id: "cards", kind: "cards", x: M, y: 50, w: FULL, h: 18 },
    { id: "cta", kind: "cta", x: 36, y: 72, w: 28, h: 6 },
    { id: "footer", kind: "footer", x: M, y: 84, w: FULL, h: 8 },
  ],
  // Signup
  [
    { id: "nav", kind: "nav", x: M, y: 4, w: FULL, h: 6 },
    { id: "heading", kind: "heading", x: 18, y: 20, w: 64, h: 7 },
    { id: "text", kind: "text", x: 22, y: 30, w: 56, h: 10 },
    { id: "form", kind: "form", x: 22, y: 44, w: 56, h: 20 },
    { id: "cta", kind: "cta", x: 34, y: 68, w: 32, h: 7 },
    { id: "footer", kind: "footer", x: M, y: 86, w: FULL, h: 6 },
  ],
];

function roundBlock(b: Block): Block {
  return {
    ...b,
    x: Math.round(b.x * 10) / 10,
    y: Math.round(b.y * 10) / 10,
    w: Math.round(b.w * 10) / 10,
    h: Math.round(b.h * 10) / 10,
  };
}

function randomLayout(): Block[] {
  const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
  return preset.map((b) => roundBlock({ ...b }));
}

function WireLine({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={cn("rounded-[1px] bg-[#b0b0b0]", className)}
      style={style}
    />
  );
}

function BlockFace({ kind }: { kind: BlockKind }) {
  switch (kind) {
    case "nav":
      return (
        <div className="flex h-full items-center gap-1 px-1.5">
          <span className="size-1.5 shrink-0 rounded-full bg-[#9a9a9a]" />
          <WireLine className="h-1 flex-1" />
          <WireLine className="h-1 w-[16%]" />
          <WireLine className="h-1 w-[12%]" />
        </div>
      );
    case "hero":
      return (
        <div className="flex h-full flex-col justify-center gap-1.5 px-2.5">
          <WireLine className="h-2 w-[48%]" />
          <WireLine className="h-1 w-[36%] bg-[#c4c4c4]" />
          <WireLine className="mt-1 h-2.5 w-[20%] bg-[#9a9a9a]" />
        </div>
      );
    case "heading":
      return (
        <div className="flex h-full items-center px-1.5">
          <WireLine className="h-2 w-full bg-[#9a9a9a]" />
        </div>
      );
    case "text":
      return (
        <div className="flex h-full flex-col justify-center gap-1 px-1.5 py-1">
          <WireLine className="h-1 w-full bg-[#c4c4c4]" />
          <WireLine className="h-1 w-[92%] bg-[#c4c4c4]" />
          <WireLine className="h-1 w-[86%] bg-[#c4c4c4]" />
          <WireLine className="h-1 w-[70%] bg-[#c4c4c4]" />
        </div>
      );
    case "image":
      return (
        <div className="relative flex h-full items-center justify-center bg-[#d8d8d8]">
          <svg
            viewBox="0 0 24 24"
            className="size-[28%] text-[#a8a8a8]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="M3 16l5-4 4 3 3-2 6 4" />
          </svg>
        </div>
      );
    case "cards":
      return (
        <div className="grid h-full grid-cols-3 gap-1 p-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-0.5 rounded-[2px] border border-[#cfcfcf] bg-[#efefef] p-1"
            >
              <span className="min-h-[40%] flex-1 rounded-[1px] bg-[#d4d4d4]" />
              <WireLine className="h-0.5 w-full" />
              <WireLine className="h-0.5 w-[65%] bg-[#c4c4c4]" />
            </div>
          ))}
        </div>
      );
    case "cta":
      return (
        <div className="flex h-full items-center justify-center px-1">
          <span className="flex h-[65%] w-full items-center justify-center rounded-[2px] bg-[#9a9a9a] font-mono text-[0.45rem] font-medium uppercase tracking-[0.1em] text-white">
            Button
          </span>
        </div>
      );
    case "form":
      return (
        <div className="flex h-full flex-col justify-center gap-1 px-1.5 py-1">
          <span className="h-2 w-full rounded-[2px] border border-[#cfcfcf] bg-white" />
          <span className="h-2 w-full rounded-[2px] border border-[#cfcfcf] bg-white" />
          <WireLine className="h-2 w-[42%] bg-[#9a9a9a]" />
        </div>
      );
    case "sidebar":
      return (
        <div className="flex h-full flex-col gap-1.5 p-1.5">
          {[0.85, 0.7, 0.78, 0.55, 0.62].map((w, i) => (
            <WireLine
              key={i}
              className="h-1 bg-[#c4c4c4]"
              style={{ width: `${w * 100}%` }}
            />
          ))}
        </div>
      );
    case "footer":
      return (
        <div className="flex h-full items-center justify-between gap-2 px-2">
          <WireLine className="h-1 w-[18%]" />
          <WireLine className="h-1 w-[32%] bg-[#c4c4c4]" />
          <WireLine className="h-1 w-[14%]" />
        </div>
      );
    case "search":
      return (
        <div className="flex h-full items-center gap-1.5 px-1.5">
          <span className="size-1.5 rounded-full border border-[#9a9a9a]" />
          <span className="h-1.5 flex-1 rounded-full bg-[#d8d8d8]" />
        </div>
      );
    case "avatar":
      return (
        <div className="flex h-full items-center justify-end gap-1 px-1.5">
          <WireLine className="h-1 w-[36%]" />
          <span className="size-2.5 rounded-full bg-[#b0b0b0]" />
        </div>
      );
    default:
      return null;
  }
}

/**
 * Micro-Figma layout board: grey canvas, grey wireframes, clean non-overlapping presets.
 */
export function WireframeLayoutCard({ focused }: { focused?: boolean }) {
  const [blocks, setBlocks] = React.useState<Block[]>(() =>
    PRESETS[0].map((b) => ({ ...b })),
  );
  const [selected, setSelected] = React.useState<string | null>(null);
  const [roll, setRoll] = React.useState(0);
  const [diceSpin, setDiceSpin] = React.useState(false);
  const boardRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    id: string;
    ox: number;
    oy: number;
  } | null>(null);

  React.useEffect(() => {
    if (!focused) {
      setSelected(null);
      dragRef.current = null;
    }
  }, [focused]);

  const onDice = React.useCallback(() => {
    setDiceSpin(true);
    setBlocks(randomLayout());
    setSelected(null);
    setRoll((n) => n + 1);
    window.setTimeout(() => setDiceSpin(false), 380);
  }, []);

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (!focused) return;
    e.stopPropagation();
    e.preventDefault();
    const board = boardRef.current;
    if (!board) return;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const rect = board.getBoundingClientRect();
    dragRef.current = {
      id,
      ox: ((e.clientX - rect.left) / rect.width) * 100 - block.x,
      oy: ((e.clientY - rect.top) / rect.height) * 100 - block.y,
    };
    setSelected(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!drag || !board) return;
    e.preventDefault();
    const rect = board.getBoundingClientRect();
    const block = blocks.find((b) => b.id === drag.id);
    if (!block) return;
    const x = clamp(
      snap(((e.clientX - rect.left) / rect.width) * 100 - drag.ox),
      0,
      100 - block.w,
    );
    const y = clamp(
      snap(((e.clientY - rect.top) / rect.height) * 100 - drag.oy),
      0,
      100 - block.h,
    );
    setBlocks((prev) =>
      prev.map((b) => (b.id === drag.id ? { ...b, x, y } : b)),
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    dragRef.current = null;
  };

  return (
    <div
      className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#f0f0f0] text-[#444]"
      role="application"
      aria-label="Wireframe layout board. Drag components or roll the dice for a new layout."
    >
      {/* Figma-like toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#ddd] bg-[#fafafa] px-2.5 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#888]">
        <span className="flex gap-1" aria-hidden>
          <i className="size-1.5 rounded-full bg-[#ff5f57]" />
          <i className="size-1.5 rounded-full bg-[#febc2e]" />
          <i className="size-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate text-[#666]">Desktop — Wireframe</span>
        <span className="ml-auto text-[#bbb]">#{roll}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDice();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "flex size-6 items-center justify-center rounded border border-[#ddd] bg-white text-[0.8rem] shadow-sm transition hover:border-[#bbb] hover:bg-[#f5f5f5]",
            diceSpin && "animate-spin",
          )}
          aria-label="Randomize layout"
          title="Randomize layout"
        >
          🎲
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-2 p-2.5">
        {/* Grey canvas + white artboard */}
        <div
          className="relative min-h-0 flex-1 overflow-hidden rounded-sm"
          style={{
            backgroundColor: "#e3e3e3",
            backgroundImage:
              "radial-gradient(circle, #cfcfcf 0.7px, transparent 0.7px)",
            backgroundSize: "10px 10px",
          }}
        >
          <span className="pointer-events-none absolute left-[7%] top-[2.5%] font-mono text-[0.5rem] tracking-[0.04em] text-[#999]">
            Frame 1440 × 900
          </span>
          <div
            ref={boardRef}
            className={cn(
              "absolute inset-[7%] top-[8%] overflow-hidden rounded-[2px] border border-[#d0d0d0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
              focused ? "cursor-default" : "cursor-pointer",
            )}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerDown={() => setSelected(null)}
          >
            {blocks.map((b) => {
              const isSel = selected === b.id;
              return (
                <div
                  key={`${b.id}-${roll}`}
                  role="button"
                  tabIndex={focused ? 0 : -1}
                  aria-label={`${LABELS[b.kind]} block`}
                  onPointerDown={(e) => onPointerDown(e, b.id)}
                  className={cn(
                    "absolute touch-none select-none overflow-hidden rounded-[2px] border bg-[#f3f3f3] transition-[box-shadow,border-color] duration-100",
                    isSel
                      ? "z-20 border-[#0d99ff] shadow-[0_0_0_1px_#0d99ff]"
                      : "z-10 border-[#c8c8c8] hover:border-[#a8a8a8]",
                    focused
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-pointer",
                  )}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                  }}
                >
                  <BlockFace kind={b.kind} />
                  {isSel ? (
                    <>
                      <span className="pointer-events-none absolute -left-[3px] -top-[3px] size-[5px] rounded-[1px] border border-white bg-[#0d99ff]" />
                      <span className="pointer-events-none absolute -right-[3px] -top-[3px] size-[5px] rounded-[1px] border border-white bg-[#0d99ff]" />
                      <span className="pointer-events-none absolute -bottom-[3px] -left-[3px] size-[5px] rounded-[1px] border border-white bg-[#0d99ff]" />
                      <span className="pointer-events-none absolute -bottom-[3px] -right-[3px] size-[5px] rounded-[1px] border border-white bg-[#0d99ff]" />
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <p className="shrink-0 px-0.5 pb-0.5 text-center font-sans text-[0.68rem] leading-snug tracking-[-0.01em] text-[#777] md:text-[0.72rem]">
          We see{" "}
          <span className="font-medium" style={{ color: YELLOW, background: "#222", padding: "0 0.25em" }}>
            UX
          </span>{" "}
          as the most important part of every product we build.
        </p>
      </div>
    </div>
  );
}
