import type { ProgramData } from "@/lib/pages";

export function ProgramPage({ data }: { data: ProgramData }) {
  return (
    <div className="main-wrapper">
      <section className="section_content">
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-xlarge">
              <div className="program-intro">
                <div className="margin-bottom margin-xxlarge">
                  <div className="max-width-large">
                    <p className="text-size-20px text-color-gray text-weight-normal text-style-service" data-hb-f="eyebrow">
                      {data.eyebrow}
                    </p>
                    <h2 className="heading-style-h1" data-hb-f="title">{data.title}</h2>
                  </div>
                </div>
              </div>
              <div className="w-layout-grid header_component is-services">
                <div className="services-content is-left">
                  <div className="margin-bottom margin-xsmall">
                    <h3 data-hb-f="subtitle">{data.subtitle}</h3>
                  </div>
                </div>
                <div className="services_image-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    width={1215}
                    alt={data.imageAlt}
                    src={data.image}
                    className="services_image"
                    data-hb-img="image"
                  />
                </div>
              </div>
              <div className="padding-section-medium">
                <div className="program-outcome-blurb">
                  <div className="max-width-xsmall">
                    <h6 className="heading-99">Outcomes</h6>
                    <ul role="list" className="program-outcome-list">
                      {data.outcomes.map((o, i) => (
                        <li key={i} className={`list-item-${i + 2}`}>
                          <div className={`text-block-${i + 22}`} data-hb-f={`outcomes.${i}`}>{o}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="max-width-medium">
                    <h4 id="reveal" className="heading-100 text-align-left" data-hb-f="outcomeHeading">
                      {data.outcomeHeading}
                    </h4>
                  </div>
                </div>
                <div className="max-width-850">
                  <h3 className="heading-98 reveal-text" data-hb-f="statement" data-hb-multi>{data.statement}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-program-features">
        <div className="padding-global">
          <div className="container-large background-color-black">
            <div className="padding-section-large">
              <div className="content_component">
                <div className="margin-bottom margin-xxlarge">
                  <div className="max-width-large">
                    <h4 className="heading-93 text-align-left" data-hb-f="featuresHeading">
                      {data.featuresHeading}
                    </h4>
                    <div className="text-block-27" data-hb-f="featuresIntro" data-hb-multi>{data.featuresIntro}</div>
                  </div>
                </div>
                <div className="w-layout-grid program-features-grid">
                  {data.features.map((f, i) => (
                    <div key={i} className="program-features-card">
                      <p className="program-features-card-title" data-hb-f={`features.${i}.title`}>{f.title}</p>
                      <p className="program-features-card-copy" data-hb-f={`features.${i}.body`} data-hb-multi>{f.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-large">
              <div className="margin-bottom-8">
                <h4 className="text-align-left" data-hb-f="forYouHeading">{data.forYouHeading}</h4>
              </div>
              <div className="max-width-large">
                <ul role="list" className="service-list w-list-unstyled">
                  {data.forYou.map((item, i) => (
                    <li key={i} className="service-list-item" data-hb-f={`forYou.${i}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {data.opportunities.length > 0 && (
        <section>
          <div className="padding-global">
            <div className="container-large">
              <div className="padding-section-large">
                <h4 className="text-align-left" data-hb-f="opportunitiesHeading">{data.opportunitiesHeading}</h4>
                {data.opportunitiesIntro && <div data-hb-f="opportunitiesIntro" data-hb-multi>{data.opportunitiesIntro}</div>}
                <div className="impact-grid">
                  {data.opportunities.map((o, i) => (
                    <div key={i} className="impact-grid-card">
                      <h5 data-hb-f={`opportunities.${i}.title`}>{o.title}</h5>
                      <div data-hb-f={`opportunities.${i}.body`} data-hb-multi>{o.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {data.cta && (
        <section className="section background-color-yellow is-landing">
          <div className="padding-global">
            <div className="padding-section-medium">
              <div className="container-large is-columns">
                <div className="w-layout-grid header_component">
                  <div className="header_image-wrapper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      width={624}
                      alt=""
                      src={data.cta.image}
                      className="header_image"
                      data-hb-img="cta.image"
                    />
                  </div>
                  <div className="header_content">
                    <div className="header_content-wrapper is-landing">
                      <h3 data-hb-f="cta.heading">{data.cta.heading}</h3>
                      <p data-hb-f="cta.body" data-hb-multi>{data.cta.body}</p>
                      <div>
                        <a
                          href={data.cta.btnHref}
                          className="btn-blue w-inline-block"
                          data-hb-link="cta"
                        >
                          <div className="btn-blue-label" data-hb-f="cta.btnLabel">{data.cta.btnLabel}</div>
                        </a>
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
