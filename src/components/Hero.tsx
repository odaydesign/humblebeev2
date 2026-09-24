import type { HeroSection } from "@/lib/content";

export function Hero({ section }: { section: HeroSection }) {
  const track = [...section.marqueeImages, ...section.marqueeImages];

  return (
    <section className="hero">
      <div className="padding-global">
        <div className="container-large">
          <div className="hero-inner">
            <div className="hero-header">
              <h1 className="hero-heading" data-hb-f="heading">{section.heading}</h1>
              <h5 className="hero-subheading" data-hb-f="subheading">{section.subheading}</h5>
            </div>
            <div className="hero-strip" aria-hidden="true">
              <div className="hero-strip-track">
                {track.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.src}
                    alt={img.alt}
                    height={534}
                    loading={i < section.marqueeImages.length ? "eager" : "lazy"}
                    className="hero-strip-img"
                    data-hb-img={`marqueeImages.${i % section.marqueeImages.length}`}
                    style={img.width ? { width: img.width } : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="hero-logos-wrap">
          <div className="hero-logos">
            {section.clientLogos.map((logo, i) => (
              <div className="hero-logo-cell" key={logo.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} alt={logo.alt} loading="lazy" className="hero-logo-img" data-hb-img={`clientLogos.${i}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
