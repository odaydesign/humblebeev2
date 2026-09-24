import { footerContent, homeSections, navContent, type Section } from "@/lib/content";
import { getPublished, getMenuConfig } from "@/lib/store";
import { SiteHeader } from "@/components/menu/site-header";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionRenderer } from "@/components/SectionRenderer";

export const revalidate = 30;

async function sections(): Promise<Section[]> {
  const doc = await getPublished("__home");
  return doc?.data && "sections" in doc.data
    ? (doc.data as { sections: Section[] }).sections
    : homeSections;
}

export default async function HomePage() {
  const [secs, menu] = await Promise.all([sections(), getMenuConfig()]);
  return (
    <>
      <SiteHeader
        links={menu.links}
        cases={menu.cases}
        footnote={menu.footnote}
        city={menu.city}
        cta={{ label: menu.ctaLabel, href: menu.ctaHref }}
      />
      <main>
        {secs.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </main>
      <SiteFooter content={footerContent} nav={navContent} />
    </>
  );
}
