/**
 * Inspector schemas for the structured (non-canvas) page templates.
 * Same Field model as section-schemas — the Inspector renders these
 * against `doc.data` (or the doc itself for legacy pages, collections).
 */
import type { Field } from "./section-schemas";

const T = (k: string, l: string): Field => ({ k, l, t: "text" });
const TA = (k: string, l: string): Field => ({ k, l, t: "textarea" });
const IMG = (k: string, l: string): Field => ({ k, l, t: "image" });
const HREF = (k: string, l: string): Field => ({ k, l, t: "href" });
const LIST = (k: string, l: string, item: string, fields: Field[]): Field => ({
  k, l, t: "list", item, fields,
});
const GROUP = (k: string, l: string, fields: Field[]): Field => ({
  k, l, t: "group", fields,
});
const STRINGLIST = (k: string, l: string, item: string): Field =>
  LIST(k, l, item, [{ k: "", l: "", t: "text" }]);

export const TEMPLATE_SCHEMAS: Record<string, { name: string; fields: Field[] }> = {
  program: {
    name: "Program",
    fields: [
      T("eyebrow", "Eyebrow"),
      T("title", "Title"),
      TA("subtitle", "Subtitle"),
      IMG("image", "Hero image"),
      T("imageAlt", "Hero alt"),
      T("outcomeHeading", "Outcomes heading"),
      STRINGLIST("outcomes", "Outcomes", "outcome"),
      TA("statement", "Statement"),
      T("featuresHeading", "Features heading"),
      TA("featuresIntro", "Features intro"),
      LIST("features", "Features", "feature", [T("title", "Title"), TA("body", "Body")]),
      T("forYouHeading", "For-you heading"),
      STRINGLIST("forYou", "For-you items", "item"),
      T("opportunitiesHeading", "Opportunities heading"),
      TA("opportunitiesIntro", "Opportunities intro"),
      LIST("opportunities", "Opportunities", "opportunity", [T("title", "Title"), TA("body", "Body")]),
      GROUP("cta", "CTA banner", [
        T("heading", "Heading"),
        TA("body", "Body"),
        T("btnLabel", "Button label"),
        HREF("btnHref", "Button link"),
        IMG("image", "Image"),
      ]),
    ],
  },
  case: {
    name: "Case study",
    fields: [
      T("title", "Title"),
      TA("overview", "Overview"),
      HREF("siteLink", "Client site URL"),
      T("siteLinkLabel", "Site link label"),
      LIST("meta", "Meta rows", "row", [T("label", "Label"), T("value", "Value")]),
      TA("bodyHtml", "Body (HTML)"),
      T("ctaHeading", "CTA heading"),
      GROUP("contact", "Contact", [
        IMG("image", "Photo"),
        T("name", "Name"),
        { k: "email", l: "Email", t: "email" },
        T("phone", "Phone"),
      ]),
      GROUP("coffeeBanner", "Coffee banner", [
        T("heading", "Heading"),
        TA("body", "Body"),
        T("btnLabel", "Button label"),
        HREF("btnHref", "Button link"),
        IMG("image", "Image"),
      ]),
    ],
  },
  story: {
    name: "Story",
    fields: [
      T("title", "Title"),
      TA("subtitle", "Subtitle"),
      GROUP("author", "Author", [
        IMG("image", "Photo"),
        T("name", "Name"),
        T("date", "Date"),
      ]),
      IMG("heroImage", "Hero image"),
      T("heroAlt", "Hero alt"),
      TA("bodyHtml", "Body (HTML)"),
      GROUP("writtenBy", "Written by", [
        IMG("image", "Photo"),
        T("name", "Name"),
        { k: "email", l: "Email", t: "email" },
      ]),
      LIST("related", "Related stories", "story", [{ k: "", l: "", t: "href" }]),
    ],
  },
  legacy: {
    name: "Legacy page",
    fields: [
      T("desc", "Meta description"),
      TA("html", "Body HTML"),
      TA("css", "Page CSS"),
    ],
  },
  /** Site menu — the __menu doc. Edited like any structured template. */
  menu: {
    name: "Menu",
    fields: [
      LIST("links", "Nav links", "link", [T("label", "Label"), HREF("href", "Link")]),
      LIST("cases", "Featured cases", "case", [
        IMG("img", "Image"),
        T("title", "Title"),
        T("blurb", "Blurb"),
        HREF("href", "Link"),
      ]),
      T("footnote", "Footnote"),
      T("city", "City"),
      T("ctaLabel", "CTA label"),
      HREF("ctaHref", "CTA link"),
    ],
  },
};

/** The shared collections doc — edited as one pseudo-page. */
export const COLLECTIONS_SCHEMA: { name: string; fields: Field[] } = {
  name: "Collections",
  fields: [
    LIST("stories.items", "Story cards", "card", [
      HREF("href", "Link"),
      IMG("image", "Image"),
      T("alt", "Alt"),
      T("title", "Title"),
      TA("excerpt", "Excerpt"),
      IMG("authorImage", "Author photo"),
      T("authorName", "Author"),
      T("authorDate", "Date"),
    ]),
    LIST("stories.categories", "Categories", "category", [
      T("name", "Name"),
      LIST("hrefs", "Story links", "link", [{ k: "", l: "", t: "href" }]),
    ]),
    GROUP("work.featured", "Featured work card", [
      HREF("href", "Link"),
      IMG("image", "Image"),
      T("client", "Client"),
      T("title", "Title"),
      TA("excerpt", "Excerpt"),
    ]),
    LIST("work.items", "Work cards", "card", [
      HREF("href", "Link"),
      IMG("image", "Image"),
      T("client", "Client"),
      T("title", "Title"),
      TA("excerpt", "Excerpt"),
    ]),
    GROUP("programs", "Programs index", [
      T("heading", "Heading"),
      T("subheading", "Subheading"),
      LIST("items", "Rows", "row", [
        HREF("href", "Link"),
        T("title", "Title"),
        T("subtitle", "Subtitle"),
      ]),
    ]),
  ],
};
