/**
 * Site menu config — the `__menu` special doc in cms_pages.
 * data: MenuConfig — edited in Studio (Menu pin), rendered by SiteHeader.
 * Falls back to defaultMenu until the doc is first published.
 */

export interface MenuLink {
  label: string;
  href: string;
}

export interface MenuCase {
  title: string;
  blurb: string;
  href: string;
  img: string;
}

export interface MenuConfig {
  links: MenuLink[];
  cases: MenuCase[];
  footnote: string;
  city: string;
  ctaLabel: string;
  ctaHref: string;
}

export const defaultMenu: MenuConfig = {
  links: [
    { label: "Programs", href: "/programs" },
    { label: "Work", href: "/work" },
    { label: "CoVentures", href: "/programs/coventures-program" },
    { label: "Stories", href: "/stories" },
    { label: "About", href: "/about-us" },
    { label: "Careers", href: "/careers" },
  ],
  cases: [
    {
      title: "Justr",
      blurb: "Heavy machinery, light interface",
      href: "/work/justr",
      img: "/gallery/justr-app.png",
    },
    {
      title: "Polestar",
      blurb: "Configurator & in-car experience",
      href: "/work/polestar-hmi",
      img: "/gallery/polestar-interior.png",
    },
    {
      title: "Weld control",
      blurb: "Industrial UI for the shop floor",
      href: "/work",
      img: "/gallery/welding-ui.png",
    },
  ],
  footnote: "Service & product design studio",
  city: "Gothenburg",
  ctaLabel: "Start a project",
  ctaHref: "/contact",
};

export const menuDoc = () => ({
  slug: "__menu",
  title: "Menu",
  desc: "",
  template: "menu",
  data: defaultMenu,
});
