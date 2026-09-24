"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Section } from "@/lib/content";
import type { PageData } from "@/lib/pages";
import { SECTION_SCHEMAS, SCHEMA_BY_TYPE, setPath } from "@/lib/section-schemas";
import { TEMPLATE_SCHEMAS, COLLECTIONS_SCHEMA } from "@/lib/template-schemas";
import { Inspector } from "./Inspector";
import { PageTree } from "./PageTree";
import { AgentChat } from "./AgentChat";
import { Board } from "./Board";

interface PageMeta {
  slug: string;
  title: string;
  template: string;
  hasDraft: boolean;
}

const VIEWPORTS = [
  { l: "Fit", w: "100%" },
  { l: "1440", w: "1440px" },
  { l: "991", w: "991px" },
  { l: "767", w: "767px" },
  { l: "479", w: "479px" },
];

export function StudioApp() {
  const [doc, setDoc] = useState<any | null>(null); // PageData | {slug:'__collections',collectionsEdit}
  const [sel, setSel] = useState(-1);
  const [dirty, setDirty] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saved, setSaved] = useState<"" | "draft" | "published">("");
  const [isNew, setIsNew] = useState(false);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [filter, setFilter] = useState("");
  const [assets, setAssets] = useState<string[]>([]);
  const [tab, setTab] = useState<"add" | "pages" | "agent">("pages");
  const [view, setView] = useState<"page" | "board">("page");
  const [vp, setVp] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const pushT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushDoc = useCallback((d: any | null) => {
    if (pushT.current) clearTimeout(pushT.current);
    pushT.current = setTimeout(() => {
      iframe.current?.contentWindow?.postMessage({ hbDoc: d }, "*");
    }, 120);
  }, []);

  const history = useRef<any[]>([]);

  const edit = useCallback((next: any | null) => {
    setDoc((cur: any) => {
      if (cur) history.current.push(cur);
      if (history.current.length > 60) history.current.shift();
      return next;
    });
    setDirty(true);
  }, []);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (prev) {
      setDoc(prev);
      setDirty(true);
    }
  }, []);

  useEffect(() => {
    if (doc) pushDoc(doc);
  }, [doc, pushDoc]);

  /* ── loaders ─────────────────────────────────────────────── */
  const refreshPages = useCallback(async () => {
    const [list, imgs] = await Promise.all([
      fetch("/api/cms/pages").then((r) => r.json()),
      fetch("/api/cms/assets").then((r) => r.json()),
    ]);
    setPages(list.pages ?? []);
    setAssets(imgs.images ?? []);
  }, []);

  const openDoc = useCallback(async (slug: string) => {
    if (slug === "__collections") {
      const r = await fetch("/api/cms/collections").then((r) => r.json());
      setDoc({ slug: "__collections", title: "Collections", template: "collections", collectionsEdit: r.data });
      setHasDraft(!!r.hasDraft);
    } else {
      const p = await fetch(`/api/cms/pages?slug=${encodeURIComponent(slug)}`).then((r) => r.json());
      if (p.error) return;
      setDoc(p);
      const meta = pages.find((m) => m.slug === slug);
      setHasDraft(!!meta?.hasDraft);
    }
    setIsNew(false);
    setSel(-1);
    setDirty(false);
  }, [pages]);

  const newPage = useCallback(() => {
    setDoc({
      slug: "",
      title: "New page",
      desc: "",
      template: "freeform",
      data: { sections: [] },
    });
    setIsNew(true);
    setHasDraft(false);
    setSel(-1);
    setDirty(true);
    setTab("add");
  }, []);

  /* ── iframe messages ─────────────────────────────────────── */
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d?.hbReady) {
        setCanvasReady(true);
        if (doc) iframe.current?.contentWindow?.postMessage({ hbDoc: doc }, "*");
      }
      if (typeof d?.hbSelect === "number") setSel(d.hbSelect);
      if (d?.hbInsert && doc?.template === "freeform") {
        const schema = SCHEMA_BY_TYPE.get(d.hbInsert.type);
        if (!schema) return;
        const sections = [...(doc.data?.sections ?? [])];
        sections.splice(d.hbInsert.index, 0, schema.make());
        setSel(d.hbInsert.index);
        edit({ ...doc, data: { sections } });
      }
      /* in-canvas text/HTML edits */
      if (d?.hbEdit && doc) {
        const { sec, path, value } = d.hbEdit;
        if (doc.slug === "__collections") {
          edit({ ...doc, collectionsEdit: setPath(doc.collectionsEdit, path, value) });
        } else if (doc.template === "freeform") {
          const s = [...(doc.data?.sections ?? [])];
          if (sec >= 0 && s[sec]) s[sec] = setPath(s[sec], path, value);
          edit({ ...doc, data: { sections: s } });
        } else if (doc.data) {
          edit({ ...doc, data: setPath(doc.data, path, value) });
        } else {
          edit(setPath({ ...doc }, path, value));
        }
      }
      /* legacy whole-doc HTML edit */
      if (d?.hbEditHtml && doc) edit({ ...doc, html: d.hbEditHtml });
      /* image/link click → select + focus matching inspector field */
      const focus = d?.hbImg ?? d?.hbLink;
      if (focus) {
        if (doc?.template === "freeform" && focus.sec >= 0) setSel(focus.sec);
        setTimeout(() => {
          const top = focus.path.split(".")[0];
          const el = document.getElementById(`f-${CSS.escape(top)}`);
          el?.scrollIntoView({ block: "center", behavior: "smooth" });
          el?.classList.add("st-flash");
          setTimeout(() => el?.classList.remove("st-flash"), 1200);
        }, 80);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [doc, edit]);

  /* undo + quick save */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !typing) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  useEffect(() => {
    refreshPages().then(() => openDoc("__home"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── doc ops (freeform sections) ─────────────────────────── */
  const sections: Section[] =
    doc?.template === "freeform" ? doc.data?.sections ?? [] : [];

  const setSection = (i: number, next: Section) => {
    const s = [...sections];
    s[i] = next;
    edit({ ...doc, data: { sections: s } });
  };
  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const s = [...sections];
    [s[i], s[j]] = [s[j], s[i]];
    setSel(j);
    edit({ ...doc, data: { sections: s } });
  };
  const addSection = (type: string, index?: number) => {
    const schema = SCHEMA_BY_TYPE.get(type);
    if (!schema) return;
    const at = index ?? (sel >= 0 ? sel + 1 : sections.length);
    const s = [...sections];
    s.splice(at, 0, schema.make());
    setSel(at);
    edit({ ...doc, data: { sections: s } });
  };
  const selectAndScroll = (i: number) => {
    setSel(i);
    iframe.current?.contentWindow?.postMessage({ hbSel: i }, "*");
  };

  /* ── persistence ─────────────────────────────────────────── */
  const saveRef = useRef<(() => void) | null>(null);
  const isColl = doc?.slug === "__collections";
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };
  const save = async (publishNow: boolean) => {
    if (!doc || saving) return;
    const q = publishNow ? "?publish=1" : "";
    setSaving(true);
    try {
      if (isColl) {
        await fetch(`/api/cms/collections${q}`, {
          method: "POST",
          body: JSON.stringify(doc.collectionsEdit),
        });
      } else {
        if (doc.slug !== "__home" && !doc.slug) {
          alert("Set a slug first");
          return;
        }
        const url = doc.slug === "__home" ? `/api/cms/home${q}` : `/api/cms/pages${q}`;
        await fetch(url, { method: "POST", body: JSON.stringify(doc) });
        if (isNew) setIsNew(false);
      }
      setDirty(false);
      setHasDraft(!publishNow);
      setSaved(publishNow ? "published" : "draft");
      setTimeout(() => setSaved(""), 1600);
      showToast(publishNow ? "Published — live within ~30s" : "Draft saved");
      refreshPages();
      if (publishNow && doc.slug && doc.slug !== "__collections")
        fetch("/api/cms/thumb", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: doc.slug }),
        }).catch(() => {});
    } catch (e: any) {
      showToast(`Save failed: ${e.message}`, false);
    } finally {
      setSaving(false);
    }
  };
  saveRef.current = () => {
    if (dirty || hasDraft) void save(false);
  };
  const discard = async () => {
    if (!doc || !confirm("Discard the unpublished draft?")) return;
    if (isColl) await fetch("/api/cms/collections", { method: "DELETE" });
    else if (doc.slug === "__home") await fetch("/api/cms/home", { method: "DELETE" });
    else await fetch(`/api/cms/pages?slug=${doc.slug}&draft=1`, { method: "DELETE" });
    setHasDraft(false);
    setDirty(false);
    openDoc(doc.slug);
  };
  const deletePage = async (slug: string) => {
    if (!confirm(`Delete /${slug} permanently?`)) return;
    await fetch(`/api/cms/pages?slug=${slug}`, { method: "DELETE" });
    refreshPages();
    if (doc?.slug === slug) openDoc("__home");
  };

  /* ── inspector target ────────────────────────────────────── */
  const structured = doc && TEMPLATE_SCHEMAS[doc.template];
  const inspectorTarget = isColl
    ? doc.collectionsEdit
    : structured
      ? doc.template === "legacy"
        ? doc
        : doc.data
      : null;
  const inspectorSchema = isColl
    ? COLLECTIONS_SCHEMA
    : structured
      ? { ...TEMPLATE_SCHEMAS[doc.template], type: doc.template, icon: "◻", blurb: "", fields: TEMPLATE_SCHEMAS[doc.template].fields }
      : null;

  const usedUnique = new Set(
    sections.map((s) => SCHEMA_BY_TYPE.get(s.type)).filter((s) => s?.unique).map((s) => s!.type)
  );
  const selSchema = sel >= 0 ? SCHEMA_BY_TYPE.get(sections[sel]?.type) : null;

  const slugList = pages.map((p) => p.slug).filter((s) => !s.startsWith("__"));

  const filtered = pages.filter(
    (p) =>
      !p.slug.startsWith("__") &&
      (p.title.toLowerCase().includes(filter.toLowerCase()) ||
        p.slug.includes(filter.toLowerCase()))
  );

  return (
    <div className="studio">
      {/* ── topbar ── */}
      <header className="st-top">
        <a className="st-brand" href="/studio">
          <span>Studio</span>
        </a>
        <select
          className="st-pagesel st-in"
          value={isNew ? "__new" : doc?.slug ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (dirty && !confirm("Discard unsaved changes?")) return;
            if (v === "__new") newPage();
            else openDoc(v);
          }}
        >
          <option value="__home">Home — /</option>
          <option value="__collections">Collections — shared</option>
          <optgroup label="Pages">
            {pages.filter((p) => !p.slug.startsWith("__")).map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title || p.slug} — /{p.slug}
              </option>
            ))}
          </optgroup>
          <option value="__new">＋ New page</option>
        </select>
        {doc && !isColl && doc.slug !== "__home" && doc.slug !== "__menu" && (
          <>
            <input
              className="st-in st-slug"
              placeholder="slug, e.g. landing/summer"
              value={doc.slug}
              disabled={!isNew}
              onChange={(e) =>
                setDoc({ ...doc, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-/]/g, "-") })
              }
            />
            <input
              className="st-in st-title"
              placeholder="Page title"
              value={doc.title ?? ""}
              onChange={(e) => edit({ ...doc, title: e.target.value })}
            />
          </>
        )}
        {hasDraft && <span className="st-badge-draft">draft</span>}
        <div className="st-vps">
          <button className={view === "page" ? "on" : ""} onClick={() => setView("page")}>
            Page
          </button>
          <button className={view === "board" ? "on" : ""} onClick={() => setView("board")}>
            Board
          </button>
        </div>
        {view === "page" && (
          <div className="st-vps st-vps-viewports">
            {VIEWPORTS.map((v, i) => (
              <button key={v.l} className={vp === i ? "on" : ""} onClick={() => setVp(i)}>
                {v.l}
              </button>
            ))}
          </div>
        )}
        <div className="st-top-right">
          {doc && !isColl && doc.slug && doc.slug !== "__home" && doc.slug !== "__menu" && !isNew && (
            <a className="st-btn st-ghost" href={`/${doc.slug}`} target="_blank">
              View ↗
            </a>
          )}
          {doc?.slug === "__home" && !isNew && (
            <a className="st-btn st-ghost" href="/" target="_blank">
              View ↗
            </a>
          )}
          {hasDraft && (
            <button className="st-btn st-ghost" onClick={discard}>
              Discard
            </button>
          )}
          <button
            className="st-btn st-save"
            disabled={saving || (!dirty && !hasDraft)}
            onClick={() => save(false)}
          >
            {saving ? "Saving…" : saved === "draft" ? "Saved ✓" : "Save draft"}
          </button>
          <button
            className="st-btn st-publish"
            disabled={saving || (!dirty && !hasDraft)}
            onClick={() => save(true)}
          >
            {saving ? "Saving…" : saved === "published" ? "Published ✓" : "Publish"}
          </button>
        </div>
      </header>

      <div className="st-body">
        {/* ── left rail ── */}
        <aside className="st-left">
          <div className="st-tabs">
            {doc?.template === "freeform" && (
              <button className={tab === "add" ? "on" : ""} onClick={() => setTab("add")}>
                Add
              </button>
            )}
            <button className={tab === "pages" ? "on" : ""} onClick={() => setTab("pages")}>
              Pages
            </button>
            <button className={tab === "agent" ? "on" : ""} onClick={() => setTab("agent")}>
              Agent
            </button>
          </div>

          {tab === "agent" ? (
            <AgentChat
              currentSlug={doc?.slug}
              onTouched={(slugs) => {
                refreshPages();
                // reload the open doc if the agent changed it and we have
                // no unsaved local edits
                if (doc && slugs.includes(doc.slug) && !dirty) openDoc(doc.slug);
              }}
              onOpenPage={(slug) => {
                // surface the page the agent just worked on — but never
                // clobber unsaved edits on the current doc
                if (dirty) return;
                openDoc(slug);
              }}
            />
          ) : tab === "add" && doc?.template === "freeform" ? (
            <div className="st-palette">
              {SECTION_SCHEMAS.map((s) => {
                const used = !!s.unique && usedUnique.has(s.type);
                return (
                  <div
                    key={s.type}
                    className={`st-card ${used ? "used" : ""}`}
                    draggable={!used}
                    onDragStart={(e) => e.dataTransfer.setData("application/x-hb-section", s.type)}
                    onClick={() => !used && addSection(s.type)}
                    title={used ? "Already on page (max 1)" : "Click or drag onto canvas"}
                  >
                    <span className="st-card-ic">{s.icon}</span>
                    <span className="st-card-name">
                      {s.name}
                      {used && <em>· on page</em>}
                    </span>
                    <span className="st-card-blurb">{s.blurb}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="st-pagelist">
              <div className="st-search">
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5 14 14" />
                </svg>
                <input
                  className="st-in"
                  placeholder={`Filter ${pages.length - 2} pages…`}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button className="st-search-x" onClick={() => setFilter("")} title="Clear">
                    ✕
                  </button>
                )}
              </div>
              <div className="st-pinned">
                <div className="st-sec-h">Workspace</div>
                <button
                  className={`st-page-row special ${doc?.slug === "__home" ? "on" : ""}`}
                  onClick={() => openDoc("__home")}
                >
                  <span>Home</span>
                  <code>/</code>
                </button>
                <button
                  className={`st-page-row special ${isColl ? "on" : ""}`}
                  onClick={() => openDoc("__collections")}
                >
                  <span>Collections</span>
                  <code>shared</code>
                </button>
                <button
                  className={`st-page-row special ${doc?.slug === "__menu" ? "on" : ""}`}
                  onClick={() => openDoc("__menu")}
                >
                  <span>Menu</span>
                  <code>nav</code>
                </button>
              </div>
              {filter ? (
                filtered.map((p) => (
                  <div
                    className={`st-page-row ${doc?.slug === p.slug ? "on" : ""}`}
                    key={p.slug}
                  >
                    <button onClick={() => openDoc(p.slug)}>
                      <span>
                        {p.title || p.slug}
                        {p.hasDraft && <i className="st-dot" title="Unpublished draft" />}
                      </span>
                      <code>/{p.slug}</code>
                    </button>
                    <button className="st-del" title="Delete page" onClick={() => deletePage(p.slug)}>
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <PageTree
                  pages={pages}
                  active={doc?.slug ?? ""}
                  onOpen={openDoc}
                  onDelete={deletePage}
                />
              )}
              <button className="st-add" onClick={newPage}>
                + New page
              </button>
            </div>
          )}

          {/* layers (freeform only) */}
          {doc?.template === "freeform" && (
            <div className="st-layers">
              <div className="st-layers-h">
                Layers <em>{sections.length}</em>
              </div>
              {sections.map((s, i) => (
                <div
                  key={i}
                  className={`st-layer ${sel === i ? "on" : ""}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/layer", String(i))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData("text/layer"));
                    if (isNaN(from) || from === i) return;
                    const s2 = [...sections];
                    const [m] = s2.splice(from, 1);
                    s2.splice(i, 0, m);
                    setSel(i);
                    edit({ ...doc, data: { sections: s2 } });
                  }}
                  onClick={() => selectAndScroll(i)}
                >
                  <span className="st-layer-ic">{SCHEMA_BY_TYPE.get(s.type)?.icon ?? "▢"}</span>
                  <span className="st-layer-name">{SCHEMA_BY_TYPE.get(s.type)?.name ?? s.type}</span>
                  <span className="st-layer-tools">
                    <button onClick={(e) => { e.stopPropagation(); moveSection(i, -1); }}>↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveSection(i, 1); }}>↓</button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const s2 = [...sections];
                        s2.splice(i + 1, 0, structuredClone(s));
                        edit({ ...doc, data: { sections: s2 } });
                      }}
                    >
                      ⧉
                    </button>
                    <button
                      className="st-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSel(-1);
                        edit({ ...doc, data: { sections: sections.filter((_, j) => j !== i) } });
                      }}
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))}
              {sections.length === 0 && <div className="st-layers-empty">No sections yet</div>}
            </div>
          )}
        </aside>

        {/* ── canvas ── */}
        <div className={view === "board" ? "st-canvas board" : "st-canvas"}>
          {view === "board" ? (
            <Board
              pages={pages}
              active={doc?.slug}
              onOpen={(slug) => {
                openDoc(slug);
                setView("page");
              }}
              onCreated={refreshPages}
            />
          ) : (
            <>
              {!canvasReady && (
                <div className="st-canvas-loading">
                  <span className="st-spin" />
                  <span>Loading page…</span>
                  <span className="st-shimmer" />
                  <span className="st-shimmer w2" />
                </div>
              )}
              <iframe
                ref={iframe}
                src="/studio/preview"
                style={{ width: VIEWPORTS[vp].w }}
                title="Page canvas"
              />
            </>
          )}
        </div>
        {toast && <div className={`st-toast ${toast.ok ? "ok" : ""}`}>{toast.msg}</div>}

        {/* ── inspector ── */}
        <aside className="st-right" hidden={view === "board"}>
          {isColl || structured ? (
            <>
              <div className="st-insp-h">
                <span>{isColl ? "Collections" : TEMPLATE_SCHEMAS[doc.template].name}</span>
              </div>
              <Inspector
                section={inspectorTarget}
                schema={inspectorSchema as any}
                assets={assets}
                slugs={slugList}
                onChange={(next) =>
                  edit(isColl ? { ...doc, collectionsEdit: next } : structured && doc.template === "legacy" ? next : { ...doc, data: next })
                }
              />
            </>
          ) : doc?.template === "freeform" && sel >= 0 && selSchema ? (
            <>
              <div className="st-insp-h">
                <span>{selSchema.name}</span>
                <button
                  className="st-del"
                  title="Remove section"
                  onClick={() => {
                    setSel(-1);
                    edit({ ...doc, data: { sections: sections.filter((_, j) => j !== sel) } });
                  }}
                >
                  ✕
                </button>
              </div>
              <Inspector
                section={sections[sel]}
                schema={selSchema}
                assets={assets}
                slugs={slugList}
                onChange={(next) => setSection(sel, next)}
              />
            </>
          ) : (
            <div className="st-insp-empty">
              <p>Select a section on the canvas or in Layers to edit its content.</p>
              <p className="st-insp-hint">
                Drag blocks from <b>Add</b> onto the page — the blue line shows where they land.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
