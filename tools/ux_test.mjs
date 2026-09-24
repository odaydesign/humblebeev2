import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const p = await b.newPage();
await p.goto("http://localhost:3000/studio", { waitUntil: "networkidle2" });
await new Promise(r => setTimeout(r, 8000));
for (const w of [1100, 900, 768]) {
  await p.setViewport({ width: w, height: 800 });
  await new Promise(r => setTimeout(r, 600));
  const o = await p.evaluate((w) => {
    const top = document.querySelector(".st-top");
    const lastRight = top ? Math.max(...[...top.children].map(k => k.getBoundingClientRect().right)) : 0;
    const outRight = [...document.querySelectorAll(".st-top *, .st-left *")].filter(e => e.getBoundingClientRect().right > w - 2).length;
    return { w, scrollW: document.documentElement.scrollWidth, topRight: Math.round(lastRight), outRight };
  }, w);
  console.log(JSON.stringify(o));
  await p.screenshot({ path: `/tmp/ux${w}b.png` });
}
await b.close();
