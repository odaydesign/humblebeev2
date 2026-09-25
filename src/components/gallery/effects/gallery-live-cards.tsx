"use client";

import * as React from "react";

import { cn } from "../lib/utils";

/* ── Shared chrome ─────────────────────────────────────────────────────── */

const arcadeMono =
  "font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/45";

function CardChrome({
  label,
  children,
  className,
  dark = true,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 flex-col overflow-hidden",
        dark ? "bg-ink text-background" : "bg-secondary text-foreground",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b px-3 py-2",
          arcadeMono,
          dark ? "border-white/10" : "border-border text-muted-foreground",
        )}
      >
        <span className="flex gap-1" aria-hidden>
          <i className="size-1.5 rounded-full bg-[#ff5f57]" />
          <i className="size-1.5 rounded-full bg-[#febc2e]" />
          <i className="size-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

/** Top / bottom HUD strips outside the playfield. */
function ArcadeHudBar({
  children,
  edge,
  className,
}: {
  children: React.ReactNode;
  edge: "top" | "bottom";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 px-3 py-1.5",
        arcadeMono,
        edge === "top" ? "border-b border-white/10" : "border-t border-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── CLI card — live typing session ────────────────────────────────────── */

const CLI_LINES = [
  "$ hb create intelligent-product",
  "→ scaffolding design system…",
  "→ wiring model + taste layer…",
  "✓ shipped in 3 weeks",
  "$ hb status --live",
  "agents: 4  ·  humans: 2  ·  sync: ok",
];

export function CliCard({ active }: { active?: boolean }) {
  const [lines, setLines] = React.useState<string[]>([]);
  const [cursor, setCursor] = React.useState(true);

  React.useEffect(() => {
    let line = 0;
    let char = 0;
    let buf = "";
    let typing: number;
    let blink: number;
    let pause: number;

    const preferReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (preferReduce) {
      setLines(CLI_LINES);
      return;
    }

    blink = window.setInterval(() => setCursor((c) => !c), 480);

    const typeNext = () => {
      if (line >= CLI_LINES.length) {
        pause = window.setTimeout(() => {
          line = 0;
          char = 0;
          buf = "";
          setLines([]);
          typeNext();
        }, 2200);
        return;
      }
      const full = CLI_LINES[line]!;
      if (char <= full.length) {
        buf = full.slice(0, char);
        setLines((prev) => {
          const next = prev.slice(0, line);
          next[line] = buf;
          return next;
        });
        char += 1;
        typing = window.setTimeout(typeNext, 28 + Math.random() * 40);
      } else {
        line += 1;
        char = 0;
        buf = "";
        typing = window.setTimeout(typeNext, 380);
      }
    };

    typing = window.setTimeout(typeNext, active ? 200 : 600);
    return () => {
      window.clearTimeout(typing);
      window.clearTimeout(pause);
      window.clearInterval(blink);
    };
  }, [active]);

  return (
    <CardChrome label="humblebee — zsh">
      <pre className="box-border h-full overflow-hidden p-3.5 font-mono text-[0.72rem] leading-relaxed text-white/85 md:p-4 md:text-[0.8rem]">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith("$") ? "text-[#f7e731]" : "text-white/75"}>
            {l}
            {i === lines.length - 1 && cursor ? (
              <span className="ml-0.5 inline-block h-[1em] w-[0.45em] translate-y-[0.1em] bg-[#f7e731]" />
            ) : null}
          </div>
        ))}
      </pre>
    </CardChrome>
  );
}

/* ── ASCII generator card ──────────────────────────────────────────────── */

const ASCII_GLYPHS = " .:-=+*#%@";
const ASCII_COLS = 36;
const ASCII_ROWS = 18;

/** Phase lengths in frames (~70–110ms each). */
const ASCII_PHASE = {
  noise: 36,
  form: 22,
  hold: 48,
  dissolve: 20,
} as const;

type AsciiShapeId =
  | "logo"
  | "smile"
  | "rocket"
  | "heart"
  | "star"
  | "bee"
  | "bolt"
  | "fire"
  | "invader";

const ASCII_SHAPE_ORDER: AsciiShapeId[] = [
  "logo",
  "smile",
  "rocket",
  "heart",
  "star",
  "bee",
  "bolt",
  "fire",
  "invader",
];

const ASCII_SHAPE_LABEL: Record<AsciiShapeId, string> = {
  logo: "mark",
  smile: "face",
  rocket: "rocket",
  heart: "heart",
  star: "star",
  bee: "bee",
  bolt: "bolt",
  fire: "fire",
  invader: "invader",
};

