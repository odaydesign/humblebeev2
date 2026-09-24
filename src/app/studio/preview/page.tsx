"use client";

import { useEffect, useRef, useState } from "react";
import type { Section } from "@/lib/content";
import { navContent, footerContent } from "@/lib/content";
import type { PageData, Collections } from "@/lib/pages";
import { getPath } from "@/lib/section-schemas";
import { SiteHeader } from "@/components/menu/site-header";
import { defaultMenu, type MenuConfig } from "@/lib/menu";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionRenderer } from "@/components/SectionRenderer";
import { ProgramPage } from "@/components/subpages/ProgramPage";
import { CasePage } from "@/components/subpages/CasePage";
import { StoryPage } from "@/components/subpages/StoryPage";
import { LegacyPage } from "@/components/subpages/LegacyPage";
import { ProgramsIndexPage } from "@/components/subpages/ProgramsIndexPage";
import { WorkIndexPage } from "@/components/subpages/WorkIndexPage";
import { StoriesIndexPage } from "@/components/subpages/StoriesIndexPage";

interface Doc extends PageData {
  collectionsEdit?: Collections;
}

interface Overlay {
  sec: number;
  path: string;
  x: number;
  y: number;
  w: number;
  value: string;
}

/**
 * Studio canvas — renders the working doc with real components + site
 * chrome and provides true in-canvas editing:
 *   [data-hb-f]       click → contentEditable, blur commits {hbEdit}
 *   [data-hb-overlay] click → floating textarea → {hbEdit}
 *   [data-hb-html]    click → editable HTML block → {hbEdit} (innerHTML)
 *   [data-hb-img]     click → {hbImg} (parent focuses inspector field)
 *   [data-hb-link]    click → {hbLink} (parent focuses link field)
 *   legacy pages      click any element → editable, blur → {hbEditHtml}
 * Messages in: {hbDoc}, {hbSel}. Out: {hbReady},{hbSelect},{hbInsert},
 * {hbEdit},{hbEditHtml},{hbImg},{hbLink}.
 */
