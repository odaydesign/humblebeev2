import { notFound } from "next/navigation";
import { getEmbed, getEmbedIds } from "@/lib/design-system";
import { EmbedPing } from "../../EmbedPing";

export const dynamicParams = false;

export function generateStaticParams() {
  return getEmbedIds().map((id) => ({ id }));
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const render = getEmbed(id);
  if (!render) notFound();
  // <main> paints the page white + creates the stacking context, same as
  // real pages (body itself is --ink so the nav overlay blends seamlessly).
  return (
    <main>
      {render()}
      <EmbedPing id={id} />
    </main>
  );
}
