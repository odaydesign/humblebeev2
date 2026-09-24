import type { StrategyMovesSection } from "@/lib/content";
import { ArrowIcon, ArrowIconWhite } from "./ArrowIcon";

export function StrategyMoves({ section }: { section: StrategyMovesSection }) {
  return (
    <section className="strategy-moves">
      <div className="padding-global">
        <div className="container-large">
          <h2 className="strategy-moves-heading" data-hb-f="heading">{section.heading}</h2>
          {section.cards.map((card, i) => (
            <div className="strategy-move-card" key={card.title}>
              <div className="strategy-move-card-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image.src} alt={card.image.alt} loading="lazy" data-hb-img={`cards.${i}.image`} />
              </div>
              <div className="strategy-move-card-content">
                <div className="strategy-move-card-info">
                  <h3 className="strategy-move-card-title" data-hb-f={`cards.${i}.title`}>{card.title}</h3>
                  <p className="strategy-move-card-body" data-hb-f={`cards.${i}.body`} data-hb-multi>{card.body}</p>
                </div>
                <div className="strategy-move-card-ctas">
                  <a href={card.primaryCta.href} className="btn-pill" data-hb-link={`cards.${i}.primaryCta`}>
                    <span data-hb-f={`cards.${i}.primaryCta.label`}>{card.primaryCta.label}</span>
                    <ArrowIconWhite />
                  </a>
                  <a
                    href={card.secondaryCta.href}
                    className="btn-ghost"
                    data-hb-link={`cards.${i}.secondaryCta`}
                    {...(card.secondaryCta.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <span data-hb-f={`cards.${i}.secondaryCta.label`}>{card.secondaryCta.label}</span>
                    <ArrowIcon />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
