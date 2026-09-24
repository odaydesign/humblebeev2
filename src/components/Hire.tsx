import type { HireSection } from "@/lib/content";

export function Hire({ section }: { section: HireSection }) {
  return (
    <section>
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            <div className="hire-heading-wrap">
              <h2 data-hb-f="heading">{section.heading}</h2>
            </div>
            <div className="hire-cards-grid">
              {section.cards.map((card, i) => (
                <div className="hire-card" key={card.title}>
                  <div className="hire-card-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.image.src} alt={card.image.alt} loading="lazy" data-hb-img={`cards.${i}.image`} />
                  </div>
                  <div className="hire-card-text">
                    <h5 data-hb-f={`cards.${i}.title`}>{card.title}</h5>
                    <div data-hb-f={`cards.${i}.body`} data-hb-multi>{card.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hire-cta">
              <a href={section.cta.href} className="btn-blue" data-hb-link="cta">
                <div className="btn-blue-label" data-hb-f="cta.label">{section.cta.label}</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
