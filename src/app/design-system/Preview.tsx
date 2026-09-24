"use client";

import { useEffect, useState } from "react";

const VIEWPORTS = [
  { label: "Desktop", width: 1440 },
  { label: "991", width: 991 },
  { label: "767", width: 767 },
  { label: "479", width: 479 },
];

/** Live preview of a component/section/template in an isolated iframe.
 *  Media queries respond to the iframe width, so the viewport buttons
 *  demonstrate real responsive behaviour. Height auto-fits via EmbedPing
 *  postMessage (fixed-position embeds like the nav keep `height`). */
export function Preview({
  id,
  height = 400,
  dark = false,
  pageHref,
}: {
  id: string;
  height?: number;
  dark?: boolean;
  pageHref?: string;
}) {
  const [w, setW] = useState<number | null>(null); // null = full width
  const [h, setH] = useState(height);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.ds === id && typeof d.h === "number" && d.h > 100) {
        setH(Math.min(Math.round(d.h) + 4, height));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [id, height]);

  return (
    <div className="ds-preview">
      <div className="ds-preview-bar">
        <div className="ds-viewports">
          <button
            className={w === null ? "is-active" : ""}
            onClick={() => setW(null)}
          >
            Fit
          </button>
          {VIEWPORTS.map((v) => (
            <button
              key={v.width}
              className={w === v.width ? "is-active" : ""}
              onClick={() => setW(v.width)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="ds-preview-links">
          {pageHref && (
            <a
              className="ds-preview-open"
              href={pageHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live page ↗
            </a>
          )}
          <a
            className="ds-preview-open"
            href={`/design-system/embed/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open ↗
          </a>
        </div>
      </div>
      <div className={`ds-preview-body ${dark ? "is-dark" : ""}`}>
        <iframe
          src={`/design-system/embed/${id}`}
          style={{
            width: w === null ? "100%" : w,
            height: h,
            maxWidth: "100%",
          }}
          title={`${id} preview`}
          loading="lazy"
        />
      </div>
    </div>
  );
}
