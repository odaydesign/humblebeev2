import type { CaseData } from "@/lib/pages";
import { BackButton } from "./BackButton";
import { ArrowIcon } from "../ArrowIcon";
import { RichText } from "./RichText";

export function CasePage({ data }: { data: CaseData }) {
  return (
    <div className="main-wrapper">
      <section>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-xlarge">
              <div className="margin-bottom margin-medium">
                <BackButton href="/work" label="Back" />
              </div>
              <div className="margin-bottom margin-small">
                <div className="work-title">
                  <h1 className="heading-2" data-hb-f="title">{data.title}</h1>
                </div>
              </div>
              <div className="overview-component">
                <div className="overview-content">
                  <h5 className="heading-10">Overview</h5>
                  <p data-hb-f="overview" data-hb-multi>{data.overview}</p>
                  {data.siteLink && (
                    <div className="button-group">
                      <a
                        href={data.siteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button strategymoves-btn w-inline-block"
                      >
                        <div>{data.siteLinkLabel || "Visit the site"}</div>
                        <ArrowIcon />
                      </a>
                    </div>
                  )}
                </div>
                <div className="overview_list">
                  {data.meta.map((m, i) => (
                    <div key={i}>
                      <div className="overview-title" data-hb-f={`meta.${i}.label`}>{m.label}</div>
                      <div data-hb-f={`meta.${i}.value`}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <RichText html={data.bodyHtml} className="work-details padding-xlarge" hbPath="bodyHtml" />
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-cta">
              <div className="work-cta">
                {data.ctaHeading && (
                  <h4 className="text-align-left" data-hb-f="ctaHeading">{data.ctaHeading}</h4>
                )}
                {data.contact && (
                  <div className="work-contact">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      alt={data.contact.name}
                      src={data.contact.image}
                      className="contact-person-img"
                      data-hb-img="contact.image"
                    />
                    <div className="work-contact-info">
                      <h4 className="text-size-medium text-align-left" data-hb-f="contact.name">
                        {data.contact.name}
                      </h4>
                      {data.contact.email && (
                        <a href={`mailto:${data.contact.email}`} data-hb-f="contact.email">
                          {data.contact.email}
                        </a>
                      )}
                      {data.contact.phone && (
                        <a href={`tel:${data.contact.phone}`} data-hb-f="contact.phone">
                          {formatPhone(data.contact.phone)}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {data.coffeeBanner && (
        <section className="section_twocolumns text-color-black background-color-light-yellow">
          <div className="padding-global">
            <div className="container-large">
              <div className="padding-section-large">
                <div className="w-layout-grid twocolumns_component">
                  <div className="twocolumns_content-left">
                    <h2 data-hb-f="coffeeBanner.heading">{data.coffeeBanner.heading}</h2>
                  </div>
                  <div className="twocolumns_content-left">
                    <div className="resources-wrapper">
                      <div className="resource-block no-border">
                        <div className="margin-bottom margin-xsmall">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            loading="lazy"
                            alt=""
                            src={data.coffeeBanner.image}
                            data-hb-img="coffeeBanner.image"
                          />
                        </div>
                        <div className="margin-bottom margin-small">
                          <p className="text-color-black coffeecta_rightcopy" data-hb-f="coffeeBanner.body" data-hb-multi>
                            {data.coffeeBanner.body}
                          </p>
                          <div className="margin-top margin-small">
                            <div className="button-group">
                              <a
                                href={data.coffeeBanner.btnHref}
                                className="strategymoves-btn w-inline-block"
                                data-hb-link="coffeeBanner"
                              >
                                <div className="text-block-20" data-hb-f="coffeeBanner.btnLabel">
                                  {data.coffeeBanner.btnLabel}
                                </div>
                                <ArrowIcon />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function formatPhone(p: string) {
  // "0736483920" -> "0736 483 920"
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return p;
}
