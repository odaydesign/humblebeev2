import type { TwoColumnsSection } from "@/lib/content";

export function TwoColumns({ section }: { section: TwoColumnsSection }) {
  return (
    <section className="two-columns">
      <div className="two-columns-pad">
        <div className="container-large">
          <div className="padding-section-large">
            <h2 className="two-columns-heading" data-hb-f="heading">{section.heading}</h2>
            <div className="two-columns-component">
              <div className="two-columns-image-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={section.image.src} alt={section.image.alt} loading="lazy" data-hb-img="image" />
              </div>
              <div className="two-columns-content-col">
                <h4 data-hb-f="body" data-hb-multi>{section.body}</h4>
                <a href={section.cta.href} className="btn-blue" data-hb-link="cta">
                  <div className="btn-blue-label" data-hb-f="cta.label">{section.cta.label}</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