/** Compact silhouettes (# = solid). Scaled to the character grid. */
const ASCII_BITMAPS: Partial<Record<AsciiShapeId, string[]>> = {
  smile: [
    "......##########......",
    "....##############....",
    "...################...",
    "..###..########..###..",
    ".###....######....###.",
    ".##......####......##.",
    ".##......####......##.",
    ".###....######....###.",
    "..###..########..###..",
    "..####..........####..",
    "...###..........###...",
    "...####........####...",
    "....#####....#####....",
    ".....############.....",
    "......##########......",
    "........######........",
  ],
  rocket: [
    "...........##...........",
    "..........####..........",
    ".........######.........",
    "........########........",
    "........##..##..........",
    ".......##########.......",
    ".......##########.......",
    "......############......",
    "......##..####..##......",
    "......############......",
    ".......##########.......",
    "........########........",
    ".......##.####.##.......",
    "......##...##...##......",
    ".....##....##....##.....",
    "....##............##....",
  ],
  heart: [
    "...######....######...",
    "..########..########..",
    ".####################.",
    ".####################.",
    ".####################.",
    "..##################..",
    "...################...",
    "....##############....",
    ".....############.....",
    "......##########......",
    ".......########.......",
    "........######........",
    ".........####.........",
    "..........##..........",
  ],
  star: [
    "...........##...........",
    "..........####..........",
    ".........######.........",
    "........########........",
    "...##################...",
    "..####################..",
    "...##################...",
    "....##############......",
    ".....############.......",
    "....##############......",
    "...####..####..####.....",
    "..###......##......###..",
    ".##.................##..",
  ],
  bee: [
    "....##..........##....",
    "...####........####...",
    "....##...####...##....",
    ".......########.......",
    "......##########......",
    ".....############.....",
    ".....##..####..##.....",
    "....##############....",
    "....##..######..##....",
    "....##############....",
    ".....############.....",
    "......##########......",
    ".......########.......",
    "........######........",
    ".........####.........",
  ],
  bolt: [
    ".........########.....",
    "........########......",
    ".......########.......",
    "......########........",
    ".....##############...",
    "....##############....",
    ".......########.......",
    "......########........",
    ".....########.........",
    "....########..........",
    "...########...........",
    "..########............",
    ".########.............",
  ],
  fire: [
    "..........##..........",
    ".........####.........",
    "........######........",
    ".......###..###.......",
    "......####..####......",
    ".....############.....",
    "....######..######....",
    "...################...",
    "...####......####.....",
    "..######....######....",
    "..################....",
    "...##############.....",
    "....############......",
    ".....##########.......",
    "......########........",
    ".......######.........",
  ],
  invader: [
    "..##..............##..",
    "...##............##...",
    "..##################..",
    ".####..########..####.",
    "######################",
    "##..##############..##",
    "##..##..........##..##",
    "....####......####....",
    "...##...##..##...##...",
    "..##..............##..",
  ],
};

