"use client";

import { useEffect, useState } from "react";

interface SideData {
  id: string;
  title: string;
  entries: { id: string; name: string }[];
}

/** Catalog sidebar: filter input + scroll-spy highlighting of the
 *  entry currently in view. */
export function SideBar({ levels }: { levels: SideData[] }) {
  const [q, setQ] = useState("");
  const [current, setCurrent] = useState("");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) setCurrent(e.target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    document
      .querySelectorAll(".ds-entry[id], .ds-level[id]")
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const needle = q.trim().toLowerCase();
  const match = (s: string) => !needle || s.toLowerCase().includes(needle);

  return (
    <aside className="ds-side">
      <div className="ds-side-logo">
        <a href="#top" className="ds-side-home">
          Humblebee DS
        </a>
      </div>
      <div className="ds-side-sub">Component map · v1</div>
      <input
        className="ds-side-filter"
        placeholder="Filter components…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="ds-side-group">
        <div className="ds-side-group-title">Overview</div>
        <a href="#map" className={current === "map" ? "is-current" : ""}>
          Page anatomy
        </a>
        <a href="#pages" className={current === "pages" ? "is-current" : ""}>
          All pages
        </a>
      </div>
      {levels.map((l) => {
        const entries = l.entries.filter((e) => match(e.name) || match(l.title));
        if (!entries.length) return null;
        return (
          <div className="ds-side-group" key={l.id}>
            <div className="ds-side-group-title">
              <a
                href={`#${l.id}`}
                className={current === l.id ? "is-current" : ""}
                style={{ padding: 0, border: 0, color: "inherit" }}
              >
                {l.title}
              </a>
              <span className="ds-side-count">{entries.length}</span>
            </div>
            {entries.map((e) => (
              <a
                key={e.id}
                href={`#${e.id}`}
                className={current === e.id ? "is-current" : ""}
              >
                {e.name}
              </a>
            ))}
          </div>
        );
      })}
    </aside>
  );
}
