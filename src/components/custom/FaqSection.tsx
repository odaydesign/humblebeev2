export default function FaqSection({ section }: { section: any }) {
  return (
    <section className="faq">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            <h2 className="faq-heading" data-hb-f="heading">{section.heading}</h2>
            <div className="faq-items">
              {(section.items ?? []).map((it: any, i: number) => (
                <details key={i} className="faq-item">
                  <summary className="faq-q" data-hb-f={`items.${i}.q`}>{it.q}</summary>
                  <p className="faq-a" data-hb-f={`items.${i}.a`}>{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