function sampleBitmap(rows: string[], nx: number, ny: number): number {
  const h = rows.length;
  const w = rows[0]?.length ?? 1;
  const x = nx * (w - 1);
  const y = ny * (h - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const cell = (cx: number, cy: number) => (rows[cy]?.[cx] === "#" ? 1 : 0);
  const v00 = cell(x0, y0);
  const v10 = cell(x1, y0);
  const v01 = cell(x0, y1);
  const v11 = cell(x1, y1);
  return (
    v00 * (1 - fx) * (1 - fy) +
    v10 * fx * (1 - fy) +
    v01 * (1 - fx) * fy +
    v11 * fx * fy
  );
}

/** Ring + centre bar from mark-paths geometry (viewBox ~66×80). */
function sampleLogo(nx: number, ny: number): number {
  const x = nx * 66;
  const y = ny * 80;
  const cx = 33;
  const cy = 40;
  const outer = ((x - cx) / 31) ** 2 + ((y - cy) / 38) ** 2;
  if (outer > 1.02) return 0;
  const inBar = x >= 8 && x <= 58 && y >= 33 && y <= 47;
  if (inBar) return outer > 0.92 ? 0.55 : 1;
  const inner = ((x - cx) / 19) ** 2 + ((y - cy) / 22) ** 2;
  if (inner < 0.92) return 0;
  // Soft ring edge
  if (outer > 0.88) return 0.45 + (1.02 - outer) * 4;
  if (inner > 0.88) return 0.45 + (inner - 0.88) * 4;
  return 1;
}

function sampleShape(id: AsciiShapeId, nx: number, ny: number): number {
  if (id === "logo") return sampleLogo(nx, ny);
  const bmp = ASCII_BITMAPS[id];
  if (!bmp) return 0;
  // Letterbox bitmap into grid with padding so shapes read clearly
  const pad = 0.08;
  const ux = (nx - pad) / (1 - pad * 2);
  const uy = (ny - pad) / (1 - pad * 2);
  if (ux < 0 || uy < 0 || ux > 1 || uy > 1) return 0;
  return sampleBitmap(bmp, ux, uy);
}

function noiseField(x: number, y: number, t: number): number {
  const v =
    Math.sin(x * 0.35 + t) * Math.cos(y * 0.4 - t * 0.7) +
    Math.sin((x + y) * 0.2 + t * 1.3) * 0.85 +
    Math.sin(x * 0.15 - y * 0.25 + t * 0.5) * 0.4;
  return Math.min(1, Math.max(0, (v + 2.1) / 4.2));
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function glyphFor(density: number): string {
  const idx = Math.min(
    ASCII_GLYPHS.length - 1,
    Math.max(0, Math.floor(density * ASCII_GLYPHS.length)),
  );
  return ASCII_GLYPHS[idx]!;
}

function buildAsciiGrid(
  shapeId: AsciiShapeId,
  morph: number,
  frame: number,
  cols = ASCII_COLS,
  rows = ASCII_ROWS,
): string[] {
  const t = frame * 0.12;
  const lines: string[] = [];
  for (let y = 0; y < rows; y += 1) {
    let row = "";
    for (let x = 0; x < cols; x += 1) {
      const nx = (x + 0.5) / cols;
      const ny = (y + 0.5) / rows;
      const n = noiseField(x, y, t);
      const s = sampleShape(shapeId, nx, ny);
      // Inside shape: dense glyphs; outside: light/space. Morph blends field → form.
      const inside = s * (0.72 + 0.28 * n);
      const outside = n * 0.22 * (1 - morph * 0.85);
      const density = morph * inside + (1 - morph) * n * 0.85 + morph * outside * 0.15;
      // Soft vignette keeps terminal edges quieter
      const edge = Math.min(nx, ny, 1 - nx, 1 - ny);
      const vig = edge < 0.06 ? edge / 0.06 : 1;
      row += glyphFor(Math.min(1, density * vig));
    }
    lines.push(row);
  }
  return lines;
}

function asciiCycleAt(frame: number): { shapeId: AsciiShapeId; morph: number; phase: string } {
  const cycle =
    ASCII_PHASE.noise + ASCII_PHASE.form + ASCII_PHASE.hold + ASCII_PHASE.dissolve;
  const total = frame % (cycle * ASCII_SHAPE_ORDER.length);
  const shapeIndex = Math.floor(total / cycle) % ASCII_SHAPE_ORDER.length;
  const local = total % cycle;
  const shapeId = ASCII_SHAPE_ORDER[shapeIndex]!;

  if (local < ASCII_PHASE.noise) {
    return { shapeId, morph: 0, phase: "field" };
  }
  const afterNoise = local - ASCII_PHASE.noise;
  if (afterNoise < ASCII_PHASE.form) {
    return {
      shapeId,
      morph: easeInOut(afterNoise / ASCII_PHASE.form),
      phase: "form",
    };
  }
  const afterForm = afterNoise - ASCII_PHASE.form;
  if (afterForm < ASCII_PHASE.hold) {
    return { shapeId, morph: 1, phase: "hold" };
  }
  const afterHold = afterForm - ASCII_PHASE.hold;
  return {
    shapeId,
    morph: 1 - easeInOut(afterHold / ASCII_PHASE.dissolve),
    phase: "dissolve",
  };
}

export function AsciiCard({ active }: { active?: boolean }) {
  const [frame, setFrame] = React.useState(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setFrame((f) => f + 1), active ? 70 : 110);
    return () => window.clearInterval(id);
  }, [active, reduceMotion]);

  const { shapeId, morph, phase } = reduceMotion
    ? { shapeId: "logo" as const, morph: 1, phase: "hold" }
    : asciiCycleAt(frame);

  const grid = React.useMemo(
    () => buildAsciiGrid(shapeId, morph, reduceMotion ? 0 : frame),
    [shapeId, morph, frame, reduceMotion],
  );

  const status =
    reduceMotion
      ? "mark · static"
      : phase === "field"
        ? "field"
        : `${phase} · ${ASCII_SHAPE_LABEL[shapeId]}`;

  return (
    <CardChrome label="ascii · generate">
      <div className="flex h-full min-h-0 flex-col justify-between gap-3 p-3.5 md:p-4">
        <pre className="min-h-0 flex-1 overflow-hidden font-mono text-[clamp(0.5rem,1.35vw,0.68rem)] leading-[1.2] tracking-wider text-white/70">
          {grid.join("\n")}
        </pre>
        <p className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/35">
          {status}
        </p>
      </div>
    </CardChrome>
  );
}

