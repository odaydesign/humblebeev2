/**
 * HBStudio agent — OpenRouter-backed tool loop that drives the CMS.
 *
 * The model gets tools mapped 1:1 onto the store layer (list/get/create/
 * update/discard) plus meta-tools (component schemas, skill guides, asset
 * list). Publish and delete never execute inside the loop — they return
 * "pending confirmation" and the UI asks the user to approve, then calls
 * /api/agent/action which executes via executeConfirmed().
 *
 * Rules the agent must follow live in agent/skills/*.md — injectable via
 * the read_guide tool; the system prompt carries the index + hard rules.
 */
import fs from "fs";
import path from "path";
import {
  listPages, getDoc, saveDraft, publish, discardDraft, deletePage,
} from "./store";
import { db, dbEnabled } from "./db";
import { SECTION_SCHEMAS, SCHEMA_BY_TYPE, setPath, getPath } from "./section-schemas";
import { TEMPLATE_SCHEMAS } from "./template-schemas";

const SKILLS_DIR = path.join(process.cwd(), "agent/skills");
const IMAGES_DIR = path.join(process.cwd(), "public/assets/images");
const CUSTOM_DIR = path.join(process.cwd(), "src/components/custom");
const CUSTOM_CSS_FILE = path.join(process.cwd(), "src/app/custom.css");
const CUSTOM_REGISTRY_FILE = path.join(process.cwd(), "src/lib/custom-sections.json");

/* ── custom component machinery ───────────────────────────── */

interface CustomReg {
  type: `custom:${string}`;
  component: string;
  name: string;
  icon: string;
  blurb: string;
  unique?: boolean;
  fields: any[];
  skeleton: Record<string, any>;
}

