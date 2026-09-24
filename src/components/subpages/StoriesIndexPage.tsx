"use client";

import { useState } from "react";
import type { Collections } from "@/lib/pages";
import { StoryCardItem } from "./StoryCardItem";

export function StoriesIndexPage({
  data,
}: {
  data: Collections["stories"];
}) {
  const categories = data.categories.filter((c) => c.name !== "All");
  const all = data.categories.find((c) => c.name === "All");
  const tabs = [
    { name: "All", hrefs: all ? all.hrefs : data.items.map((i) => i.href) },
    ...categories,
  ];
  const [active, setActive] = useState(0);
  const byHref = new Map(data.items.map((i) => [i.href, i]));
  const visible = tabs[active].hrefs
    .map((h) => byHref.get(h))
    .filter((c): c is (typeof data.items)[number] => Boolean(c));

  return (
    <div className="main-wrapper">
      <section>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-xlarge">
              <div className="margin-bottom margin-small">
                <h1>Stories</h1>
              </div>
              <div className="w-tabs">
                <div className="category-list w-tab-menu" role="tablist">
                  {tabs.map((t, i) => (
                    <button
                      key={t.name}
                      role="tab"
                      aria-selected={i === active}
                      onClick={() => setActive(i)}
                      className={`category-link w-inline-block w-tab-link${
                        i === active ? " w--current" : ""
                      }`}
                    >
                      <div className={`text-block-${5 + i}`}>{t.name}</div>
                    </button>
                  ))}
                </div>
                <div className="w-tab-content">
                  <div className="w-tab-pane w--tab-active">
                    <div className="blog_component w-dyn-list">
                      <div role="list" className="blog_list w-dyn-items">
                        {visible.map((c) => (
                          <StoryCardItem key={c.href} card={c} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
