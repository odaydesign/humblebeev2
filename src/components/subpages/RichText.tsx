export function RichText({
  html,
  className,
  hbPath,
}: {
  html: string;
  className?: string;
  /** Studio binding — marks this block as in-canvas HTML-editable. */
  hbPath?: string;
}) {
  return (
    <div
      className={className ? `${className} w-richtext` : "w-richtext"}
      {...(hbPath ? { "data-hb-html": hbPath } : {})}
      // Content extracted from the site's own Webflow CMS output
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
