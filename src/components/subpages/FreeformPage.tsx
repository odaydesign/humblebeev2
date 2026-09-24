import type { FreeformData } from "@/lib/pages";
import { SectionRenderer } from "../SectionRenderer";

/** Canvas-built page — an ordered list of typed sections, same model the
 *  homepage uses. This is what the Studio's page builder produces. */
export function FreeformPage({ data }: { data: FreeformData }) {
  return (
    <>
      {data.sections.map((s, i) => (
        <SectionRenderer key={i} section={s} />
      ))}
    </>
  );
}