export default function StudioPreview() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [collections, setCollections] = useState<Collections | null>(null);
  const [menu, setMenu] = useState<MenuConfig>(defaultMenu);
  const [homeSecs, setHomeSecs] = useState<Section[] | null>(null);
  const [sel, setSel] = useState(-1);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const editingEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d?.hbDoc) {
        setDoc(d.hbDoc);
        if (d.hbDoc.slug === "__collections") setCollections(d.hbDoc.collectionsEdit);
      }
      if (typeof d?.hbSel === "number") {
        setSel(d.hbSel);
        wrap.current
          ?.querySelector(`[data-hb-sec="${d.hbSel}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ hbReady: true }, "*");
    fetch("/api/cms/collections?published=1")
      .then((r) => r.json())
      .then((r) => setCollections(r.data))
      .catch(() => {});
    // published menu config for chrome; home sections as __menu backdrop
    fetch("/api/cms/pages?slug=__menu&published=1")
      .then((r) => r.json())
      .then((r) => r?.data && setMenu(r.data))
      .catch(() => {});
    fetch("/api/cms/pages?slug=__home&published=1")
      .then((r) => r.json())
      .then((r) => r?.data?.sections && setHomeSecs(r.data.sections))
      .catch(() => {});
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const post = (msg: any) => window.parent?.postMessage(msg, "*");

  const secOf = (el: Element | null) => {
    const s = el?.closest("[data-hb-sec]")?.getAttribute("data-hb-sec");
    return s == null ? -1 : Number(s);
  };

  /* ── inline text editing ─────────────────────────────────── */
  const commitEdit = (el: HTMLElement, path: string, html: boolean) => {
    el.contentEditable = "false";
    el.classList.remove("hb-editing");
    editingEl.current = null;
    if (path === "__legacy__") {
      commitLegacy();
      return;
    }
    const value = html ? el.innerHTML : el.innerText.trim();
    post({ hbEdit: { sec: secOf(el), path, value } });
  };

  const startInline = (el: HTMLElement, path: string, html = false) => {
    if (editingEl.current === el) return;
    if (editingEl.current) {
      editingEl.current.blur();
    }
    editingEl.current = el;
    el.contentEditable = "true";
    el.spellcheck = false;
    el.classList.add("hb-editing");
    el.focus();
    // select all text for quick replacement
    const range = document.createRange();
    range.selectNodeContents(el);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(range);
    const commit = () => {
      el.removeEventListener("blur", commit);
      commitEdit(el, path, html);
    };
    el.addEventListener("blur", commit);
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        el.removeEventListener("blur", commit);
        el.contentEditable = "false";
        el.classList.remove("hb-editing");
        editingEl.current = null;
        el.blur();
      }
      if (ev.key === "Enter" && !el.hasAttribute("data-hb-multi") && !html) {
        ev.preventDefault();
        el.blur(); // triggers commit
      }
    });
  };

  /* ── click routing ───────────────────────────────────────── */
  const onCanvasClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    // never navigate inside the canvas
    const link = t.closest("a");
    if (link) e.preventDefault();

    // legacy blob: edit any element, serialize whole page on blur
    const legacyRoot = wrap.current?.querySelector("[data-hb-legacy]");
    if (legacyRoot && legacyRoot.contains(t)) {
      startInline(t, "__legacy__", true);
      return;
    }

    const ov = t.closest<HTMLElement>("[data-hb-overlay]");
    if (ov) {
      const path = ov.getAttribute("data-hb-overlay")!;
      const sec = secOf(ov);
      const base =
        sec >= 0 && doc?.data && "sections" in doc.data
          ? (doc.data as any).sections[sec]
          : doc?.data ?? doc;
      const r = ov.getBoundingClientRect();
      setOverlay({
        sec,
        path,
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: Math.max(320, r.width),
        value: getPath(base, path) ?? "",
      });
      return;
    }

    const htmlEl = t.closest<HTMLElement>("[data-hb-html]");
    if (htmlEl) {
      startInline(htmlEl, htmlEl.getAttribute("data-hb-html")!, true);
      return;
    }

    const img = t.closest<HTMLElement>("[data-hb-img]");
    if (img) {
      post({ hbImg: { sec: secOf(img), path: img.getAttribute("data-hb-img") } });
      return;
    }

    const f = t.closest<HTMLElement>("[data-hb-f]");
    if (f) {
      startInline(f, f.getAttribute("data-hb-f")!);
      return;
    }

    const lk = t.closest<HTMLElement>("[data-hb-link]");
    if (lk) {
      post({ hbLink: { sec: secOf(lk), path: lk.getAttribute("data-hb-link") } });
    }
  };

  /* ── legacy serialize ────────────────────────────────────── */
  const commitLegacy = () => {
    const rootEl = wrap.current?.querySelector("[data-hb-legacy] > div");
    if (!rootEl) return;
    const clone = rootEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    clone.querySelectorAll(".hb-editing").forEach((el) => el.classList.remove("hb-editing"));
    post({ hbEditHtml: clone.innerHTML });
  };

  const indexAtY = (clientY: number) => {
    const els = wrap.current?.querySelectorAll("[data-hb-sec]");
    if (!els || els.length === 0) return 0;
    let idx = els.length;
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (clientY < r.top + r.height / 2 && idx === els.length) idx = i;
    });
    return idx;
  };

  const isFreeform = doc?.template === "freeform" || doc?.slug === "__home";
  const isMenu = doc?.slug === "__menu";
  const sections: Section[] = isFreeform ? ((doc?.data as any)?.sections ?? []) : [];
  const colls = doc?.collectionsEdit ?? collections;
  const menuCfg: MenuConfig = isMenu ? { ...defaultMenu, ...(doc?.data ?? {}) } : menu;

  let body: React.ReactNode = null;
  if (doc) {
    switch (doc.template) {
      case "program":
        body = <ProgramPage data={doc.data as any} />;
        break;
      case "case":
        body = <CasePage data={doc.data as any} />;
        break;
      case "story":
        body = colls ? (
          <StoryPage data={doc.data as any} allStories={colls.stories.items} />
        ) : (
          <div className="hb-empty">Loading…</div>
        );
        break;
      case "programsIndex":
        body = colls ? <ProgramsIndexPage data={colls.programs} /> : null;
        break;
      case "workIndex":
        body = colls ? <WorkIndexPage data={colls.work} /> : null;
        break;
      case "storiesIndex":
      case "collections":
        body = colls ? <StoriesIndexPage data={colls.stories} /> : null;
        break;
      case "legacy":
        body = (
          <div data-hb-legacy>
            <LegacyPage html={doc.html || ""} css={doc.css} />
          </div>
        );
        break;
      case "menu":
        // real homepage as backdrop so the glass tone + panel show in context
        body = (homeSecs ?? []).map((s, i) => <SectionRenderer key={i} section={s} />);
        break;
      default:
        body = null;
    }
  }

  return (
    <div
      onClick={onCanvasClick}
      onDragOver={(e) => {
        if (!isFreeform) return;
        e.preventDefault();
        setDropIdx(indexAtY(e.clientY));
      }}
      onDrop={(e) => {
        if (!isFreeform) return;
        e.preventDefault();
        const type = e.dataTransfer.getData("application/x-hb-section");
        setDropIdx(null);
        if (type) post({ hbInsert: { type, index: indexAtY(e.clientY) } });
      }}
    >
      <SiteHeader
        links={menuCfg.links}
        cases={menuCfg.cases}
        footnote={menuCfg.footnote}
        city={menuCfg.city}
        cta={{ label: menuCfg.ctaLabel, href: menuCfg.ctaHref }}
      />
      <main ref={wrap} className="hb-canvas">
        {isFreeform &&
          doc &&
          sections.map((s, i) => (
            <div
              key={i}
              data-hb-sec={i}
              className={`hb-sec ${sel === i ? "is-sel" : ""}`}
              onClick={() => {
                setSel(i);
                post({ hbSelect: i });
              }}
            >
              {dropIdx === i && <div className="hb-drop-line" />}
              <SectionRenderer section={s} />
            </div>
          ))}
        {isFreeform && dropIdx === sections.length && (
          <div className="hb-drop-line trail" />
        )}
        {isFreeform && doc && sections.length === 0 && (
          <div className="hb-empty">
            <h3>Blank canvas</h3>
            <p>Drag components here from the palette — or click one to add it.</p>
          </div>
        )}
        {body}
      </main>
      <SiteFooter content={footerContent} nav={navContent} />

      {/* floating overlay editor for split/non-text-node fields */}
      {overlay && (
        <div className="hb-overlay" style={{ left: overlay.x, top: overlay.y, width: overlay.w }}>
          <textarea
            autoFocus
            value={overlay.value}
            onChange={(e) => setOverlay({ ...overlay, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOverlay(null);
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                post({ hbEdit: { sec: overlay.sec, path: overlay.path, value: overlay.value } });
                setOverlay(null);
              }
            }}
          />
          <div className="hb-overlay-bar">
            <button
              onClick={() => {
                post({ hbEdit: { sec: overlay.sec, path: overlay.path, value: overlay.value } });
                setOverlay(null);
              }}
            >
              Apply
            </button>
            <button className="hb-cancel" onClick={() => setOverlay(null)}>
              Cancel
            </button>
            <span className="hb-overlay-hint">⌘↵ applies</span>
          </div>
        </div>
      )}

      <style>{`
        .hb-sec { position: relative; cursor: pointer; }
        .hb-sec:hover { outline: 2px dashed rgba(26,0,255,.45); outline-offset: -2px; }
        .hb-sec.is-sel { outline: 2px solid #1a00ff; outline-offset: -2px; }
        .hb-drop-line {
          position: absolute; top: -3px; left: 0; right: 0; height: 5px;
          background: #1a00ff; border-radius: 3px; z-index: 9000;
          box-shadow: 0 0 0 3px rgba(26,0,255,.25);
        }
        .hb-drop-line.trail { position: static; display: block; margin: -2px 0; }
        .hb-empty {
          min-height: 55vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          color: #6c6e74; font-family: var(--font-heading);
        }
        .hb-empty p { font-family: var(--font-body); }
        [data-hb-f],[data-hb-html],[data-hb-overlay]{cursor:text;}
        [data-hb-f]:hover,[data-hb-html]:hover,[data-hb-overlay]:hover{
          outline:1.5px dashed rgba(26,0,255,.5);outline-offset:2px;border-radius:2px;}
        [data-hb-img]:hover,[data-hb-link]:hover{outline:1.5px dashed rgba(255,128,0,.6);outline-offset:2px;}
        .hb-editing{
          outline:2px solid #1a00ff !important;outline-offset:3px;border-radius:3px;
          caret-color:#1a00ff;background:rgba(26,0,255,.04);min-width:1em;
        }
        .hb-overlay{
          position:absolute;z-index:9999;background:#fff;border:1.5px solid #1a00ff;
          border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.18);padding:8px;
          display:flex;flex-direction:column;gap:6px;
        }
        .hb-overlay textarea{
          width:100%;min-height:120px;border:0;resize:vertical;font:inherit;
          font-size:15px;line-height:1.5;padding:6px;outline:none;
        }
        .hb-overlay-bar{display:flex;gap:8px;align-items:center;}
        .hb-overlay-bar button{
          font:inherit;font-size:12px;font-weight:600;padding:5px 14px;
          border-radius:6px;border:0;background:#1a00ff;color:#fff;cursor:pointer;
        }
        .hb-overlay-bar .hb-cancel{background:#eee;color:#161616;}
        .hb-overlay-hint{font-size:11px;color:#6c6e74;margin-left:auto;}
      `}</style>
    </div>
  );
}
