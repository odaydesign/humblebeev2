import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "public", "uploads");
const MAX = 8 * 1024 * 1024; // 8MB base64 payload

const safe = (name: string) =>
  name
    .replace(/\.[^.]+$/, (ext) => ext.toLowerCase())
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "") || "file";

/** POST {name, data:"data:...;base64,..."} → {path:"/uploads/x"} — dev-server storage. */
export async function POST(req: NextRequest) {
  const { name, data } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || typeof data !== "string" || !data.startsWith("data:"))
    return Response.json({ error: "name + dataURL required" }, { status: 400 });
  const comma = data.indexOf(",");
  const b64 = data.slice(comma + 1);
  if (b64.length > MAX) return Response.json({ error: "file too large (max ~6MB)" }, { status: 413 });

  await fs.mkdir(DIR, { recursive: true });
  let file = safe(name);
  const ext = path.extname(file);
  const stem = file.slice(0, file.length - ext.length);
  for (let i = 1; await fs.stat(path.join(DIR, file)).then(() => true, () => false); i++)
    file = `${stem}-${i}${ext}`;

  await fs.writeFile(path.join(DIR, file), Buffer.from(b64, "base64"));
  return Response.json({ ok: true, path: `/uploads/${file}`, name: file });
}
