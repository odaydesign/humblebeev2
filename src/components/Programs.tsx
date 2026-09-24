import type { ProgramsSection } from "@/lib/content";
import { ArrowIcon, ArrowIconWhite } from "./ArrowIcon";

export function Programs({ section }: { section: ProgramsSection }) {
  return (
    <section className="programs-section">
      <div className="padding-section-large">
        <div className="padding-global">
          <div className="container-large">
            <div className="programs-wrap">
              <div className="programs-header">
                <h2 data-hb-f="heading">{section.heading}</h2>
                <div data-hb-f="subheading">{section.subheading}</div>
                <div>
                  <a href={section.cta.href} className="btn-pill" data-hb-link="cta">
                    <span data-hb-f="cta.label">{section.cta.label}</span>
                    <ArrowIconWhite />
                  </a>
                </div>
              </div>
              <div className="programs-list">
                {section.programs.map((program, i) => (
                  <a href={program.href} className="programs-item" key={program.title} data-hb-link={`programs.${i}`}>
                    <div className="programs-item-info">
                      <h5 className="programs-item-title" data-hb-f={`programs.${i}.title`}>{program.title}</h5>
                      <div className="programs-item-subtitle" data-hb-f={`programs.${i}.subtitle`}>{program.subtitle}</div>
                    </div>
                    <div className="programs-item-btn">
                      <ArrowIcon />
                    </div>
                  </a>
                ))}
                <a href={section.allLink.href} className="btn-ghost programs-all" data-hb-link="allLink">
                  <span data-hb-f="allLink.label">{section.allLink.label}</span>
                  <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