function readRegistry(): CustomReg[] {
  try {
    return JSON.parse(fs.readFileSync(CUSTOM_REGISTRY_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeRegistry(list: CustomReg[]) {
  fs.writeFileSync(CUSTOM_REGISTRY_FILE, JSON.stringify(list, null, 2) + "\n");
  regenCustomIndex(list);
}

/** Rewrites src/components/custom/index.ts so SectionRenderer resolves
 *  every registered custom type. Only registry-listed components are
 *  exposed — stray files never render. */
function regenCustomIndex(list: CustomReg[]) {
  const imports = list
    .map((c) => `import ${c.component} from "./${c.component}";`)
    .join("\n");
  const entries = list.map((c) => `  ${JSON.stringify(c.type)}: ${c.component},`).join("\n");
  fs.writeFileSync(
    path.join(CUSTOM_DIR, "index.ts"),
    `/* GENERATED — rewritten by the agent tooling (src/lib/agent.ts
 * regenCustomIndex) whenever a custom component is created or removed.
 * Do not edit by hand. Maps section.type → component for
 * CustomSectionRenderer. */
import type { ComponentType } from "react";
${imports}

export const CUSTOM_SECTIONS: Record<string, ComponentType<{ section: any }>> = {
${entries}
};
`
  );
}

const FORBIDDEN_IMPORT_RE = /from\s+["']([^"']+)["']/g;
const DENY_IMPORTS = new Set([
  "fs", "path", "os", "child_process", "http", "https", "net", "crypto",
  "node:fs", "node:path", "node:os", "node:child_process", "node:http",
  "node:https", "node:net", "node:crypto", "process",
]);

function validateComponentCode(name: string, code: string): string | null {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) return "name must be PascalCase (e.g. FaqSection)";
  if (!code.includes("export default")) return "component must have a default export";
  if (/<script/i.test(code)) return "<script> tags are not allowed";
  if (/import\s*\(/.test(code)) return "dynamic import() is not allowed";
  for (const m of code.matchAll(FORBIDDEN_IMPORT_RE)) {
    const spec = m[1];
    const ok =
      spec === "react" ||
      spec.startsWith("next/") ||
      spec.startsWith("@/") ||
      spec.startsWith("./");
    if (!ok || DENY_IMPORTS.has(spec)) return `forbidden import: ${spec}`;
  }
  return null;
}

/** Replaces (or removes, css=null) the delimited block for a slug in
 *  custom.css. Block markers: `/* ▸ slug *\/` … `/* ◂ slug *\/`. */
function replaceCssBlock(slug: string, css: string | null) {
  const file = fs.readFileSync(CUSTOM_CSS_FILE, "utf8");
  const re = new RegExp(`\\/\\* ▸ ${slug} \\*\\/[\\s\\S]*?\\/\\* ◂ ${slug} \\*\\/\\n?`);
  const block = css == null ? "" : `/* ▸ ${slug} */\n${css.trim()}\n/* ◂ ${slug} */\n`;
  const next = re.test(file)
    ? file.replace(re, block)
    : file.trimEnd() + "\n\n" + block;
  fs.writeFileSync(CUSTOM_CSS_FILE, next);
}

function removeComponentArtifacts(type: string) {
  const reg = readRegistry().filter((c) => c.type !== type);
  const entry = readRegistry().find((c) => c.type === type);
  if (entry) {
    const f = path.join(CUSTOM_DIR, `${entry.component}.tsx`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  writeRegistry(reg);
  replaceCssBlock(type.replace(/^custom:/, ""), null);
}

/* ── OpenRouter ───────────────────────────────────────────── */

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

async function chat(model: string, messages: any[], tools: any[]) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set in .env.local");
  const r = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://humblebee.local/studio",
      "X-Title": "HBStudio CMS Agent",
    },
    body: JSON.stringify({ model, messages, tools, tool_choice: "auto" }),
  });
  if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return j.choices?.[0]?.message;
}

/* ── path ops ─────────────────────────────────────────────── */

function applyOps(doc: any, ops: { op: string; path: string; value?: any }[]) {
  let out = doc;
  for (const o of ops) {
    if (o.op === "set") out = setPath(out, o.path, o.value);
    else if (o.op === "append") {
      const arr = getPath(out, o.path);
      if (!Array.isArray(arr)) throw new Error(`${o.path} is not a list`);
      out = setPath(out, o.path, [...arr, o.value]);
    } else if (o.op === "remove") {
      const keys = o.path.split(".");
      const last = keys.pop()!;
      const parent = getPath(out, keys.join(".")) ?? out;
      if (Array.isArray(parent)) {
        const next = [...parent];
        next.splice(Number(last), 1);
        out = setPath(out, keys.join("."), next);
      } else {
        const next = { ...parent };
        delete next[last];
        out = keys.length ? setPath(out, keys.join("."), next) : next;
      }
    }
  }
  return out;
}

/* ── collections draft view (mirrors /api/cms/collections) ── */

async function collectionsEditingView() {
  if (dbEnabled) {
    const row = await db.get("__collections");
    if (row) return row.draft ?? row.published;
  }
  return getDoc("__collections");
}

async function saveCollectionsDraft(data: any) {
  if (dbEnabled) {
    await db.upsert({
      slug: "__collections",
      title: "Collections",
      template: "collections",
      draft: data,
      updated_at: new Date().toISOString(),
    });
    return;
  }
  await saveDraft("__collections", data);
}

/* ── tools ────────────────────────────────────────────────── */

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_pages",
      description: "List every page in the CMS: slug, title, template, hasDraft. Slugs are URL paths without leading slash.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_page",
      description: "Read a page's full draft document (or published if no draft). Use slug '__home' for the homepage, '__collections' for shared card data.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_page",
      description: "Create a new page as a DRAFT (not live until published). freeform pages take data.sections[]; other templates take their data object.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "lowercase-hyphen path, e.g. 'stories/my-post'" },
          title: { type: "string" },
          template: { type: "string", enum: ["freeform", "program", "case", "story", "legacy"] },
          desc: { type: "string", description: "SEO meta description" },
          data: { type: "object", description: "Template payload — sections[] for freeform" },
          html: { type: "string", description: "legacy template only" },
          css: { type: "string", description: "legacy template only" },
        },
        required: ["slug", "title", "template"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_page",
      description: "Apply dot-path ops to a page's draft. Paths are relative to doc root, e.g. 'title', 'data.sections.0.heading'. Ops: set, append (to list), remove.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          ops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                op: { type: "string", enum: ["set", "append", "remove"] },
                path: { type: "string" },
                value: {},
              },
              required: ["op", "path"],
            },
          },
        },
        required: ["slug", "ops"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_collections",
      description: "Apply dot-path ops to the shared collections doc (index-page cards). Paths like 'stories.items.0.title'.",
      parameters: {
        type: "object",
        properties: {
          ops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                op: { type: "string", enum: ["set", "append", "remove"] },
                path: { type: "string" },
                value: {},
              },
              required: ["op", "path"],
            },
          },
        },
        required: ["ops"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_page",
      description: "Publish a page's draft to the live site. ALWAYS requires user approval — calling it shows the user an Approve button; the publish happens only if they click it.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "discard_draft",
      description: "Throw away a page's unpublished draft, restoring the published version.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_page",
      description: "Permanently delete a page (draft + published). Requires user approval in the UI.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_assets",
      description: "List image files available under /assets/images (optionally filtered by a substring).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_component_schema",
      description: "Get a canvas section type's fields, rules and a starter skeleton. Types: " + SECTION_SCHEMAS.map((s) => s.type).join(", ") + ".",
      parameters: {
        type: "object",
        properties: { type: { type: "string" } },
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_template_schema",
      description: "Get a structured template's editable field map (program|case|story|legacy|collections).",
      parameters: {
        type: "object",
        properties: { template: { type: "string" } },
        required: ["template"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_guide",
      description: "Read a rule/design guide. Available: design-rules, components, page-authoring, publishing, collections, component-development. Read BEFORE your first write in a session if unsure of conventions.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_custom_components",
      description: "List agent-built components: registered custom:* section types, their component files, and whether each is registered/has CSS.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_component",
      description:
        "Write a NEW custom section component file (src/components/custom/{name}.tsx). Read guide 'component-development' first — it defines the mandatory contract (props shape, data-hb-* bindings, allowed imports). 'name' is PascalCase incl. the Section suffix (e.g. FaqSection). 'code' is the complete file.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          code: { type: "string" },
        },
        required: ["name", "code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_component",
      description: "Rewrite an EXISTING custom component file (same contract/validation as create_component). For iterating on feedback.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          code: { type: "string" },
        },
        required: ["name", "code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_component_css",
      description:
        "Write/replace a component's CSS block in src/app/custom.css. 'slug' is the section slug without prefix (e.g. 'faq' for custom:faq). Every selector must use the .{slug}-* class prefix; use design tokens (--ink/--blue/--grey/--line/--dark-grey/--orange/--yellow) and include ≤991px and ≤479px breakpoints.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          css: { type: "string" },
        },
        required: ["slug", "css"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_section",
      description:
        "Register a custom section so it appears in the palette, inspector, canvas and design system. 'type' is a lowercase-hyphen slug WITHOUT the custom: prefix (e.g. 'faq'). 'component' must be a file already created via create_component. 'fields' is the inspector schema (same Field shape as get_component_schema output). 'skeleton' is the full default section object with real, finished default content (type is set automatically).",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string" },
          component: { type: "string" },
          name: { type: "string" },
          icon: { type: "string", description: "single glyph, e.g. '▤'" },
          blurb: { type: "string" },
          unique: { type: "boolean" },
          fields: { type: "array", items: { type: "object" } },
          skeleton: { type: "object" },
        },
        required: ["type", "component", "name", "fields", "skeleton"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_component",
      description: "Remove a custom component: deletes its file, CSS block and registration. REQUIRES user confirmation — returns a pending action.",
      parameters: {
        type: "object",
        properties: { type: { type: "string", description: "section type, e.g. custom:faq" } },
        required: ["type"],
      },
    },
  },
];

/* ── executor ─────────────────────────────────────────────── */

export interface PendingAction {
  id: string;
  op: "publish" | "delete" | "remove_component";
  slug: string;
  label: string;
}

export interface ActionLog {
  tool: string;
  summary: string;
}

const SLUG_RE = /^[a-z0-9][a-z0-9\-/]*$/;

export async function runTool(
  name: string,
  args: any,
  pending: PendingAction[],
  touched: Set<string>
): Promise<string> {
  switch (name) {
    case "list_pages": {
      const pages = await listPages();
      return JSON.stringify(
        pages.map((p) => ({ slug: p.slug, title: p.title, template: p.template, hasDraft: p.hasDraft }))
      );
    }
    case "get_page": {
      const doc = await getDoc(args.slug);
      return doc ? JSON.stringify(doc) : JSON.stringify({ error: `no page '${args.slug}'` });
    }
    case "create_page": {
      const slug = String(args.slug || "").replace(/^\/+|\/+$/g, "");
      if (!SLUG_RE.test(slug)) return JSON.stringify({ error: "invalid slug — lowercase, hyphens, slashes only" });
      if (await getDoc(slug)) return JSON.stringify({ error: `/${slug} already exists — use update_page` });
      const doc: any = {
        slug,
        title: args.title || slug,
        template: args.template || "freeform",
      };
      if (args.desc) doc.desc = args.desc;
      if (doc.template === "freeform") {
        const sections = args.data?.sections ?? [];
        for (const s of sections) {
          if (!SCHEMA_BY_TYPE.has(s.type))
            return JSON.stringify({ error: `unknown section type '${s.type}'` });
        }
        const heroes = sections.filter((s: any) => s.type === "hero");
        if (heroes.length > 1) return JSON.stringify({ error: "only one hero allowed" });
        doc.data = { sections };
      } else if (doc.template === "legacy") {
        doc.html = args.html ?? "";
        doc.css = args.css ?? "";
        doc.data = args.data ?? {};
      } else {
        doc.data = args.data ?? {};
      }
      await saveDraft(slug, doc);
      touched.add(slug);
      return JSON.stringify({ ok: true, slug, note: "created as draft — not live" });
    }
    case "update_page": {
      const doc = await getDoc(args.slug);
      if (!doc) return JSON.stringify({ error: `no page '${args.slug}'` });
      try {
        const next = applyOps(doc, args.ops ?? []);
        await saveDraft(args.slug, next);
        touched.add(args.slug);
        return JSON.stringify({ ok: true, applied: (args.ops ?? []).length });
      } catch (e: any) {
        return JSON.stringify({ error: e.message });
      }
    }
    case "update_collections": {
      const cur = await collectionsEditingView();
      try {
        const next = applyOps(cur, args.ops ?? []);
        await saveCollectionsDraft(next);
        touched.add("__collections");
        return JSON.stringify({ ok: true, applied: (args.ops ?? []).length });
      } catch (e: any) {
        return JSON.stringify({ error: e.message });
      }
    }
    case "publish_page": {
      const doc = await getDoc(args.slug);
      if (!doc) return JSON.stringify({ error: `no page '${args.slug}'` });
      const id = `pub-${args.slug}-${Date.now()}`;
      pending.push({
        id,
        op: "publish",
        slug: args.slug,
        label: args.slug === "__home" ? "Publish homepage" : args.slug === "__collections" ? "Publish collections" : `Publish /${args.slug}`,
      });
      return JSON.stringify({ ok: true, pendingConfirmation: id });
    }
    case "discard_draft": {
      await discardDraft(args.slug);
      touched.add(args.slug);
      return JSON.stringify({ ok: true });
    }
    case "delete_page": {
      if (!(await getDoc(args.slug))) return JSON.stringify({ error: `no page '${args.slug}'` });
      const id = `del-${args.slug}-${Date.now()}`;
      pending.push({ id, op: "delete", slug: args.slug, label: `Delete /${args.slug}` });
      return JSON.stringify({ ok: true, pendingConfirmation: id });
    }
    case "list_assets": {
      const q = (args.query ?? "").toLowerCase();
      const files = fs
        .readdirSync(IMAGES_DIR)
        .filter((f) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(f) && f.toLowerCase().includes(q))
        .map((f) => "/assets/images/" + f)
        .sort();
      return JSON.stringify(files.slice(0, 120));
    }
    case "get_component_schema": {
      const s = SCHEMA_BY_TYPE.get(args.type);
      if (!s) return JSON.stringify({ error: `unknown type '${args.type}'` });
      const { make, ...meta } = s;
      return JSON.stringify({ ...meta, skeleton: make() });
    }
    case "get_template_schema": {
      const s = TEMPLATE_SCHEMAS[args.template];
      return s ? JSON.stringify(s) : JSON.stringify({ error: `no schema for '${args.template}'` });
    }
    case "read_guide": {
      const f = path.join(SKILLS_DIR, path.basename(args.name) + ".md");
      if (!fs.existsSync(f)) return JSON.stringify({ error: "no such guide" });
      return fs.readFileSync(f, "utf8");
    }
    case "list_custom_components": {
      const reg = readRegistry();
      const files = fs.existsSync(CUSTOM_DIR)
        ? fs.readdirSync(CUSTOM_DIR).filter((f) => f.endsWith(".tsx"))
        : [];
      return JSON.stringify(
        reg.map((c) => ({
          type: c.type,
          name: c.name,
          component: c.component,
          fileExists: files.includes(`${c.component}.tsx`),
          fields: c.fields.length,
        }))
      );
    }
    case "create_component":
    case "update_component": {
      const err = validateComponentCode(args.name ?? "", args.code ?? "");
      if (err) return JSON.stringify({ error: err });
      const f = path.join(CUSTOM_DIR, `${args.name}.tsx`);
      if (name === "create_component" && fs.existsSync(f))
        return JSON.stringify({ error: `${args.name}.tsx exists — use update_component` });
      fs.writeFileSync(f, (args.code as string).trimEnd() + "\n");
      return JSON.stringify({ ok: true, file: `src/components/custom/${args.name}.tsx`, note: "call write_component_css and register_section next — it renders nothing until registered" });
    }
    case "write_component_css": {
      const slug = String(args.slug ?? "");
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
        return JSON.stringify({ error: "slug must be lowercase-hyphen, no prefix" });
      const css = String(args.css ?? "");
      if (!css.includes(`.${slug}`))
        return JSON.stringify({ error: `css must use the .${slug}-* class prefix` });
      const banned = [":root", "@import", "@font-face", "body{", "body {", "html{", "html {", "position: fixed"];
      const hit = banned.find((b) => css.includes(b));
      if (hit) return JSON.stringify({ error: `forbidden in component css: '${hit}'` });
      replaceCssBlock(slug, css);
      return JSON.stringify({ ok: true, file: "src/app/custom.css" });
    }
    case "register_section": {
      const slug = String(args.type ?? "");
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
        return JSON.stringify({ error: "type must be a lowercase-hyphen slug (no prefix)" });
      const type = `custom:${slug}` as const;
      if (SCHEMA_BY_TYPE.has(type) || SCHEMA_BY_TYPE.has(slug))
        return JSON.stringify({ error: `type '${type}' already registered` });
      const component = String(args.component ?? "");
      if (!fs.existsSync(path.join(CUSTOM_DIR, `${component}.tsx`)))
        return JSON.stringify({ error: `${component}.tsx missing — create_component first` });
      if (!Array.isArray(args.fields) || !args.fields.length)
        return JSON.stringify({ error: "fields must be a non-empty inspector schema array" });
      if (typeof args.skeleton !== "object" || args.skeleton == null)
        return JSON.stringify({ error: "skeleton must be the default section object" });
      const reg = readRegistry();
      const skeleton = { type, ...(args.skeleton as object) };
      reg.push({
        type,
        component,
        name: args.name || slug,
        icon: args.icon || "◆",
        blurb: args.blurb || "",
        unique: !!args.unique,
        fields: args.fields,
        skeleton,
      });
      writeRegistry(reg);
      return JSON.stringify({ ok: true, type, note: "registered — live in the palette, inspector and design system" });
    }
    case "remove_component": {
      const type = String(args.type ?? "");
      if (!readRegistry().some((c) => c.type === type))
        return JSON.stringify({ error: `no registered component '${type}'` });
      const id = `rm-${type}-${Date.now()}`;
      pending.push({ id, op: "remove_component", slug: type, label: `Remove component ${type}` });
      return JSON.stringify({ ok: true, pendingConfirmation: id });
    }
    default:
      return JSON.stringify({ error: `unknown tool ${name}` });
  }
}

/** Executes a user-approved publish/delete/component-removal from the UI. */
export async function executeConfirmed(op: "publish" | "delete" | "remove_component", slug: string) {
  if (op === "publish") await publish(slug);
  else if (op === "delete") await deletePage(slug);
  else removeComponentArtifacts(slug);
}

/* ── agent loop ───────────────────────────────────────────── */

const SYSTEM = `You are the HBStudio content agent — you run the Humblebee website's CMS.
You can create, edit and organise every page, and stage changes for publish.

HARD RULES (always apply, they override everything):
- All creates/edits are DRAFTS. Nothing is live until the user approves a
  publish_page call — never claim something is live before approval.
- Follow the design rules: read_guide('design-rules') before your first
  content write, and 'page-authoring' / 'components' / 'publishing' /
  'collections' when the task needs them. These are your contract.
- Always get_page before updating — work from the real current shape.
- Internal links are site-relative (/work/justr). Images come from
  list_assets, never invented filenames.
- Plain text in structured fields; HTML only in richText/legacy/html fields.
- Summarise changes briefly and concretely after acting. If you created or
  edited pages, name the slugs. Offer publish when the user seems done.
- If the user asks for something the tools can't do, say so plainly and
  propose the closest thing that works.

The site: Next.js clone of humblebee.se. Page docs are JSON; freeform pages
are data.sections[] built from a component catalog; other templates
(program, case, story, legacy, indexes) have fixed shapes — mirror existing
pages via get_page before creating them.

You can also BUILD new components when the catalog lacks what the user
needs: create_component + write_component_css + register_section make a
real section type (palette, inspector, canvas editing, design system).
Read guide 'component-development' FIRST whenever the task involves
creating or changing components — its contract is mandatory.`;

export interface AgentEvent {
  type: "tool_call" | "tool_result" | "done" | "error";
  name?: string;
  summary?: string;
  reply?: string;
  actions?: ActionLog[];
  confirmations?: PendingAction[];
  touched?: string[];
  error?: string;
}

export async function runAgent(
  opts: {
    messages: { role: string; content: string }[];
    model?: string;
    currentSlug?: string;
    /** section types the user pinned in the UI — inject their schemas */
    components?: string[];
    /** files attached to the latest message — text content inlined, uploads as paths */
    files?: { name: string; kind: "image" | "text" | "file"; path?: string; content?: string }[];
  },
  emit?: (e: AgentEvent) => void
): Promise<{ reply: string; actions: ActionLog[]; confirmations: PendingAction[]; touched: string[] }> {
  const model = opts.model || process.env.OPENROUTER_MODEL || "~deepseek/deepseek-flash-latest";
  const pending: PendingAction[] = [];
  const touched = new Set<string>();
  const actions: ActionLog[] = [];

  const msgs: any[] = [
    { role: "system", content: SYSTEM },
    ...(opts.currentSlug
      ? [{ role: "system", content: `The user is currently looking at page '${opts.currentSlug}' in the Studio canvas — assume requests like "this page" / "the title" refer to it.` }]
      : []),
    ...(opts.components?.length
      ? [{
          role: "system",
          content:
            `The user explicitly attached these components to their request — use exactly these section types (their schemas are below; do not invent fields). You may still call get_component_schema for anything else you genuinely need.\n` +
            opts.components
              .map((t) => {
                const s = SCHEMA_BY_TYPE.get(t);
                if (!s) return `- ${t} (unknown)`;
                return `- ${t} (${s.name}): ${s.blurb}\n  fields: ${JSON.stringify(s.fields)}\n  skeleton: ${JSON.stringify(s.make())}`;
              })
              .join("\n"),
        }]
      : []),
    ...(opts.files?.length
      ? [{
          role: "system",
          content:
            `The user attached files to their latest message.\n` +
            opts.files
              .map((f) => {
                if (f.kind === "text")
                  return `- ${f.name} (text file, contents below):\n\`\`\`\n${f.content}\n\`\`\``;
                if (f.kind === "image")
                  return `- ${f.name} (image, uploaded to ${f.path}) — usable directly in image fields (img, bgImage, item images). You cannot see the image; ask the user if you need to know what it depicts.`;
                return `- ${f.name} (file, uploaded to ${f.path}) — binary file, contents not readable; link or reference it if useful.`;
              })
              .join("\n"),
        }]
      : []),
    ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let round = 0; round < 10; round++) {
    const msg = await chat(model, msgs, TOOLS);
    if (!msg) throw new Error("empty response from model");
    msgs.push(msg);

    const calls = msg.tool_calls ?? [];
    if (!calls.length) {
      const out = { reply: msg.content ?? "", actions, confirmations: pending, touched: [...touched] };
      emit?.({ type: "done", ...out });
      return out;
    }
    for (const c of calls) {
      let args: any = {};
      try {
        args = JSON.parse(c.function.arguments || "{}");
      } catch {}
      emit?.({ type: "tool_call", name: c.function.name, summary: doing(c.function.name, args) });
      const result = await runTool(c.function.name, args, pending, touched);
      const summary = summarise(c.function.name, args, result);
      actions.push({ tool: c.function.name, summary });
      emit?.({ type: "tool_result", name: c.function.name, summary });
      msgs.push({ role: "tool", tool_call_id: c.id, content: result });
    }
  }
  const out = {
    reply: "I hit my step limit for this request — ask me to continue and I'll pick up where I left off.",
    actions,
    confirmations: pending,
    touched: [...touched],
  };
  emit?.({ type: "done", ...out });
  return out;
}

/** Live "what it's doing" label shown while a tool executes. */
function doing(tool: string, args: any): string {
  const s = args?.slug ? ` /${args.slug}` : "";
  const labels: Record<string, string> = {
    list_pages: "Listing pages",
    get_page: `Reading${s}`,
    create_page: `Creating${s}`,
    update_page: `Updating${s}`,
    update_collections: "Updating collections",
    publish_page: `Requesting publish${s}`,
    discard_draft: `Discarding draft${s}`,
    delete_page: `Requesting delete${s}`,
    list_assets: "Searching assets",
    get_component_schema: `Loading ${args?.type ?? ""} schema`,
    get_template_schema: `Loading ${args?.template ?? ""} template`,
    read_guide: `Reading ${args?.name ?? "guide"}`,
    list_custom_components: "Listing custom components",
    create_component: `Writing ${args?.name ?? "component"}`,
    update_component: `Rewriting ${args?.name ?? "component"}`,
    write_component_css: `Styling .${args?.slug ?? ""}-*`,
    register_section: `Registering ${args?.type ?? "section"}`,
    remove_component: `Requesting removal ${args?.type ?? ""}`,
  };
  return labels[tool] ?? tool;
}

function summarise(tool: string, args: any, result: string): string {
  try {
    const r = JSON.parse(result);
    if (r.error) return `${tool}: ${r.error}`;
  } catch {}
  switch (tool) {
    case "list_pages": return "Listed all pages";
    case "get_page": return `Read /${args.slug}`;
    case "create_page": return `Created draft /${args.slug}`;
    case "update_page": return `Updated /${args.slug} (${args.ops?.length ?? 0} ops)`;
    case "update_collections": return `Updated collections (${args.ops?.length ?? 0} ops)`;
    case "publish_page": return `Publish requested: /${args.slug} (awaiting approval)`;
    case "discard_draft": return `Discarded draft /${args.slug}`;
    case "delete_page": return `Delete requested: /${args.slug} (awaiting approval)`;
    case "list_assets": return `Searched assets${args.query ? ` "${args.query}"` : ""}`;
    case "get_component_schema": return `Loaded schema: ${args.type}`;
    case "get_template_schema": return `Loaded template: ${args.template}`;
    case "read_guide": return `Read guide: ${args.name}`;
    case "list_custom_components": return "Listed custom components";
    case "create_component": return `Wrote ${args.name}.tsx`;
    case "update_component": return `Rewrote ${args.name}.tsx`;
    case "write_component_css": return `Styled .${args.slug}-*`;
    case "register_section": return `Registered custom:${args.type}`;
    case "remove_component": return `Removal requested: ${args.type} (awaiting approval)`;
    default: return tool;
  }
}