/* ── Mini Space Invaders ───────────────────────────────────────────────── */

type InvaderGameProps = { focused?: boolean };

/** Logical game resolution — canvas buffer is scaled by DPR once. */
const INV_W = 280;
const INV_H = 320;
const ALIEN_EDGE = 20;
const ALIEN_STEP_Y = 10;
const ALIEN_BASE_Y = 36;
const SHIP_Y = INV_H - 22;
const MAX_LIVES = 3;
const YELLOW = "#f7e731";

type EnemyKind = "scout" | "soldier" | "tank";
type EnemyStyle = "classic" | "wasp" | "iron" | "neon" | "ember";

type EnemyDef = {
  w: number;
  h: number;
  hp: number;
  points: number;
  fireChance: number; // base fire weight while eligible
};

/** Shared stats — colors/style come from the session theme. */
const ENEMY: Record<EnemyKind, EnemyDef> = {
  scout: { w: 12, h: 8, hp: 1, points: 30, fireChance: 0.08 },
  soldier: { w: 16, h: 10, hp: 1, points: 20, fireChance: 0.14 },
  tank: { w: 20, h: 12, hp: 2, points: 50, fireChance: 0.22 },
};

type InvaderTheme = {
  id: string;
  tag: string;
  style: EnemyStyle;
  colors: Record<EnemyKind, string>;
  /** Row kinds from top → bottom (cycled if more rows). Fixed for the session. */
  rowKinds: EnemyKind[];
  marchMul: number;
  fireMul: number;
  bulletMul: number;
  /** Extra hp for tanks in this theme (0 or 1). */
  tankHpBonus: number;
};

/**
 * One theme is chosen on mount and kept for the whole play session.
 * Reload to get a different cast / look / feel.
 */
const INVADER_THEMES: InvaderTheme[] = [
  {
    id: "classic",
    tag: "CLS",
    style: "classic",
    colors: { scout: "#ffffff", soldier: YELLOW, tank: "#b0b0b0" },
    rowKinds: ["scout", "soldier", "soldier", "tank"],
    marchMul: 1,
    fireMul: 1,
    bulletMul: 1,
    tankHpBonus: 0,
  },
  {
    id: "wasp",
    tag: "WSP",
    style: "wasp",
    colors: { scout: YELLOW, soldier: "#ffe066", tank: "#c4a000" },
    // Scout-heavy swarm — zippy, weaker front.
    rowKinds: ["scout", "scout", "soldier", "scout"],
    marchMul: 1.22,
    fireMul: 0.85,
    bulletMul: 1.2,
    tankHpBonus: 0,
  },
  {
    id: "iron",
    tag: "IRN",
    style: "iron",
    colors: { scout: "#d8d8d8", soldier: "#9aa0a6", tank: "#6e747a" },
    // Armor line — slower, tankier, heavier fire.
    rowKinds: ["soldier", "tank", "tank", "soldier"],
    marchMul: 0.78,
    fireMul: 1.25,
    bulletMul: 0.85,
    tankHpBonus: 1,
  },
  {
    id: "neon",
    tag: "NEO",
    style: "neon",
    colors: { scout: "#7ef9ff", soldier: "#ff4fd8", tank: "#b388ff" },
    rowKinds: ["scout", "soldier", "scout", "tank"],
    marchMul: 1.1,
    fireMul: 1.15,
    bulletMul: 1.1,
    tankHpBonus: 0,
  },
  {
    id: "ember",
    tag: "EMB",
    style: "ember",
    colors: { scout: "#ffb347", soldier: "#ff6b35", tank: "#c23b22" },
    // Soldier phalanx with an ember tank rear.
    rowKinds: ["soldier", "soldier", "soldier", "tank"],
    marchMul: 0.92,
    fireMul: 1.05,
    bulletMul: 0.95,
    tankHpBonus: 0,
  },
];

function pickSessionTheme(): InvaderTheme {
  return INVADER_THEMES[Math.floor(Math.random() * INVADER_THEMES.length)]!;
}

type Alien = {
  x: number;
  y: number;
  kind: EnemyKind;
  hp: number;
  alive: boolean;
};

type Bullet = { x: number; y: number; vy: number; from: "player" | "enemy" };

type InvadersHud = {
  score: number;
  lives: number;
  wave: number;
  tag: string;
  accent: string;
  hint: string;
};

