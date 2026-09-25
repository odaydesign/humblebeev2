import type { Section } from "@/lib/content";
import { Hero } from "./hero/hero";
import { Challenges } from "./Challenges";
import { StrategyMoves } from "./StrategyMoves";
import { Programs } from "./Programs";
import { Statement } from "./Statement";
import { TwoColumns } from "./TwoColumns";
import { Hire } from "./Hire";
import { FeatureBanner } from "./FeatureBanner";
import { GalleryMarquee } from "./gallery/gallery-marquee";
import type { GalleryMarqueeItem } from "./gallery/gallery-marquee";
import { RichText } from "./subpages/RichText";
import { CustomSectionRenderer } from "./CustomSection";

/**
 * Maps a content section to its component — the registry a CMS-driven
 * page builder would use to compose pages from ordered section data.
 */
export function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} />;
    case "challenges":
      return <Challenges section={section} />;
    case "strategyMoves":
      return <StrategyMoves section={section} />;
    case "programs":
      return <Programs section={section} />;
    case "statement":
      return <Statement section={section} />;
    case "twoColumns":
      return <TwoColumns section={section} />;
    case "hire":
      return <Hire section={section} />;
    case "featureBanner":
      return <FeatureBanner section={section} />;
    case "gallery":
      return (
        <GalleryMarquee
          speed={Number(section.speed) || undefined}
          items={section.items.map((it): GalleryMarqueeItem => {
            if (it.kind !== "portfolio") return it;
            const raw = (it as { tags?: unknown }).tags;
            const tags =
              typeof raw === "string"
                ? raw.split(",").map((t) => t.trim()).filter(Boolean)
                : Array.isArray(raw)
                  ? raw
                  : undefined;
            return { ...it, tags };
          })}
        />
      );
    case "richText":
      return (
        <section>
          <div className="padding-global">
            <div className="container-large">
              <div className="padding-section-medium">
                <RichText html={section.html} hbPath="html" />
              </div>
            </div>
          </div>
        </section>
      );
    default:
      return <CustomSectionRenderer section={section} />;
  }
}
