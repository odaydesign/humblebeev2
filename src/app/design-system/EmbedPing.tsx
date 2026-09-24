"use client";

import { useEffect } from "react";

/** Runs inside /design-system/embed/[id] — reports document height to the
 *  parent frame so the catalog can auto-size preview iframes. */
export function EmbedPing({ id }: { id: string }) {
  useEffect(() => {
    const post = () =>
      window.parent?.postMessage(
        { ds: id, h: document.documentElement.scrollHeight },
        "*"
      );
    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);
    post();
    // re-post after fonts/images settle
    const timers = [300, 1000, 2500].map((t) => setTimeout(post, t));
    window.addEventListener("load", post);
    return () => {
      ro.disconnect();
      timers.forEach(clearTimeout);
      window.removeEventListener("load", post);
    };
  }, [id]);
  return null;
}
