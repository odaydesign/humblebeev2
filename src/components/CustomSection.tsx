import type { CustomSection } from "@/lib/content";
import { CUSTOM_SECTIONS } from "./custom";

/**
 * Fallback renderer for agent-built sections — resolves `custom:*` types
 * through the generated registry in ./custom/index.ts. Missing components
 * render a visible notice instead of silently disappearing, so a broken
 * registration is obvious on canvas and on live pages.
 */
export function CustomSectionRenderer({ section }: { section: CustomSection }) {
  const C = CUSTOM_SECTIONS[section.type];
  if (!C) {
    return (
      <section className="custom-missing">
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-medium">
              <p>
                Unregistered section <code>{section.type}</code> — the
                component file or registry entry is missing.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return <C section={section} />;
}
