export default function TestimonialsSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : [];
  return (
    <section className="testimonials">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            {section.heading && (
              <h2 className="testimonials-heading" data-hb-f="heading">
                {section.heading}
              </h2>
            )}
            {items.length > 0 && (
              <ul className="testimonials-grid">
                {items.map((item: any, i: number) => (
                  <li className="testimonials-card" key={i}>
                    <figure className="testimonials-figure">
                      <blockquote
                        className="testimonials-quote"
                        data-hb-f={`items.${i}.quote`}
                      >
                        {item.quote}
                      </blockquote>
                      <figcaption className="testimonials-author">
                        <span
                          className="testimonials-name"
                          data-hb-f={`items.${i}.name`}
                        >
                          {item.name}
                        </span>
                        <span
                          className="testimonials-role"
                          data-hb-f={`items.${i}.role`}
                        >
                          {item.role}
                        </span>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
