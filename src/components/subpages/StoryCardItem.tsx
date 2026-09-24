import type { StoryCard } from "@/lib/pages";

/** Story card used on the stories index ("index" -> h5.heading-21) and
 *  in "More stories" lists ("more" -> h4). */
export function StoryCardItem({
  card,
  variant = "index",
}: {
  card: StoryCard;
  variant?: "index" | "more";
}) {
  const Title = variant === "index" ? "h5" : "h4";
  return (
    <div role="listitem" className="teamitems w-dyn-item">
      <a href={card.href} className="work_image-wrapper w-inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={card.alt} loading="lazy" src={card.image} className="work_image" />
      </a>
      <div>
        <div className="margin-bottom margin-xxsmall">
          <a href={card.href} className="link-heading w-inline-block">
            <Title className={variant === "index" ? "heading-21" : undefined}>
              {card.title}
            </Title>
          </a>
        </div>
        <div className="margin-bottom margin-xsmall">
          <div className={variant === "index" ? "text-block-9" : undefined}>
            {card.excerpt}
          </div>
        </div>
        {card.authorName && (
          <div className="author_wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={card.authorName}
              loading="lazy"
              src={card.authorImage}
              className="author-img"
            />
            <div className="author_info">
              <div className="author_name">{card.authorName}</div>
              {card.authorDate && (
                <div className="author_date">{card.authorDate}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
