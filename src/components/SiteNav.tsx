"use client";

import { useState } from "react";
import type { NavContent } from "@/lib/content";
import { EmailCopyButton } from "./EmailCopyButton";
import { StoryArrowIcon } from "./ArrowIcon";

export function SiteNav({ content }: { content: NavContent }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="nav-wrapper">
      <div className={`nav-overlay ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="nav-overlay-inner">
          <div className="nav-overlay-left">
            <div className="nav-links-large">
              {content.largeLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  className="nav-link-large"
                  onClick={() => setOpen(false)}
                >
                  <div className="nav-link-large-font">{link.label}</div>
                </a>
              ))}
            </div>
            <div className="nav-links-small">
              <EmailCopyButton
                email={content.email}
                label={content.emailLabel}
                copiedLabel={content.emailCopiedLabel}
                className="nav-link-small"
              />
              {content.smallLinks.map((link) => (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  className="nav-link-small"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="nav-overlay-right">
            {content.stories.map((story) => (
              <a
                key={story.href}
                href={story.href}
                className="nav-story-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.thumb.src} alt={story.thumb.alt} className="nav-story-thumb" loading="lazy" />
                <div className="nav-story-info">
                  <div className="nav-story-meta">
                    <div className="nav-story-label">{story.label}</div>
                    <StoryArrowIcon />
                  </div>
                  <div className="nav-story-title">{story.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <nav className={`nav-pill ${open ? "is-open" : ""}`}>
        <button
          className="nav-menu-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className="nav-menu-label">{content.menuLabel}</span>
          <span className="nav-close-label">{content.closeLabel}</span>
        </button>
        <div className="nav-brand">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.logo.src} alt={content.logo.alt} />
          </a>
        </div>
        <a href={content.contactHref} className="nav-contact-btn" aria-label="Contact">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content.contactIcon.src} alt={content.contactIcon.alt} />
        </a>
      </nav>
    </div>
  );
}
