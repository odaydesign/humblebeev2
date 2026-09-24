// usage: node tools/shoot.mjs <path> <outname> [scrollY] [width]
import puppeteer from "puppeteer-core";

const [route, name, scrollY = "0", width = "1440"] = process.argv.slice(2);
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width: +width, height: 900 });
await page.goto(`http://localhost:3000${route}`, {
  waitUntil: "networkidle0",
  timeout: 60000,
});
await new Promise((r) => setTimeout(r, 1200));
if (+scrollY) {
  await page.evaluate((y) => window.scrollTo(0, y), +scrollY);
  await new Promise((r) => setTimeout(r, 900));
}
await page.screenshot({ path: `/tmp/${name}.png` });
await browser.close();
console.log(`/tmp/${name}.png`);
