import Image from "next/image";

export default function PeopleSection({ section }: { section: any }) {
  const people = section.people ?? [];

  return (
    <section className="people">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            {section.heading ? (
              <h2 className="people-heading" data-hb-f="heading">
                {section.heading}
              </h2>
            ) : null}
            <ul className="people-grid">
              {people.map((person: any, i: number) => (
                <li className="people-card" key={i}>
                  {person.image?.src ? (
                    <figure className="people-figure">
                      <Image
                        className="people-image"
                        src={person.image.src}
                        alt={person.image.alt ?? person.name ?? ""}
                        width={640}
                        height={640}
                        data-hb-img={`people.${i}.image`}
                      />
                    </figure>
                  ) : null}
                  <div className="people-copy">
                    <h3 className="people-name" data-hb-f={`people.${i}.name`}>
                      {person.name}
                    </h3>
                    <p className="people-role" data-hb-f={`people.${i}.role`}>
                      {person.role}
                    </p>
                    <p className="people-bio" data-hb-f={`people.${i}.bio`}>
                      {person.bio}
                    </p>
                    {person.email ? (
                      <a
                        className="people-email"
                        href={`mailto:${person.email}`}
                        data-hb-link={`people.${i}.email`}
                      >
                        {person.email}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
