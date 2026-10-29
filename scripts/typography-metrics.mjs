#!/usr/bin/env node
// Typography meter for the browser: what the user actually SEES, as numbers.
//
//   node scripts/typography-metrics.mjs snap --base http://localhost:3204 --out docs/typography-snapshots/before.json
//   node scripts/typography-metrics.mjs diff docs/typography-snapshots/before.json docs/typography-snapshots/after.json [--page /san-pham]
//
// snap: for every page x viewport in typography-pages.json, records the computed font-size / weight /
//       line-height / letter-spacing and rendered height of every text-bearing element, the heading
//       outline (tag + text) and the full page height.
// diff: matches elements by tag + text, groups style changes ("14px/400/20px -> 14px/400/21px: 12 elements"),
//       and reports heading-outline changes and page-height drift. Exit 1 if --strict and anything moved.
//
// Needs a running site (and its Go API). Playwright is only used here, not for ordinary checks.
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { diffSnapshots, isClean, keyItems } from "./typography-metrics-core.mjs";

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);

async function collect(page) {
  return page.evaluate(() => {
    const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "TEMPLATE", "HEAD", "META", "LINK"]);
    const items = [];
    const headings = [];
    const walk = (el) => {
      if (SKIP.has(el.tagName.toUpperCase())) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.replace(/\s+/g, " ").trim())
        .join(" ")
        .trim();
      if (own && el.getClientRects().length) {
        const r = el.getBoundingClientRect();
        items.push({
          tag: el.tagName.toLowerCase(),
          text: own.slice(0, 50),
          fs: cs.fontSize,
          fw: cs.fontWeight,
          lh: cs.lineHeight,
          ls: cs.letterSpacing,
          h: Math.round(r.height * 10) / 10,
        });
      }
      if (/^H[1-6]$/.test(el.tagName) && el.getClientRects().length) {
        headings.push({ tag: el.tagName.toLowerCase(), text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 80) });
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return { height: document.documentElement.scrollHeight, headings, items };
  });
}

async function snap() {
  const base = opt("--base", "http://localhost:3001").replace(/\/$/, "");
  const out = opt("--out");
  if (!out) throw new Error("--out is required");
  const cfg = JSON.parse(readFileSync(new URL("./typography-pages.json", import.meta.url), "utf8"));
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const result = { meta: { base, takenAt: new Date().toISOString(), viewports: cfg.viewports }, pages: {} };
  for (const width of cfg.viewports) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    for (const path of cfg.pages) {
      const res = await page.goto(base + path, { waitUntil: "networkidle", timeout: 120000 }).catch((e) => ({ status: () => `ERR ${e.message}` }));
      await page.waitForTimeout(400);
      const data = await collect(page);
      data.items = keyItems(data.items);
      data.status = res.status();
      result.pages[`${path}@${width}`] = data;
      console.log(`${width}px ${path} -> ${data.status}, ${data.items.length} text elements, ${data.headings.length} headings, h=${data.height}`);
    }
    await ctx.close();
  }
  await browser.close();
  writeFileSync(out, JSON.stringify(result));
  console.log(`wrote ${out}`);
}

function diff() {
  const [fa, fb] = args.slice(1, 3);
  const a = JSON.parse(readFileSync(fa, "utf8"));
  const b = JSON.parse(readFileSync(fb, "utf8"));
  const res = diffSnapshots(a, b, opt("--page"));
  let dirty = 0;
  for (const [key, d] of Object.entries(res)) {
    if (d.missing) {
      console.log(`${key}: MISSING in second snapshot`);
      dirty++;
      continue;
    }
    if (isClean(d)) continue;
    dirty++;
    console.log(`\n${key}  matched=${d.matched} changed=${d.changed} removed=${d.removed} added=${d.added}  pageHeight ${d.pageHeightDelta >= 0 ? "+" : ""}${d.pageHeightDelta}px`);
    if (!d.headingsSame) {
      console.log(`  headings: h1 ${d.h1Before} -> ${d.h1After}`);
      console.log(`    before: ${d.headingsBefore.join(" | ")}`);
      console.log(`    after:  ${d.headingsAfter.join(" | ")}`);
    }
    for (const [t, n] of d.transitions.slice(0, 8)) console.log(`  ${n.toString().padStart(4)}  ${t}`);
  }
  console.log(`\n${Object.keys(res).length - dirty}/${Object.keys(res).length} page-viewports unchanged`);
  if (args.includes("--strict") && dirty) process.exit(1);
}

if (cmd === "snap") await snap();
else if (cmd === "diff") diff();
else {
  console.error("usage: typography-metrics.mjs snap --base URL --out FILE | diff A.json B.json [--page /x] [--strict]");
  process.exit(2);
}
