import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DIRS: [dir: string, urlPrefix: string][] = [
  ["public/assets/images", "/assets/images/"],
  ["public/gallery", "/gallery/"],
  ["public/uploads", "/uploads/"],
];
const EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

export async function GET() {
  const images = DIRS.flatMap(([dir, prefix]) => {
    const abs = path.join(process.cwd(), dir);
    if (!fs.existsSync(abs)) return [];
    return fs
      .readdirSync(abs)
      .filter((f) => EXTS.has(path.extname(f).toLowerCase()))
      .map((f) => prefix + f);
  }).sort();
  return NextResponse.json({ images });
}