export function InvadersCard({ focused }: InvaderGameProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const playAreaRef = React.useRef<HTMLDivElement>(null);
  const focusedRef = React.useRef(!!focused);
  focusedRef.current = !!focused;

  const [hud, setHud] = React.useState<InvadersHud>({
    score: 0,
    lives: MAX_LIVES,
    wave: 1,
    tag: "—",
    accent: YELLOW,
    hint: "hover · play",
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const playArea = playAreaRef.current;
    if (!canvas || !playArea) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = INV_W;
    const H = INV_H;

    const syncCanvasSize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.round(W * dpr));
      const bh = Math.max(1, Math.round(H * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    syncCanvasSize();

    // Session roster: one theme for this page load (reload → different cast).
    const theme = pickSessionTheme();

    let raf = 0;
    let shipX = W / 2;
    let dir = 1;
    let alienX = 0;
    let alienY = ALIEN_BASE_Y;
    let alienDir = 1;
    let bullets: Bullet[] = [];
    let aliens: Alien[] = [];
    let cool = 0;
    let enemyFireCd = 0.6;
    let score = 0;
    let lives = MAX_LIVES;
    let wave = 1;
    let invuln = 0;
    let flash = 0; // game-over / hit flash timer
    let gameOver = false;
    let keys = { left: false, right: false, fire: false };
    let pointerInside = false;
    let pointerX: number | null = null;
    let acc = 0;
    const FIXED_DT = 1 / 60;

    let hudKey = "";
    const pushHud = (live: boolean) => {
      const hint = gameOver
        ? "game over"
        : live
          ? "←→ · click/space"
          : "hover · play";
      const key = `${score}|${lives}|${wave}|${theme.tag}|${hint}`;
      if (key === hudKey) return;
      hudKey = key;
      setHud({
        score,
        lives,
        wave,
        tag: theme.tag,
        accent: theme.colors.soldier,
        hint,
      });
    };
    pushHud(false);

    const spawnWave = (w: number) => {
      aliens = [];
      const rows = Math.min(4, 2 + Math.floor((w - 1) / 2));
      const cols = 6;
      // Later waves shift the theme's fixed row roster downward (more rear kinds).
      const rosterShift = Math.min(theme.rowKinds.length - 1, Math.floor((w - 1) / 3));
      for (let r = 0; r < rows; r += 1) {
        const kind =
          theme.rowKinds[(r + rosterShift) % theme.rowKinds.length] ?? "soldier";
        const def = ENEMY[kind];
        const hp = def.hp + (kind === "tank" ? theme.tankHpBonus : 0);
        for (let c = 0; c < cols; c += 1) {
          aliens.push({
            x: 28 + c * 36,
            y: 40 + r * 26,
            kind,
            hp,
            alive: true,
          });
        }
      }
      alienX = 0;
      alienY = ALIEN_BASE_Y;
      alienDir = 1;
      enemyFireCd = Math.max(0.35, 0.7 - w * 0.04) / theme.fireMul;
    };
    spawnWave(1);

    const fullReset = () => {
      score = 0;
      lives = MAX_LIVES;
      wave = 1;
      shipX = W / 2;
      bullets = [];
      invuln = 1.2;
      flash = 0;
      gameOver = false;
      cool = 0;
      spawnWave(1);
    };

    const isLive = () => focusedRef.current || pointerInside;

    const mapPointerX = (clientX: number) => {
      const rect = playArea.getBoundingClientRect();
      if (rect.width <= 0) return shipX;
      return ((clientX - rect.left) / rect.width) * W;
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (!focusedRef.current && !pointerInside) return;
      let used = false;
      if (e.key === "ArrowLeft" || e.key === "a") {
        keys.left = down;
        used = true;
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        keys.right = down;
        used = true;
      }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        keys.fire = down;
        used = true;
      }
      if (used) {
        pointerX = null;
        e.preventDefault();
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const onPointerMove = (e: PointerEvent) => {
      pointerInside = true;
      pointerX = mapPointerX(e.clientX);
    };
    const onPointerEnter = (e: PointerEvent) => {
      pointerInside = true;
      pointerX = mapPointerX(e.clientX);
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pointerInside = true;
      pointerX = mapPointerX(e.clientX);
      keys.fire = true;
      try {
        playArea.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      keys.fire = false;
      try {
        if (playArea.hasPointerCapture(e.pointerId)) {
          playArea.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
    };
    const onPointerLeave = () => {
      pointerInside = false;
      pointerX = null;
      keys.fire = false;
    };

    playArea.addEventListener("pointerenter", onPointerEnter);
    playArea.addEventListener("pointermove", onPointerMove);
    playArea.addEventListener("pointerdown", onPointerDown);
    playArea.addEventListener("pointerup", onPointerUp);
    playArea.addEventListener("pointercancel", onPointerUp);
    playArea.addEventListener("pointerleave", onPointerLeave);

    const onWinResize = () => syncCanvasSize();
    window.addEventListener("resize", onWinResize);

    let last = performance.now();

    const hitPlayer = () => {
      if (invuln > 0 || gameOver) return;
      lives -= 1;
      bullets = bullets.filter((b) => b.from === "player");
      invuln = 1.6;
      flash = 0.35;
      shipX = W / 2;
      if (lives <= 0) {
        gameOver = true;
        flash = 1.4;
      }
    };

    const step = (dt: number) => {
      if (flash > 0) flash -= dt;
      if (invuln > 0) invuln -= dt;

      if (gameOver) {
        if (flash <= 0) fullReset();
        return;
      }

      const live = isLive();
      const shipVulnerable = invuln <= 0;

      // Ship
      if (live) {
        if (pointerInside && pointerX != null) {
          shipX = pointerX;
        } else {
          if (keys.left) shipX -= 160 * dt;
          if (keys.right) shipX += 160 * dt;
        }
        if (keys.fire && cool <= 0 && shipVulnerable) {
          bullets.push({ x: shipX, y: H - 36, vy: -260, from: "player" });
          cool = 0.28;
        }
      } else {
        keys.left = keys.right = keys.fire = false;
        pointerX = null;
        shipX += dir * 70 * dt;
        if (shipX < 24 || shipX > W - 24) dir *= -1;
        if (cool <= 0 && Math.random() > 0.97) {
          bullets.push({ x: shipX, y: H - 36, vy: -260, from: "player" });
          cool = 0.45;
        }
      }
      shipX = Math.max(16, Math.min(W - 16, shipX));
      cool -= dt;

      // Formation speed: wave scale × session theme march feel.
      const marchSpeed = (26 + Math.min(18, wave * 2.5)) * theme.marchMul;
      alienX += alienDir * marchSpeed * dt;
      if (alienDir > 0 && alienX > ALIEN_EDGE) {
        alienX = ALIEN_EDGE;
        alienDir = -1;
        alienY += ALIEN_STEP_Y;
      } else if (alienDir < 0 && alienX < -ALIEN_EDGE) {
        alienX = -ALIEN_EDGE;
        alienDir = 1;
        alienY += ALIEN_STEP_Y;
      }
      // Invaders reach the player line → lose a life and bump formation up (no thrash).
      if (alienY > 118) {
        hitPlayer();
        alienY = ALIEN_BASE_Y;
        alienX = 0;
        alienDir = 1;
      }

      // Enemy fire — pick a random living alien in the lowest occupied column.
      enemyFireCd -= dt;
      if (enemyFireCd <= 0) {
        const living = aliens.filter((a) => a.alive);
        if (living.length > 0) {
          // Prefer bottom-most per column so shots come from the front rank.
          const byCol = new Map<number, Alien>();
          for (const a of living) {
            const col = Math.round(a.x);
            const prev = byCol.get(col);
            if (!prev || a.y > prev.y) byCol.set(col, a);
          }
          const shooters = [...byCol.values()];
          const shooter = shooters[Math.floor(Math.random() * shooters.length)]!;
          const def = ENEMY[shooter.kind];
          const fireWeight = def.fireChance * theme.fireMul;
          if (Math.random() < fireWeight * 8 || shooters.length <= 3) {
            const ax = shooter.x + alienX;
            const ay = shooter.y + (alienY - ALIEN_BASE_Y);
            const base =
              shooter.kind === "scout" ? 140 : shooter.kind === "tank" ? 90 : 110;
            bullets.push({
              x: ax,
              y: ay + def.h / 2,
              vy: base * theme.bulletMul,
              from: "enemy",
            });
          }
        }
        enemyFireCd =
          Math.max(0.28, 0.85 - wave * 0.05 + Math.random() * 0.35) / theme.fireMul;
      }

      // Move bullets
      for (const b of bullets) {
        b.y += b.vy * dt;
      }
      bullets = bullets.filter((b) => b.y > -12 && b.y < H + 12);

      // Player bullets vs aliens
      for (const b of bullets) {
        if (b.from !== "player") continue;
        for (const a of aliens) {
          if (!a.alive) continue;
          const def = ENEMY[a.kind];
          const ax = a.x + alienX;
          const ay = a.y + (alienY - ALIEN_BASE_Y);
          if (Math.abs(b.x - ax) < def.w / 2 + 2 && Math.abs(b.y - ay) < def.h / 2 + 3) {
            a.hp -= 1;
            b.y = -20;
            if (a.hp <= 0) {
              a.alive = false;
              score += def.points;
            } else {
              score += 5; // chip damage on tanks
            }
            break;
          }
        }
      }

      // Enemy bullets vs ship
      if (shipVulnerable) {
        for (const b of bullets) {
          if (b.from !== "enemy") continue;
          if (Math.abs(b.x - shipX) < 11 && Math.abs(b.y - SHIP_Y) < 10) {
            b.y = H + 40;
            hitPlayer();
            break;
          }
        }
      }

      bullets = bullets.filter((b) => b.y > -12 && b.y < H + 12);

      if (aliens.every((a) => !a.alive)) {
        wave += 1;
        score += 50 + wave * 10;
        bullets = bullets.filter((b) => b.from === "player");
        spawnWave(wave);
      }
    };

    const drawAlien = (kind: EnemyKind, ax: number, ay: number, hp: number, t: number) => {
      const def = ENEMY[kind];
      const color = theme.colors[kind];
      const maxHp = def.hp + (kind === "tank" ? theme.tankHpBonus : 0);
      const hw = def.w / 2;
      const hh = def.h / 2;
      const blink = kind === "tank" && hp < maxHp;
      ctx.fillStyle = blink && Math.floor(t / 120) % 2 === 0 ? "#ffffff" : color;

      const style = theme.style;

      if (kind === "scout") {
        if (style === "wasp" || style === "neon") {
          // Pointed chevron / sting
          ctx.beginPath();
          ctx.moveTo(ax, ay - hh - 1);
          ctx.lineTo(ax + hw + 1, ay + 1);
          ctx.lineTo(ax, ay + hh);
          ctx.lineTo(ax - hw - 1, ay + 1);
          ctx.closePath();
          ctx.fill();
          if (style === "neon") {
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.fillRect(ax - 1, ay - hh + 1, 2, hh);
          }
        } else if (style === "iron") {
          ctx.fillRect(ax - hw + 1, ay - hh, def.w - 2, def.h);
          ctx.fillRect(ax - 1, ay - hh - 2, 2, 3);
        } else {
          // Diamond / insect (classic + ember)
          ctx.beginPath();
          ctx.moveTo(ax, ay - hh);
          ctx.lineTo(ax + hw, ay);
          ctx.lineTo(ax, ay + hh);
          ctx.lineTo(ax - hw, ay);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(ax - 2, ay - 1, 1.5, 1.5);
        ctx.fillRect(ax + 0.5, ay - 1, 1.5, 1.5);
      } else if (kind === "soldier") {
        if (style === "ember") {
          // Trapezoid body
          ctx.beginPath();
          ctx.moveTo(ax - hw + 2, ay - hh);
          ctx.lineTo(ax + hw - 2, ay - hh);
          ctx.lineTo(ax + hw + 1, ay + hh);
          ctx.lineTo(ax - hw - 1, ay + hh);
          ctx.closePath();
          ctx.fill();
        } else if (style === "neon") {
          ctx.fillRect(ax - hw, ay - hh, def.w, def.h);
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillRect(ax - hw, ay - 1, def.w, 2);
          ctx.fillStyle = color;
        } else if (style === "iron") {
          ctx.fillRect(ax - hw, ay - hh, def.w, def.h);
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(ax - hw + 2, ay - hh + 2, def.w - 4, 2);
          ctx.fillStyle = color;
        } else {
          ctx.fillRect(ax - hw, ay - hh, def.w, def.h);
        }
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(ax - 4, ay - 3, 3, 3);
        ctx.fillRect(ax + 1, ay - 3, 3, 3);
        ctx.fillStyle = color;
        ctx.fillRect(ax - hw - 2, ay + 1, 2, 3);
        ctx.fillRect(ax + hw, ay + 1, 2, 3);
      } else {
        // Tank
        if (style === "iron") {
          ctx.fillRect(ax - hw - 1, ay - hh, def.w + 2, def.h);
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(ax - hw + 2, ay - hh + 2, def.w - 4, 2);
          ctx.fillRect(ax - hw + 2, ay + hh - 4, def.w - 4, 2);
          ctx.fillStyle = color;
          ctx.fillRect(ax - 2, ay - hh - 2, 4, 3);
        } else if (style === "neon" || style === "wasp") {
          ctx.beginPath();
          ctx.moveTo(ax - hw, ay - hh + 2);
          ctx.lineTo(ax - hw + 3, ay - hh);
          ctx.lineTo(ax + hw - 3, ay - hh);
          ctx.lineTo(ax + hw, ay - hh + 2);
          ctx.lineTo(ax + hw, ay + hh);
          ctx.lineTo(ax - hw, ay + hh);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(ax - hw, ay - hh, def.w, def.h);
        }
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(ax - 6, ay - 4, 4, 3);
        ctx.fillRect(ax + 2, ay - 4, 4, 3);
        ctx.fillStyle = color;
        ctx.fillRect(ax - 3, ay + 2, 6, 2);
        ctx.fillRect(ax - hw - 1, ay - 2, 2, 6);
        ctx.fillRect(ax + hw - 1, ay - 2, 2, 6);
      }
    };

    const draw = (now: number) => {
      const live = isLive();

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Hit / game-over flash
      if (flash > 0) {
        const a = gameOver ? Math.min(0.55, flash * 0.4) : Math.min(0.35, flash);
        const flashRgb =
          theme.id === "neon"
            ? "255,79,216"
            : theme.id === "ember"
              ? "255,107,53"
              : theme.id === "iron"
                ? "180,180,180"
                : "247,231,49";
        ctx.fillStyle = `rgba(${flashRgb},${a})`;
        ctx.fillRect(0, 0, W, H);
      }

      // stars
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let i = 0; i < 18; i += 1) {
        const sx = (i * 47 + now * 0.01) % W;
        const sy = (i * 73) % H;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // aliens
      for (const a of aliens) {
        if (!a.alive) continue;
        const ax = a.x + alienX;
        const ay = a.y + (alienY - ALIEN_BASE_Y);
        drawAlien(a.kind, ax, ay, a.hp, now);
      }

      // bullets
      for (const b of bullets) {
        if (b.from === "player") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(b.x - 1, b.y, 2, 8);
        } else {
          ctx.fillStyle = theme.colors.soldier;
          ctx.fillRect(b.x - 1.5, b.y, 3, 7);
        }
      }

      // ship (blink while invulnerable)
      const showShip = invuln <= 0 || Math.floor(now / 80) % 2 === 0;
      if (showShip && !gameOver) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(shipX, H - 28);
        ctx.lineTo(shipX - 12, H - 14);
        ctx.lineTo(shipX + 12, H - 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = YELLOW;
        ctx.fillRect(shipX - 2, H - 18, 4, 4);
      }

      if (gameOver) {
        ctx.fillStyle = theme.colors.soldier;
        ctx.font = "bold 14px ui-monospace, monospace";
        ctx.fillText("GAME OVER", W / 2 - 42, H / 2);
      }

      pushHud(live);
    };

    const tick = (now: number) => {
      const frameDt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += frameDt;
      let steps = 0;
      while (acc >= FIXED_DT && steps < 5) {
        step(FIXED_DT);
        acc -= FIXED_DT;
        steps += 1;
      }
      if (steps >= 5) acc = 0;
      draw(now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      playArea.removeEventListener("pointerenter", onPointerEnter);
      playArea.removeEventListener("pointermove", onPointerMove);
      playArea.removeEventListener("pointerdown", onPointerDown);
      playArea.removeEventListener("pointerup", onPointerUp);
      playArea.removeEventListener("pointercancel", onPointerUp);
      playArea.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <CardChrome label="arcade · invaders">
      <ArcadeHudBar edge="top">
        <span className="text-white/55">SCR {hud.score}</span>
        <span className="flex items-center gap-2">
          <span style={{ color: hud.accent }}>WV {hud.wave}</span>
          <span className="text-white/35">{hud.tag}</span>
        </span>
        <span className="min-w-[2.5rem] text-right text-white/55" aria-label={`${hud.lives} lives`}>
          {"▲".repeat(Math.max(0, hud.lives)) || "—"}
        </span>
      </ArcadeHudBar>

      <div
        ref={playAreaRef}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center bg-[#0a0a0a]"
      >
        <canvas
          ref={canvasRef}
          width={INV_W}
          height={INV_H}
          className="hb-gallery-live-canvas pointer-events-none"
        />
      </div>

      <ArcadeHudBar edge="bottom">
        <span className="text-white/35">{hud.hint}</span>
        <span className="text-white/25">invaders</span>
      </ArcadeHudBar>
    </CardChrome>
  );
}

/* ── Portfolio case card ───────────────────────────────────────────────── */

export function PortfolioCard({
  title = "Case study",
  meta = "2025 · Product",
  tags = ["AI", "Design", "Build"],
}: {
  title?: string;
  meta?: string;
  tags?: string[];
}) {
  return (
    <CardChrome label="portfolio" dark={false}>
      <div className="flex h-full min-h-0 flex-col justify-between gap-4 p-5 md:p-6">
        <div className="min-h-0">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">
            {meta}
          </p>
          <h3 className="mt-3 font-sans text-[clamp(1.35rem,3.2vw,1.85rem)] font-medium leading-[1.12] tracking-[-0.02em]">
            {title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </CardChrome>
  );
}
