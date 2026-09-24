import type { Collections } from "@/lib/pages";

export function ProgramsIndexPage({
  data,
}: {
  data: Collections["programs"];
}) {
  return (
    <div className="main-wrapper">
      <section className="section_content">
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-xlarge">
              <div className="margin-bottom margin-xxlarge">
                <div className="max-width-large">
                  <h1 className="heading-88">{data.heading}</h1>
                </div>
                <div className="max-width-medium">
                  <h4 className="heading-74 text-align-left">{data.subheading}</h4>
                </div>
              </div>
              <div className="programs-wrap">
                <div className="programs-list">
                  {data.items.map((p) => (
                    <a
                      key={p.href}
                      href={p.href}
                      className="programs-item w-inline-block"
                    >
                      <div className="programs-item-info">
                        <h5 className="programs-item-title">{p.title}</h5>
                        <div className="programs-item-subtitle">{p.subtitle}</div>
                      </div>
                      <div className="programs-item-btn">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M13.8462 17.6538L12.7923 16.5693L16.6115 12.75H4.5V11.25H16.6115L12.7923 7.43075L13.8462 6.34625L19.5 12L13.8462 17.6538Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    </a>
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
