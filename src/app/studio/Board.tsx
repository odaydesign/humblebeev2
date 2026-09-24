"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Site board — a Figma-style spatial overview of every page. Cards are
 * live thumbnails; folder clusters get labeled group frames; edges show
 * URL hierarchy (index → children). Pan/zoom run through direct DOM
 * transforms (no React re-render per frame). Drag cards to rearrange
 * (persisted via /api/cms/board). Click a card to open the page.
 */

export interface BoardPage {
  slug: string;
  title: string;
  template: string;
  hasDraft?: boolean;
}

type Pt = { x: number; y: number };

const CARD_W = 240;
const CARD_H = 196;
const GAP = 28;
const COLS = 4;
const GROUP_PAD = 20;
const GROUP_LABEL_H = 34;

const TAGS: Record<string, string> = {
  freeform: "CV",
  story: "ST",
  case: "WK",
  program: "PR",
  legacy: "LG",
  storiesIndex: "IX",
  workIndex: "IX",
  programsIndex: "IX",
};

/* ── auto layout: root pages in one cluster, then each folder ── */
function autoLayout(pages: BoardPage[]): Record<string, Pt> {
  const out: Record<string, Pt> = {};
  const roots = pages.filter((p) => !p.slug.includes("/") && p.slug !== "__home");
  const folders = new Map<string, BoardPage[]>();
  const indexPages = new Map<string, BoardPage>();
  for (const p of pages) {
    const i = p.slug.lastIndexOf("/");
    if (i > 0) {
      const parent = p.slug.slice(0, i);
      const top = p.slug.split("/")[0];
      const key = pages.some((q) => q.slug === parent) ? parent : top;
      if (!folders.has(key)) folders.set(key, []);
      folders.get(key)!.push(p);
    }
  }
  for (const [k] of folders) {
    const idx = pages.find((p) => p.slug === k);
    if (idx) indexPages.set(k, idx);
  }

  let y = 0;
  out["__home"] = { x: 0, y };
  y += CARD_H + 90;

  const clusterW = COLS * (CARD_W + GAP) - GAP;
  const cluster = (list: BoardPage[], x0: number, y0: number, label?: BoardPage) => {
    let yy = y0;
    if (label) {
      out[label.slug] = { x: x0, y: yy };
      yy += CARD_H + 70;
    }
    list.forEach((p, i) => {
      if (p.slug === label?.slug) return;
      out[p.slug] = { x: x0 + (i % COLS) * (CARD_W + GAP), y: yy + Math.floor(i / COLS) * (CARD_H + GAP) };
    });
    return yy + Math.ceil(list.length / COLS) * (CARD_H + GAP) + 90;
  };

  y = cluster(roots, 0, y);
  const sorted = [...folders.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (let i = 0; i < sorted.length; i += 2) {
    let rowH = 0;
    for (let j = 0; j < 2 && i + j < sorted.length; j++) {
      const [key, kids] = sorted[i + j];
      const idx = indexPages.get(key);
      const rest = kids.filter((k) => k !== idx).sort((a, b) => a.slug.localeCompare(b.slug));
      rowH = Math.max(rowH, cluster(rest, j * (clusterW + 110), y, idx) - y);
    }
    y += rowH;
  }
  return out;
}

export function Board({
  pages,
  active,
  onOpen,
  onCreated,
}: {
  pages: BoardPage[];
  active?: string;
  onOpen: (slug: string) => void;
  onCreated: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const zoomLabel = useRef<HTMLSpanElement>(null);
  /* transform lives outside React — wheel/pan write it + apply to the DOM
     directly so 160+ cards don't re-render per frame */
  const t = useRef({ x: 40, y: 40, z: 0.5 });
  const [pos, setPos] = useState<Record<string, Pt>>({});
  const [dirtyPos, setDirtyPos] = useState<Record<string, Pt>>({});
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const drag = useRef<{ kind: "pan" | "card"; slug?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const applyT = useCallback(() => {
    const { x, y, z } = t.current;
    if (world.current)
      world.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
    if (zoomLabel.current) zoomLabel.current.textContent = `${Math.round(z * 100)}%`;
  }, []);

  const realPages = useMemo(() => pages.filter((p) => p.slug !== "__collections"), [pages]);

  useEffect(() => {
    const auto = autoLayout(realPages);
    fetch("/api/cms/board")
      .then((r) => r.json())
      .then((d) => {
        const saved = d.positions ?? {};
        const merged = { ...auto };
        for (const s of realPages) if (saved[s.slug]) merged[s.slug] = saved[s.slug];
        setPos(merged);
      })
      .catch(() => setPos(auto));
  }, [realPages]);

  useEffect(() => {
    const keys = Object.keys(dirtyPos);
    if (!keys.length) return;
    const tm = setTimeout(() => {
      fetch("/api/cms/board", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ positions: dirtyPos }),
      });
      setDirtyPos({});
    }, 600);
    return () => clearTimeout(tm);
  }, [dirtyPos]);

  /* wheel zoom — proportional to delta so trackpads feel smooth */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const z = t.current.z;
      const z2 = Math.min(1.6, Math.max(0.1, z * Math.exp(-e.deltaY * 0.0018)));
      const k = z2 / z;
      t.current = { x: cx - (cx - t.current.x) * k, y: cy - (cy - t.current.y) * k, z: z2 };
      applyT();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyT]);

  const onPointerDown = (e: React.PointerEvent, slug?: string) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = {
      kind: slug ? "card" : "pan",
      slug,
      sx: e.clientX,
      sy: e.clientY,
      ox: slug ? pos[slug]?.x ?? 0 : t.current.x,
      oy: slug ? pos[slug]?.y ?? 0 : t.current.y,
      moved: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    if (d.kind === "pan") {
      t.current = { ...t.current, x: d.ox + dx, y: d.oy + dy };
      applyT();
    } else if (d.slug) {
      const np = { x: d.ox + dx / t.current.z, y: d.oy + dy / t.current.z };
      setPos((p) => ({ ...p, [d.slug!]: np }));
      setDirtyPos((p) => ({ ...p, [d.slug!]: np }));
    }
  };
  const onPointerUp = (e: React.PointerEvent, slug?: string) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved && d.kind === "card" && slug) onOpen(slug);
  };

  const zoomBy = (f: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const z = t.current.z;
    const z2 = Math.min(1.6, Math.max(0.1, z * f));
    const k = z2 / z;
    t.current = { x: cx - (cx - t.current.x) * k, y: cy - (cy - t.current.y) * k, z: z2 };
    applyT();
  };

  const fit = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !Object.keys(pos).length) return;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const p of Object.values(pos)) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + CARD_W); maxY = Math.max(maxY, p.y + CARD_H);
    }
    const z = Math.min((rect.width - 64) / (maxX - minX), (rect.height - 64) / (maxY - minY), 1);
    t.current = {
      x: (rect.width - (maxX - minX) * z) / 2 - minX * z,
      y: (rect.height - (maxY - minY) * z) / 2 - minY * z,
      z,
    };
    applyT();
  }, [pos, applyT]);

  const arrange = () => {
    const auto = autoLayout(realPages);
    setPos(auto);
    setDirtyPos(auto);
  };

  const createPage = async () => {
    const slug = newSlug.trim().replace(/^\/+|\/+$/g, "");
    if (!slug) return;
    await fetch("/api/cms/pages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, title: newTitle || slug, template: "freeform", data: { sections: [] } }),
    });
    setCreating(false); setNewSlug(""); setNewTitle("");
    onCreated();
  };

  /* ── group frames: bbox of each folder's members (+ site root) ── */
  const groups = useMemo(() => {
    const g = new Map<string, { label: string; minX: number; minY: number; maxX: number; maxY: number; n: number }>();
    const add = (key: string, label: string, p: Pt) => {
      let e = g.get(key);
      if (!e) { e = { label, minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9, n: 0 }; g.set(key, e); }
      e.minX = Math.min(e.minX, p.x); e.minY = Math.min(e.minY, p.y);
      e.maxX = Math.max(e.maxX, p.x + CARD_W); e.maxY = Math.max(e.maxY, p.y + CARD_H);
      e.n++;
    };
    for (const p of realPages) {
      const pt = pos[p.slug];
      if (!pt) continue;
      if (p.slug === "__home") { add("__root", "Site", pt); continue; }
      if (!p.slug.includes("/")) add("__root", "Site root", pt);
      else {
        const i = p.slug.lastIndexOf("/");
        const parent = p.slug.slice(0, i);
        const top = p.slug.split("/")[0];
        const key = realPages.some((q) => q.slug === parent) ? parent : top;
        add(key, `/${key}`, pt);
      }
    }
    return [...g.entries()].map(([k, e]) => ({
      key: k, label: e.label, n: e.n,
      x: e.minX - GROUP_PAD, y: e.minY - GROUP_PAD - GROUP_LABEL_H,
      w: e.maxX - e.minX + GROUP_PAD * 2, h: e.maxY - e.minY + GROUP_PAD * 2 + GROUP_LABEL_H,
    }));
  }, [realPages, pos]);

  /* ── hub-and-spoke edges: index card (or group label node) → members ── */
  const edges = useMemo(() => {
    const out: { a: string; b: string; ax: number; ay: number; bx: number; by: number; key: string }[] = [];
    const bySlug = new Map(realPages.map((p) => [p.slug, p]));
    const members = new Map<string, string[]>();
    for (const p of realPages) {
      const i = p.slug.lastIndexOf("/");
      if (i <= 0) continue;
      const parent = p.slug.slice(0, i);
      const top = p.slug.split("/")[0];
      const key = bySlug.has(parent) ? parent : top;
      if (!members.has(key)) members.set(key, []);
      members.get(key)!.push(p.slug);
    }
    for (const [key, kids] of members) {
      const hubPage = bySlug.get(key);
      // hub port: bottom-center of the index card, or the group's label node
      const hub = hubPage && pos[key]
        ? { x: pos[key].x + CARD_W / 2, y: pos[key].y + CARD_H }
        : groups.find((g) => g.key === key)
          ? { x: groups.find((g) => g.key === key)!.x + 70, y: groups.find((g) => g.key === key)!.y + GROUP_LABEL_H / 2 }
          : null;
      if (!hub) continue;
      for (const slug of kids) {
        if (slug === key || !pos[slug]) continue;
        out.push({ a: hubPage ? key : `grp:${key}`, b: slug, ax: hub.x, ay: hub.y, bx: pos[slug].x + CARD_W / 2, by: pos[slug].y, key: `${key}>${slug}` });
      }
    }
    // home → primary nav destinations
    const NAV = ["programs", "work", "journeys", "stories", "about-us", "careers", "contact", "hire-us"];
    const home = pos["__home"];
    if (home)
      for (const s of NAV) {
        if (!bySlug.has(s) || !pos[s]) continue;
        out.push({ a: "__home", b: s, ax: home.x + CARD_W / 2, ay: home.y + CARD_H, bx: pos[s].x + CARD_W / 2, by: pos[s].y, key: `home>${s}` });
      }
    return out;
  }, [realPages, pos, groups]);

  const hubs = useMemo(() => new Set(edges.map((e) => e.a)), [edges]);
  const [hover, setHover] = useState<string | null>(null);

  const bounds = useMemo(() => {
    let maxX = 0, maxY = 0;
    for (const p of Object.values(pos)) { maxX = Math.max(maxX, p.x + CARD_W + 200); maxY = Math.max(maxY, p.y + CARD_H + 200); }
    return { w: Math.max(maxX, 1200), h: Math.max(maxY, 900) };
  }, [pos]);

  const cards = useMemo(() => realPages.map((p) => {
    const pt = pos[p.slug];
    if (!pt) return null;
    return (
      <div
        key={p.slug}
        className={`st-bcard ${active === p.slug ? "on" : ""} ${p.hasDraft ? "draft" : ""}`}
        style={{ left: pt.x, top: pt.y, width: CARD_W }}
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, p.slug); }}
        onPointerUp={(e) => { e.stopPropagation(); onPointerUp(e, p.slug); }}
        onPointerEnter={() => setHover(p.slug)}
        onPointerLeave={() => setHover(null)}
      >
        {edges.some((e) => e.b === p.slug) && <i className="st-bport top" />}
        {hubs.has(p.slug) && <i className="st-bport bot" />}
        <div className="st-bcard-thumb">
          <span className="st-bcard-fallback">{p.title || p.slug}</span>
          <img
            src={`/api/cms/thumb?slug=${encodeURIComponent(p.slug)}`}
            loading="lazy"
            alt=""
            draggable={false}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        </div>
        <div className="st-bcard-bar">
          <span className="st-bcard-tag">{p.slug === "__home" ? "HM" : TAGS[p.template] ?? "PG"}</span>
          <span className="st-bcard-name">
            {p.slug === "__home" ? "Home" : p.title || p.slug}
            {p.hasDraft && <i className="st-dot" />}
          </span>
          <code>/{p.slug === "__home" ? "" : p.slug}</code>
        </div>
      </div>
    );
  }), [realPages, pos, active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      className="st-board"
      onPointerDown={(e) => onPointerDown(e)}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => onPointerUp(e)}
      onPointerLeave={() => (drag.current = null)}
    >
      <div
        ref={world}
        className="st-board-world"
        style={{
          width: bounds.w,
          height: bounds.h,
          transform: `translate(${t.current.x}px, ${t.current.y}px) scale(${t.current.z})`,
        }}
      >
        {/* folder group frames — labeled nodes behind the cards */}
        {groups.map((g) => (
          <div key={g.key} className="st-bgroup" style={{ left: g.x, top: g.y, width: g.w, height: g.h }}>
            <span className="st-bgroup-label">
              {g.label} <em>{g.n}</em>
            </span>
          </div>
        ))}
        <svg className="st-board-edges" width={bounds.w} height={bounds.h}>
          {edges.map((e) => {
            const my = (e.ay + e.by) / 2;
            const lit = hover ? e.a === hover || e.b === hover : true;
            return (
              <g key={e.key} className={`st-bedg ${lit ? "" : "dim"}`}>
                <path
                  d={`M ${e.ax} ${e.ay} C ${e.ax} ${my}, ${e.bx} ${my}, ${e.bx} ${e.by}`}
                  fill="none"
                  strokeWidth={lit && hover ? 2.5 : 1.8}
                />
                <circle cx={e.ax} cy={e.ay} r={3.5} />
                <circle cx={e.bx} cy={e.by} r={3.5} />
              </g>
            );
          })}
        </svg>
        {cards}
      </div>

      {/* toolbar */}
      <div className="st-board-tools" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => setCreating((v) => !v)}>＋ New page</button>
        <span className="st-board-sep" />
        <button onClick={() => zoomBy(0.8)}>−</button>
        <span ref={zoomLabel} className="st-board-zoom">50%</span>
        <button onClick={() => zoomBy(1.25)}>＋</button>
        <button onClick={fit}>Fit</button>
        <button onClick={arrange} title="Re-layout all cards">Arrange</button>
        <span className="st-board-sep" />
        <span className="st-board-count">{realPages.length} pages</span>
      </div>

      {creating && (
        <div className="st-board-new" onPointerDown={(e) => e.stopPropagation()}>
          <div className="st-board-new-h">New page</div>
          <input
            className="st-in"
            placeholder="slug — e.g. landing/summer"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-/]/g, "-"))}
            autoFocus
          />
          <input
            className="st-in"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createPage()}
          />
          <div className="st-board-new-btns">
            <button className="st-btn st-ghost" onClick={() => setCreating(false)}>Cancel</button>
            <button className="st-btn st-save" onClick={createPage} disabled={!newSlug.trim()}>Create draft</button>
          </div>
          <div className="st-board-new-hint">Nests under a folder when the slug has a path (work/x → under Work).</div>
        </div>
      )}
    </div>
  );
}
