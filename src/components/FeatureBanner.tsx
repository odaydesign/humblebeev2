import type { FeatureBannerSection } from "@/lib/content";
import { ArrowIconWhite } from "./ArrowIcon";

export function FeatureBanner({ section }: { section: FeatureBannerSection }) {
  return (
    <section className="background-color-grey">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-large">
            <div className="feature-banner-component">
              <div className="feature-banner-image-wrap">
                <h2 data-hb-f="eyebrow">{section.eyebrow}</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.image.src}
                  alt={section.image.alt}
                  loading="eager"
                  className="feature-banner-image"
                  data-hb-img="image"
                />
              </div>
              <div className="feature-banner-content">
                <h4 data-hb-f="heading">{section.heading}</h4>
                <p data-hb-f="body" data-hb-multi>{section.body}</p>
                <div className="feature-banner-ctas">
                  <a
                    href={section.cta.href}
                    className="btn-pill"
                    data-hb-link="cta"
                    {...(section.cta.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <span data-hb-f="cta.label">{section.cta.label}</span>
                    <ArrowIconWhite />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
