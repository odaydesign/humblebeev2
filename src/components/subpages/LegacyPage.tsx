import Script from "next/script";

/** Renders a scraped page's main-wrapper markup with ported CSS.
 *  Used for one-off pages that don't share a structured template. */
export function LegacyPage({ html, css }: { html: string; css?: string }) {
  const needsTeamtailor = html.includes("teamtailor");
  const needsHubspotForm = html.includes("data-webflow-hubspot-api-form-url");
  const needsRecaptcha = html.includes("g-recaptcha");
  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {needsTeamtailor && (
        <Script
          src="https://scripts.teamtailor-cdn.com/widgets/eu-pink/jobs.js"
          strategy="afterInteractive"
        />
      )}
      {needsHubspotForm && (
        <Script
          src="https://hubspotonwebflow.com/assets/js/form-124.js"
          strategy="afterInteractive"
        />
      )}
      {needsRecaptcha && (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
      )}
    </>
  );
}
