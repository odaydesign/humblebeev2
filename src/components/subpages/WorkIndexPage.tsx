import type { Collections } from "@/lib/pages";

export function WorkIndexPage({ data }: { data: Collections["work"] }) {
  const f = data.featured;
  return (
    <div className="main-wrapper">
      <section>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-xlarge">
              <h1>Work</h1>
            </div>
            <div className="w-dyn-list">
              <div role="list" className="w-dyn-items">
                <div role="listitem" className="w-dyn-item">
                  <div className="w-layout-grid header_component">
                    <a
                      href={f.href}
                      className="work_image-wrapper is-top w-inline-block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="eager"
                        alt={f.alt}
                        src={f.image}
                        className="work_image"
                      />
                    </a>
                    <div className="header_content">
                      <div className="header_content-wrapper">
                        <div className="margin-bottom margin-xsmall">
                          <div className="margin-bottom margin-xsmall">
                            <div>{f.client}</div>
                          </div>
                          <a href={f.href} className="link-heading-white w-inline-block">
                            <h3>{f.title}</h3>
                          </a>
                        </div>
                        <p>{f.excerpt}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section_work">
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-large">
              <div className="w-dyn-list">
                <div role="list" className="work_list w-dyn-items">
                  {data.items.map((w) => (
                    <div key={w.href} role="listitem" className="work_item w-dyn-item">
                      <a href={w.href} className="work_image-wrapper w-inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={w.alt}
                          loading="lazy"
                          src={w.image}
                          className="work_image"
                        />
                      </a>
                      <div>
                        <div className="margin-bottom margin-xxsmall">
                          <div className="text-block-13">{w.client}</div>
                        </div>
                        <div className="margin-bottom margin-xsmall">
                          <a href={w.href} className="link-heading-white w-inline-block">
                            <h4 className="heading-19">{w.title}</h4>
                          </a>
                        </div>
                        <p className="paragraph-9">{w.excerpt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
