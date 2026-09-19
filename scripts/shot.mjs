// Usage: node scripts/shot.mjs <url> <out.png> [clickSelector] [width] [height]
import puppeteer from "puppeteer-core";
const [url, out, click, w = "1440", h = "900"] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
await page.setViewport({ width: Number(w), height: Number(h) });
await page.goto(url, { waitUntil: "networkidle0" });
if (click) { await page.waitForSelector(click, { timeout: 20000 }); await page.click(click); }
await page.waitForSelector(".card, .empty, .loading", { timeout: 20000 });
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: out });
await browser.close();
console.log("saved", out);
