import type { StoryData, StoryCard } from "@/lib/pages";
import { BackButton } from "./BackButton";
import { RichText } from "./RichText";
import { StoryCardItem } from "./StoryCardItem";

export function StoryPage({
  data,
  allStories,
}: {
  data: StoryData;
  allStories: StoryCard[];
}) {
  const byHref = new Map(allStories.map((s) => [s.href, s]));
  const related = (data.related || [])
    .map((h) => byHref.get(h))
    .filter((c): c is StoryCard => Boolean(c))
    .slice(0, 3);
  return (
    <div className="main-wrapper">
      <section>
        <div className="padding-global">
          <div className="container-story">
            <div className="padding-section-xlarge">
              <div className="padding-section-story">
                <div className="margin-bottom margin-story">
                  <BackButton href="/stories" label="Back to Stories" />
                </div>
                <div className="margin-bottom margin-xsmall">
                  <h1 className="story-h1" data-hb-f="title">{data.title}</h1>
                </div>
                {data.subtitle && <h5 data-hb-f="subtitle" data-hb-multi>{data.subtitle}</h5>}
                {data.author && (
                  <div className="margin-bottom margin-large">
                    <div className="author_wrapper">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        loading="lazy"
                        src={data.author.image}
                        alt={data.author.name}
                        className="author-img"
                        data-hb-img="author.image"
                      />
                      <div className="author_info">
                        <div className="author_name" data-hb-f="author.name">{data.author.name}</div>
                        <div className="author_date" data-hb-f="author.date">{data.author.date}</div>
                      </div>
                    </div>
                  </div>
                )}
                {data.heroImage && (
                  <div className="margin-bottom margin-large">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      alt={data.heroAlt || data.title}
                      src={data.heroImage}
                      data-hb-img="heroImage"
                    />
                  </div>
                )}
                <RichText html={data.bodyHtml} className="story-text" hbPath="bodyHtml" />
                <div className="story-social">
                  <a
                    className="social-link w-inline-block"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      "https://www.humblebee.se"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                  >
                    <LinkedInIcon />
                  </a>
                  <a
                    className="social-link w-inline-block"
                    href="https://www.facebook.com/sharer/sharer.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                  >
                    <FacebookIcon />
                  </a>
                </div>
                {data.writtenBy && data.writtenBy.name && (
                  <div className="author_wrapper is-story">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={data.writtenBy.name}
                      loading="lazy"
                      src={data.writtenBy.image}
                      className="author-img-story"
                    />
                    <div className="author_info">
                      <div className="author_date">Written by</div>
                      <div data-hb-f="writtenBy.name">{data.writtenBy.name}</div>
                      {data.writtenBy.email && (
                        <a
                          href={`mailto:${data.writtenBy.email}`}
                          className="text-color-purple"
                          data-hb-f="writtenBy.email"
                        >
                          {data.writtenBy.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {related.length > 0 && (
            <div className="container-large is-more">
              <h4>More stories</h4>
              <div className="blog_component is-more w-dyn-list">
                <div role="list" className="blog_list w-dyn-items">
                  {related.map((c) => (
                    <StoryCardItem key={c.href} card={c} variant="more" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg width="41" height="40" viewBox="0 0 41 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20.3335" cy="20" r="19.5" stroke="currentColor" fill="none" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.1082 10.2839C15.1082 11.529 14.1602 12.5366 12.6776 12.5366C11.2529 12.5366 10.3048 11.529 10.3342 10.2839C10.3048 8.97828 11.2528 8 12.7061 8C14.1602 8 15.0798 8.97828 15.1082 10.2839ZM10.4534 28.8191V14.3162H14.9606V28.8181H10.4534V28.8191Z"
        fill="#6C6E74"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.5738 18.9446C18.5738 17.1357 18.5142 15.5935 18.4546 14.3182H22.3696L22.5777 16.305H22.6666C23.2598 15.3854 24.7424 13.9927 27.1446 13.9927C30.1097 13.9927 32.334 15.9502 32.334 20.219V28.821H27.8267V20.7838C27.8267 18.9144 27.1748 17.6399 25.5437 17.6399C24.2977 17.6399 23.5569 18.4999 23.2608 19.3297C23.1416 19.6268 23.0829 20.0412 23.0829 20.4574V28.821H18.5756V18.9446H18.5738Z"
        fill="#6C6E74"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="41" height="40" viewBox="0 0 41 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20.3335" cy="20" r="19.5" stroke="currentColor" fill="none" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.6485 12.9578C25.0252 12.8331 24.1833 12.74 23.6539 12.74C22.2202 12.74 22.1271 13.3633 22.1271 14.3607V16.1361H25.7109L25.3985 19.8137H22.1271V31H17.6398V19.8137H15.3335V16.1361H17.6398V13.8613C17.6398 10.7453 19.1043 9 22.7812 9C24.0587 9 24.9937 9.187 26.2088 9.43633L25.6485 12.9578Z"
        fill="#6C6E74"
      />
    </svg>
  );
}
