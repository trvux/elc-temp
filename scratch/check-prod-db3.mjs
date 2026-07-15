import { chromium } from "/Users/tranvux/Documents/elc-tem/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs";
import { writeFileSync } from "fs";

const BASE = "https://dienmayelc.com.vn";
const browser = await chromium.launch();
const page = await browser.newPage();

let counter = 0;
page.on("response", async (res) => {
  try {
    const req = res.request();
    if (req.method() !== "POST") return;
    const text = await res.text();
    counter++;
    writeFileSync(`/tmp/prodbody_${counter}.txt`, text);
  } catch (e) {
    console.error("capture err", e.message);
  }
});

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill("#identifier", "tranvux");
await page.fill("#password", "Vlu15112002@");
await page.click('button[type="submit"]');
await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });

await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
console.log("total bodies captured:", counter);

await browser.close();
