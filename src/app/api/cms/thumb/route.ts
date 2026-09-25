import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Page thumbnails for the site board — puppeteer screenshots cached to
 * public/thumbs/. GET ?slug=work/justr serves the cached PNG or generates
 * it (queued, one shared browser). POST {slug} forces a regenerate
 * (called after publish). 404 → the card shows a skeleton placeholder.
 */
const THUMB_DIR = path.join(process.cwd(), "public/thumbs");
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const fileFor = (slug: string) =>
  path.join(THUMB_DIR, slug.replace(/\//g, "__") + ".png");

let queue: Promise<void> = Promise.resolve();

async function shoot(slug: string) {
  const puppeteer = (await import("puppeteer-core")).default;
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "shell",
    args: ["--hide-scrollbars"],
  });
  try {
    const page = await browser.newPage();
    // Full desktop render @ 1.5x DPR — the board zooms ~4x on a 240px card,
    // so 2160×1350 keeps lines crisp instead of stretching a 480px raster.
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    const route = slug === "__home" ? "/" : `/${slug}`;
    await page.goto(`http://localhost:3000${route}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 900));
    await page.evaluate(() => {
      // strip the Next.js dev overlay from thumbnails
      document.querySelector("nextjs-portal")?.remove();
      document.getElementById("__next-build-watcher")?.remove();
    });
    fs.mkdirSync(THUMB_DIR, { recursive: true });
    await page.screenshot({ path: fileFor(slug) });
  } finally {
    await browser.close();
  }
}

function enqueue(slug: string): Promise<void> {
  queue = queue.then(() => shoot(slug)).catch(() => {});
  return queue;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const f = fileFor(slug);
  if (!fs.existsSync(f)) {
    if (!fs.existsSync(CHROME)) return new NextResponse(null, { status: 404 });
    try {
      await enqueue(slug);
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }
  if (!fs.existsSync(f)) return new NextResponse(null, { status: 404 });
  return new NextResponse(fs.readFileSync(f), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" },
  });
}

export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  if (typeof slug !== "string" || !slug)
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  if (!fs.existsSync(CHROME)) return NextResponse.json({ ok: false, reason: "no chrome" });
  enqueue(slug); // fire and forget — thumb refreshes in background
  return NextResponse.json({ ok: true });
}
