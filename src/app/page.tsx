import { footerContent, homeSections, navContent, type Section } from "@/lib/content";
import { getPublished } from "@/lib/store";
import { SiteNav } from "@/components/SiteNav";
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
  const secs = await sections();
  return (
    <>
      <SiteNav content={navContent} />
      <main>
        {secs.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </main>
      <SiteFooter content={footerContent} nav={navContent} />
    </>
  );
}
