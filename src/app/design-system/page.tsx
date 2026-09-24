import type { Metadata } from "next";
import "./ds.css";
import {
  LEVELS,
  COLORS,
  TYPE_SCALE,
  BREAKPOINTS,
} from "@/lib/design-system";
import { getPageIndex } from "@/lib/pages";
import { Preview } from "./Preview";
import { SideBar } from "./SideBar";
import { Swatch } from "./Swatch";

export const metadata: Metadata = {
  title: "Design System — Humblebee",
  robots: { index: false },
};

const TEMPLATE_LABELS: Record<string, string> = {
  program: "Program",
  case: "Case",
  story: "Story",
  programsIndex: "Index",
  workIndex: "Index",
  storiesIndex: "Index",
  legacy: "Legacy",
};

export default function DesignSystemPage() {
  const pages = getPageIndex();
  const counts = pages.reduce<Record<string, number>>((acc, p) => {
    acc[p.template] = (acc[p.template] || 0) + 1;
    return acc;
  }, {});
  const entryCount = LEVELS.reduce((n, l) => n + l.entries.length, 0);
  const nameOf = new Map(
    LEVELS.flatMap((l) => l.entries.map((e) => [e.id, e.name]))
  );
  const sideData = LEVELS.map((l) => ({
    id: l.id,
    title: l.title,
    entries: l.entries.map((e) => ({ id: e.id, name: e.name })),
  }));

  return (
    <div className="ds-body">
      <div className="ds-shell" id="top">
        {/* ── sidebar ── */}
        <SideBar levels={sideData} />

        {/* ── main ── */}
        <div className="ds-main">
          <div className="ds-hero">
            <h1>Design System</h1>
            <p>
              Every piece of the Humblebee site, broken down like a puzzle —
              from tokens and atoms up to full page templates. Each entry shows
              a live preview you can resize across the site&apos;s breakpoints.
            </p>
            <div className="ds-stats">
              <div className="ds-stat"><b>{pages.length + 1}</b><span>pages</span></div>
              <div className="ds-stat"><b>7</b><span>templates</span></div>
              <div className="ds-stat"><b>{entryCount}</b><span>building blocks</span></div>
              <div className="ds-stat"><b>3</b><span>breakpoints</span></div>
              <div className="ds-stat"><b>2</b><span>typefaces</span></div>
            </div>
          </div>

          {/* ── anatomy ── */}
          <div id="map" className="ds-tree">{`<Page>
  ├─ <SiteNav/>                     nav pill + fullscreen menu overlay
  ├─ <main>
  │    ├─ homepage:  <SectionRenderer/>  →  section.type → component
  │    │             hero · challenges · strategyMoves · programs
  │    │             statement · twoColumns · hire · featureBanner
  │    └─ subpages:  [...slug] → template → ProgramPage | CasePage
  │                  StoryPage | ×3 IndexPages | LegacyPage
  └─ <SiteFooter/>                  large links · small links · bottom row

content:  src/lib/content.ts  (typed, CMS-shaped)
pages:    src/lib/pages/*.json + collections.json  (typed per template)
styles:   globals.css (tokens + components) · legacy.css (ported Webflow)`}</div>

          {/* ── levels ── */}
          {LEVELS.map((level) => (
            <section key={level.id} className="ds-level" id={level.id}>
              <div className="ds-level-head">
                <h2>{level.title}</h2>
                <p>{level.blurb}</p>
              </div>

              {level.id === "foundations" && <Foundations />}

              {level.entries.map((e) => (
                <div key={e.id} className="ds-entry" id={e.id}>
                  <div className="ds-entry-head">
                    <h3>{e.name}</h3>
                    <span className="ds-file">{e.file}</span>
                  </div>
                  <p>{e.blurb}</p>
                  <div className="ds-meta">
                    {e.composedOf && (
                      <div className="is-comp">
                        <b>Composed of</b>
                        {e.composedOf}
                      </div>
                    )}
                    {e.usedIn && (
                      <div>
                        <b>Used in</b>
                        {e.usedIn}
                      </div>
                    )}
                    {e.content && (
                      <div>
                        <b>Content</b>
                        {e.content}
                      </div>
                    )}
                    {e.responsive && (
                      <div className="is-resp">
                        <b>Responsive</b>
                        {e.responsive}
                      </div>
                    )}
                  </div>
                  {e.refs && (
                    <div className="ds-refs">
                      {e.refs.map((r) => (
                        <a key={r} href={`#${r}`} className="ds-ref-chip">
                          {nameOf.get(r) || r}
                        </a>
                      ))}
                    </div>
                  )}
                  {e.embed && (
                    <Preview
                      id={e.id}
                      height={e.height}
                      dark={e.stage === "dark"}
                      pageHref={e.pageHref}
                    />
                  )}
                </div>
              ))}
            </section>
          ))}

          {/* ── all pages ── */}
          <section className="ds-level" id="pages">
            <div className="ds-level-head">
              <h2>Pages</h2>
              <p>
                All {pages.length} generated routes, grouped by template. Each
                is a data file rendered through the templates above — the CMS
                boundary.
              </p>
            </div>
            {Object.entries(
              pages.reduce<Record<string, typeof pages>>((acc, p) => {
                (acc[p.template] ||= []).push(p);
                return acc;
              }, {})
            ).map(([tpl, list]) => (
              <div className="ds-sub" key={tpl}>
                <h4>
                  {TEMPLATE_LABELS[tpl] || tpl}{" "}
                  <span style={{ color: "#999", fontWeight: 400 }}>
                    × {list.length}
                  </span>
                </h4>
                <div className="ds-pages-grid">
                  {list.map((p) => (
                    <a key={p.slug} className="ds-page-chip" href={`/${p.slug}`}>
                      /{p.slug}
                      <small>{p.title}</small>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Foundations block ──────────────────────────────────────── */

function Foundations() {
  return (
    <>
      <div className="ds-sub">
        <h4>Colour</h4>
        <p>CSS custom properties in :root — every component reads these.</p>
        <div className="ds-swatches">
          {COLORS.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </div>
      </div>

      <div className="ds-sub">
        <h4>Typography</h4>
        <p>
          Inter SemiBold for headings (tight negative tracking), Maison Neue
          Book for body. Local woff2 in public/assets/fonts.
        </p>
        <table className="ds-table ds-type-sample">
          <thead>
            <tr>
              <th>Element</th>
              <th>Size / line-height</th>
              <th>Tracking</th>
              <th>Usage</th>
              <th>Sample</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_SCALE.map((t) => (
              <tr key={t.el}>
                <td>{t.el}</td>
                <td>{t.size}</td>
                <td>{t.tracking}</td>
                <td>{t.use}</td>
                <td>
                  {t.el === "p" ? (
                    <span style={{ fontSize: 15 }}>
                      The quick brown fox jumps over the lazy dog
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize: `min(${parseInt(t.size)}px, 28px)`,
                        letterSpacing: t.tracking,
                      }}
                    >
                      Humblebee
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ds-sub">
        <h4>Layout &amp; spacing</h4>
        <p>
          <code>.padding-global</code> = 5vw side gutters ·{" "}
          <code>.container-large</code> = max 1680px · section padding 120px
          (large) / 80px (medium). <code>.container-story</code> is the narrow
          article measure.
        </p>
      </div>

      <div className="ds-sub">
        <h4>Breakpoints</h4>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Viewport</th>
              <th>Name</th>
              <th>What changes</th>
            </tr>
          </thead>
          <tbody>
            {BREAKPOINTS.map((b) => (
              <tr key={b.bp}>
                <td>{b.bp}</td>
                <td>{b.label}</td>
                <td>{b.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ds-sub">
        <h4>Interaction patterns</h4>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Behaviour</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>link fade-group</td><td>Hovering a sibling dims the rest (nav links, footer links)</td></tr>
            <tr><td>row flood</td><td>Program rows fill yellow; arrow circle turns blue</td></tr>
            <tr><td>email pill</td><td>Hover reveals address → click copies + check icon</td></tr>
            <tr><td>marquee</td><td>Hero image strip loops via CSS animation</td></tr>
            <tr><td>scroll pin</td><td>Challenges pins &amp; scrubs pills (GSAP ScrollTrigger, ≥768px)</td></tr>
            <tr><td>word reveal</td><td>Statement text colours word-by-word on scroll</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
