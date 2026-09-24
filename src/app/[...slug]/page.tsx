import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { footerContent, navContent } from "@/lib/content";
import {
  type CaseData,
  type FreeformData,
  type ProgramData,
  type StoryData,
} from "@/lib/pages";
import { getPublished, getCollectionsStore, getMenuConfig, listPages } from "@/lib/store";
import { SiteHeader } from "@/components/menu/site-header";
import { SiteFooter } from "@/components/SiteFooter";
import { LegacyPage } from "@/components/subpages/LegacyPage";
import { ProgramPage } from "@/components/subpages/ProgramPage";
import { CasePage } from "@/components/subpages/CasePage";
import { StoryPage } from "@/components/subpages/StoryPage";
import { ProgramsIndexPage } from "@/components/subpages/ProgramsIndexPage";
import { WorkIndexPage } from "@/components/subpages/WorkIndexPage";
import { StoriesIndexPage } from "@/components/subpages/StoriesIndexPage";
import { FreeformPage } from "@/components/subpages/FreeformPage";

// Pages publish instantly — resolve unknown slugs on demand and revalidate.
export const dynamicParams = true;
export const revalidate = 30;

export async function generateStaticParams() {
  const pages = await listPages(false);
  return pages
    .filter((e) => !e.slug.startsWith("__"))
    .map((e) => ({ slug: e.slug.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublished(slug.join("/"));
  if (!page) return {};
  return { title: page.title || undefined, description: page.desc || undefined };
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = await getPublished(slug.join("/"));
  if (!page) notFound();

  const collections =
    page.template === "programsIndex" ||
    page.template === "workIndex" ||
    page.template === "storiesIndex" ||
    page.template === "story"
      ? await getCollectionsStore()
      : null;

  let content: React.ReactNode;
  switch (page.template) {
    case "program":
      content = <ProgramPage data={page.data as ProgramData} />;
      break;
    case "case":
      content = <CasePage data={page.data as CaseData} />;
      break;
    case "story":
      content = (
        <StoryPage
          data={page.data as StoryData}
          allStories={collections!.stories.items}
        />
      );
      break;
    case "programsIndex":
      content = <ProgramsIndexPage data={collections!.programs} />;
      break;
    case "workIndex":
      content = <WorkIndexPage data={collections!.work} />;
      break;
    case "storiesIndex":
      content = <StoriesIndexPage data={collections!.stories} />;
      break;
    case "freeform":
      content = <FreeformPage data={page.data as FreeformData} />;
      break;
    default:
      content = <LegacyPage html={page.html || ""} css={page.css} />;
  }

  const menu = await getMenuConfig();
  return (
    <>
      <SiteHeader
        links={menu.links}
        cases={menu.cases}
        footnote={menu.footnote}
        city={menu.city}
        cta={{ label: menu.ctaLabel, href: menu.ctaHref }}
      />
      <main>{content}</main>
      <SiteFooter content={footerContent} nav={navContent} />
    </>
  );
}
