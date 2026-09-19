// Usage: node scripts/shot.mjs <url> <out.png> [clickSelector] [width] [height]
import puppeteer from "puppeteer-core";
const [url, out, click, w = "1440", h = "900"] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
await page.setViewport({ width: Number(w), height: Number(h) });
await page.goto(url, { waitUntil: "networkidle0" });
await page.waitForSelector(".card", { timeout: 20000 });
if (click) { await page.click(click); await new Promise((r) => setTimeout(r, 900)); }
await page.screenshot({ path: out });
await browser.close();
console.log("saved", out);
