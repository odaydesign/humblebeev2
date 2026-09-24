"use client";

import { useEffect, useMemo, useState } from "react";

export interface PageMeta {
  slug: string;
  title: string;
  template: string;
  hasDraft: boolean;
}

interface Node {
  seg: string;
  slug: string;
  page?: PageMeta;
  children: Node[];
}

function buildTree(pages: PageMeta[]): Node[] {
  const root: Node[] = [];
  for (const p of pages) {
    let kids = root;
    let node: Node | undefined;
    let slug = "";
    // a node can be a page AND a folder (e.g. /work is the index page
    // and the parent of /work/justr)
    for (const seg of p.slug.split("/")) {
      slug = slug ? `${slug}/${seg}` : seg;
      node = kids.find((n) => n.seg === seg);
      if (!node) {
        node = { seg, slug, children: [] };
        kids.push(node);
      }
      kids = node.children;
    }
    if (node) node.page = p;
  }
  const sort = (ns: Node[]) => {
    ns.sort((a, b) => a.seg.localeCompare(b.seg));
    ns.forEach((n) => sort(n.children));
  };
  sort(root);
  return root;
}

function countPages(n: Node): number {
  return (n.page ? 1 : 0) + n.children.reduce((s, c) => s + countPages(c), 0);
}

function countDrafts(n: Node): number {
  return (n.page?.hasDraft ? 1 : 0) + n.children.reduce((s, c) => s + countDrafts(c), 0);
}

function containsSlug(n: Node, slug: string): boolean {
  if (n.slug === slug) return true;
  return n.children.some((c) => containsSlug(c, slug));
}

const TEMPLATE_TAG: Record<string, string> = {
  story: "ST",
  case: "WK",
  program: "PR",
  freeform: "CV",
  legacy: "LG",
  storiesIndex: "IX",
  workIndex: "IX",
  programsIndex: "IX",
};

function Row({
  node,
  depth,
  active,
  expandAll,
  onOpen,
  onDelete,
}: {
  node: Node;
  depth: number;
  active: string;
  expandAll: number; // bump to expand/collapse all
  onOpen: (slug: string) => void;
  onDelete: (slug: string) => void;
}) {
  const hasKids = node.children.length > 0;
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState<boolean | null>(null);

  // auto-expand ancestors of the active page
  useEffect(() => {
    if (hasKids && active && node.slug !== active && containsSlug(node, active)) {
      setForced(true);
    }
  }, [active, hasKids, node]);

  // expandAll: positive n → open, negative → close
  useEffect(() => {
    if (expandAll !== 0) setForced(expandAll > 0);
  }, [expandAll]);

  const isOpen = forced ?? open;
  const toggle = () => (forced === null ? setOpen(!open) : setForced(!forced));

  const total = countPages(node);
  const drafts = countDrafts(node);

  return (
    <div>
      <div
        className={`st-tree-row ${node.page && active === node.slug ? "on" : ""} ${!node.page ? "folder" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasKids ? (
          <button className={`st-tree-caret ${isOpen ? "open" : ""}`} onClick={toggle}>
            ▸
          </button>
        ) : (
          <span className="st-tree-caret none" />
        )}
        {node.page ? (
          <>
            <button className="st-tree-name" onClick={() => onOpen(node.slug)} title={`/${node.slug}`}>
              {node.seg}
              {node.page.template && (
                <em className="st-tree-tag">
                  {TEMPLATE_TAG[node.page.template] ?? node.page.template.slice(0, 2).toUpperCase()}
                </em>
              )}
              {node.page.hasDraft && <i className="st-dot" title="Unpublished draft" />}
            </button>
            <span className="st-tree-title" title={node.page.title}>
              {node.page.title}
            </span>
            <button className="st-del st-tree-del" title="Delete page" onClick={() => onDelete(node.slug)}>
              ✕
            </button>
          </>
        ) : (
          <>
            <button className="st-tree-name folder-name" onClick={toggle}>
              {node.seg}/
            </button>
            <span className="st-tree-count">
              {total}
              {drafts > 0 && <i className="st-dot" title={`${drafts} drafts inside`} />}
            </span>
          </>
        )}
      </div>
      {isOpen && (
        <div className="st-tree-kids">
          {node.children.map((c) => (
            <Row
              key={c.slug}
              node={c}
              depth={depth + 1}
              active={active}
              expandAll={expandAll}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageTree({
  pages,
  active,
  onOpen,
  onDelete,
}: {
  pages: PageMeta[];
  active: string;
  onOpen: (slug: string) => void;
  onDelete: (slug: string) => void;
}) {
  const [expandAll, setExpandAll] = useState(0);
  const tree = useMemo(
    () => buildTree(pages.filter((p) => !p.slug.startsWith("__"))),
    [pages]
  );
  return (
    <div className="st-tree">
      <div className="st-tree-tools">
        <span className="st-sec-h">Sitemap</span>
        <button onClick={() => setExpandAll((n) => Math.abs(n) + 1)} title="Expand all folders">Expand</button>
        <button onClick={() => setExpandAll((n) => -(Math.abs(n) + 1))} title="Collapse all folders">Collapse</button>
      </div>
      {tree.map((n) => (
        <Row
          key={n.slug}
          node={n}
          depth={0}
          active={active}
          expandAll={expandAll}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
