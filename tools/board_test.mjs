import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/studio", { waitUntil: "networkidle2" });
await new Promise(r => setTimeout(r, 7000));
await p.evaluate(() => [...document.querySelectorAll("button")].find(e => e.textContent?.trim() === "Board")?.click());
await p.waitForSelector(".st-bcard", { timeout: 15000 });
await new Promise(r => setTimeout(r, 700));
// find a card actually inside the viewport
const box = await p.evaluate(() => {
  for (const c of document.querySelectorAll(".st-bcard")) {
    const r = c.getBoundingClientRect();
    if (r.top > 60 && r.top < 850 && r.left > 280 && r.left < 1400)
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, slug: c.querySelector("code")?.textContent };
  }
  return null;
});
console.log("hovering", JSON.stringify(box));
await p.mouse.move(box.x, box.y, { steps: 6 });
await new Promise(r => setTimeout(r, 400));
const lit = await p.evaluate(() => ({
  lit: [...document.querySelectorAll(".st-bedg")].filter(e => !e.classList.contains("dim")).length,
  total: document.querySelectorAll(".st-bedg").length,
}));
console.log("EDGES:", JSON.stringify(lit));
await p.screenshot({ path: "/tmp/board12.png" });
await b.close();
