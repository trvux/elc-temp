#!/usr/bin/env node
// Renders the resting-pose PNG snapshot for each drag-to-rotate 3D icon
// (see docs/interactive-3d-icon-pattern.md) and writes it to
// public/images/3d-icons/<key>.png. Run this whenever a model in
// modules/inquiry/presentation/components/steps/three-models.js changes —
// the live <DragRotate3DCard> only mounts Three.js on drag, so the static
// image these produce is what every visitor who never drags actually sees.
//
// Usage: node scripts/render-3d-icon-snapshots.mjs
//
// Serves the project root over a throwaway local HTTP server rather than
// opening the harness via file:// — Chromium refuses to resolve ES module
// imports (import maps included) between file:// documents, since each
// file:// page is treated as an opaque/null origin.

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const outDir = path.join(root, "public/images/3d-icons");
mkdirSync(outDir, { recursive: true });

// The *card con* (model + title stacked) is 4:3 — but the model's own
// region within it isn't, since a fixed-height title row eats part of
// card con's height (see EntityPickerCard.tsx/BranchSelectStep.tsx). That
// leftover ratio isn't one fixed number either: it's now a *fixed 2-column
// grid at every breakpoint* (explicit user instruction — no responsive
// collapse to 1 column), so the model region's ratio varies more with
// viewport than it used to: measured ~1.55:1 at desktop (2-col, ~312px
// cards) vs ~1.79:1 at mobile (2-col, ~147px cards — the fixed-height
// title row eats a much bigger share of a much smaller card). No single
// value matches both exactly; ~1.7 splits the difference to minimize
// letterboxing at both ends rather than optimizing for one breakpoint.
// Rendered at 2x the largest card size we expect, downscaled by the
// <img>. Must match DragRotate3DCard's live aspect closely or the static
// snapshot and the live WebGL canvas visibly jump size/aspect at the
// mousedown handoff.
const WIDTH = 512;
const HEIGHT = 300;

const MIME = { ".js": "text/javascript", ".html": "text/html", ".glb": "model/gltf-binary" };

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  // Next.js serves everything under public/ at the site root (public/models/x
  // -> /models/x) — this throwaway server serves the raw repo root instead,
  // so /models/* needs the same public/-prefix remap or the Kenney glTF
  // assets referenced from three-models.js as "/models/kenney/*.glb" would
  // 404 here even though the identical path works fine in the real app.
  const filePath = urlPath.startsWith("/models/")
    ? path.join(root, "public", urlPath)
    : path.join(root, urlPath);
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end(); return; }
  try {
    statSync(filePath);
  } catch {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
  createReadStream(filePath).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const harnessHtml = `<!doctype html>
<html><body>
<script type="importmap">
{ "imports": { "three": "${base}/node_modules/three/build/three.module.js", "three/addons/": "${base}/node_modules/three/examples/jsm/" } }
</script>
<script type="module">
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MODEL_BUILDERS } from "${base}/modules/inquiry/presentation/components/steps/three-models.js";
import { buildSceneRig } from "${base}/modules/inquiry/presentation/components/steps/three-scene-rig.js";

window.__modelKeys = Object.keys(MODEL_BUILDERS);
window.renderModel = async (key) => {
  const { group, restY, restX } = await MODEL_BUILDERS[key](THREE, RoundedBoxGeometry, GLTFLoader);
  group.rotation.y = restY;
  group.rotation.x = restX;
  group.position.y = 0.05;
  const { scene, camera } = buildSceneRig(THREE, group, ${WIDTH} / ${HEIGHT});

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(${WIDTH}, ${HEIGHT});
  renderer.setPixelRatio(2);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL("image/png");
  renderer.dispose();
  return dataUrl;
};
window.__harnessReady = true;
</script>
</body></html>`;

const harnessPath = path.join(root, "tmp/render-3d-icon-harness.html");
mkdirSync(path.dirname(harnessPath), { recursive: true });
writeFileSync(harnessPath, harnessHtml);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.goto(`${base}/tmp/render-3d-icon-harness.html`);
await page.waitForFunction("window.__harnessReady === true", { timeout: 15000 });

// Read the key list from MODEL_BUILDERS itself (via the harness) instead
// of hardcoding it here — stays in sync automatically as models are added.
const keys = await page.evaluate(() => window.__modelKeys);
for (const key of keys) {
  const dataUrl = await page.evaluate((k) => window.renderModel(k), key);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const outPath = path.join(outDir, `${key}.png`);
  writeFileSync(outPath, Buffer.from(base64, "base64"));
  console.log("wrote", path.relative(root, outPath));
}

await browser.close();
server.close();
