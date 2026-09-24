import type { FooterContent, NavContent } from "@/lib/content";
import { EmailCopyButton } from "./EmailCopyButton";

interface Props {
  content: FooterContent;
  nav: NavContent;
}

export function SiteFooter({ content, nav }: Props) {
  return (
    <section className="site-footer">
      <div className="padding-global">
        <div className="container-large">
          <div className="footer-nav">
            <div className="footer-links-large">
              {content.largeLinks.map((link) => (
                <a key={link.href + link.label} href={link.href} className="nav-link-large">
                  <div className="nav-link-large-font">{link.label}</div>
                </a>
              ))}
            </div>
            <div className="footer-links-small">
              <EmailCopyButton
                email={nav.email}
                label={nav.emailLabel}
                copiedLabel={nav.emailCopiedLabel}
                className="footer-link-small"
              />
              {content.smallLinks.map((link) => (
                <a key={link.href + link.label} href={link.href} className="footer-link-small">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="footer-bottom-row">
              <div className="footer-bottom-left">
                {content.bottomLeft.map((link) => (
                  <a key={link.label} href={link.href} className="footer-link-bottom">
                    <div className="footer-bottom-text">{link.label}</div>
                  </a>
                ))}
              </div>
              <div className="footer-bottom-right">
                {content.bottomRight.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="footer-link-bottom"
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <div className="footer-bottom-text">{link.label}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
