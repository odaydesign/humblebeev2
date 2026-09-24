import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IMAGES = path.join(process.cwd(), "public/assets/images");
const EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

export async function GET() {
  const files = fs
    .readdirSync(IMAGES)
    .filter((f) => EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => "/assets/images/" + f);
  return NextResponse.json({ images: files });
}
