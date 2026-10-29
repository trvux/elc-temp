#!/usr/bin/env node
// Automated a11y sweep (axe-core, WCAG 2.1 A/AA + best practice) over the public routes, desktop + mobile.
//
//   node scripts/a11y-axe.mjs --base http://localhost:3304 [--routes /,/san-pham] [--strict]
//
// Needs a running site (and its Go API) and Playwright browsers. Prefer a production build (`next start`)
// so dev overlays do not add noise. Exit 1 with --strict if any rule other than color-contrast is violated
// (colour is tracked separately, not part of the typography/structure work).
// Not covered: admin (needs login), states behind interaction (open dialogs/menus), real screen readers.
import { chromium } from "playwright-core";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const base = opt("--base", "http://localhost:3000").replace(/\/$/, "");
const DEFAULT = ["/", "/san-pham", "/san-pham/may-lanh", "/san-pham/daikin", "/dich-vu", "/du-an", "/du-an/biet-thu", "/tin-tuc", "/thong-tin", "/thong-tin/van-phong", "/gioi-thieu-ve-dien-may-elc", "/chinh-sach-bao-hanh-san-pham", "/yeu-thich", "/login", "/login/verify?email=a@b.c", "/form", "/trang-khong-ton-tai"];
const routes = opt("--routes", "") ? opt("--routes").split(",") : DEFAULT;
const axePath = createRequire(import.meta.url).resolve("axe-core");

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const byRule = {};
for (const [vp, w, h] of [["desktop", 1280, 900], ["mobile", 390, 800]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" })).newPage();
  for (const r of routes) {
    try {
      await page.goto(base + r, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(800);
      await page.addScriptTag({ path: axePath });
      const res = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
      for (const v of res.violations) {
        const o = (byRule[v.id] ??= { impact: v.impact, where: new Set(), nodes: 0, sample: "" });
        o.where.add(`${r}@${vp}`);
        o.nodes += v.nodes.length;
        o.sample ||= `${v.nodes[0].target.join(" ").slice(0, 60)} | ${v.nodes[0].html.replace(/\s+/g, " ").slice(0, 80)}`;
      }
    } catch (e) {
      (byRule.ERROR ??= { impact: "-", where: new Set(), nodes: 0, sample: String(e).slice(0, 80) }).where.add(`${r}@${vp}`);
    }
  }
}
await browser.close();
console.log(`${routes.length * 2} page-viewports checked, ${Object.keys(byRule).length} rule(s) violated`);
for (const [id, o] of Object.entries(byRule).sort((a, b) => b[1].nodes - a[1].nodes))
  console.log(`${id.padEnd(30)} ${String(o.impact).padEnd(9)} pages=${String(o.where.size).padStart(2)} nodes=${String(o.nodes).padStart(3)}  e.g. ${o.sample}`);
if (args.includes("--strict") && Object.keys(byRule).some((k) => k !== "color-contrast")) process.exit(1);
