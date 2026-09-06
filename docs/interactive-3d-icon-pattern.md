# Interactive 3D icon pattern (drag-to-rotate, gesture-gated)

**Status: REMOVED (2026-09-06).** The user asked to delete all 3D models
from `/form` and replace every picker card with a plain text button, like
the rest of the form (`ChoiceStep`). `DragRotate3DCard.tsx`,
`three-models.js`, `three-scene-rig.js`, `entity-icons.tsx`, the
`public/images/3d-icons/` snapshots, `public/models/kenney/` glTF assets,
`scripts/render-3d-icon-snapshots.mjs`, and the `three` dependency were all
deleted; `EntityPickerCard` and `BranchSelectStep` no longer take an
`icon`/`modelKey` prop. Kept below for historical reference only — nothing
in this doc reflects the current code anymore.

Status (historical, pre-removal):

- **Live and confirmed**: `BranchSelectStep` (the "Bạn đang cần gì hôm
  nay?" step, 3 cards: Mua sản phẩm / Dịch vụ / Dự án công trình) — user
  signed off on this step as finished.
- **Live, not yet explicitly confirmed**: `ProductCategoryPickerStep` (the
  "Bạn quan tâm dòng sản phẩm nào?" step, 12 category cards). All 12
  models exist in `three-models.js` and render correctly (verified via
  screenshot + the click/drag-guard tests below), wired through
  `EntityPickerCard`'s new `modelKey` prop — but this conversion happened
  in the same turn as this doc update, so treat "finished" as provisional
  until the user reacts, the way `BranchSelectStep` was provisional before
  its explicit sign-off.
- **Card structure and 4:3 ratio are now uniform across every card in the
  whole `/form` flow** (explicit user instruction — "layout này
  áp dụng mọi card"), regardless of whether that step has converted to 3D
  models yet: `BranchSelectStep` and every `EntityPickerCard` call site
  (product/service categories, service groups, project types, project
  categories — 5 steps) all share the wrapper → card con → separate-button
  structure and the 4:3 model/icon area. See "Embedding in a clickable
  card" and "Cards are 4:3, not square" below for what changed and why.
- **Live, not yet explicitly confirmed**: `ServiceGroupPickerStep` (the
  "Bạn cần nhóm dịch vụ nào?" step, 6 cards). All 6 are service actions,
  not physical products, so each got a metonymic object stand-in (see
  "Abstract concepts / actions have no shape" below) rather than a literal
  render — `install-kit`, `cleaning-spray`, `trade-in`, `clearance-tag`,
  `rental-clock`, `more-dots`. `getServiceGroupModelKey(slug)` mirrors
  `getServiceGroupIcon`'s own slug-matching branches exactly.
- **Live, not yet explicitly confirmed**: `ProjectTypePickerStep` (the
  "Loại công trình của bạn?" step, 13 cards), after 3 rounds of
  correction (self-audit, then two rounds of explicit user review). Since
  these are physical buildings (not service-group actions), each gets a
  literal building silhouette distinguished by one clear feature, except
  2 genuinely ambiguous venue types that stay symbolic. Two
  implementation approaches are mixed in the final state:
  - **Pre-made glTF assets (Kenney — see "Pre-made assets (Kenney)"
    below), 8 of 13**: `office-tower`, `apartment-tower`, `villa-house`,
    `townhouse`, `serviced-apartment`, `factory` (building + a separately
    -loaded chimney asset), plus `storefront` and `hospital-cross` (a
    loaded asset + a hand-built prop — an awning; a rooftop cross — the
    asset pack doesn't include).
  - **Procedural (hand-built geometry), 5 of 13**: `school-building`,
    `showroom`, `gov-building`, `balloon` (entertainment — symbolic, no
    common building form exists for this category, checked against 4
    Kenney packs), `banquet-hall` (restaurant/wedding — symbolic, same
    reasoning).
  - "Văn phòng" has its own `office-tower` key rather than reusing the
    shared `building` model (which stayed put for BranchSelectStep's
    unrelated "Dự án công trình" card).
  - `getProjectTypeModelKey(slug)` mirrors `getProjectTypeIcon`'s own
    slug-matching branches exactly.
  - **Round 1 — self-audit bugs, fixed before ever reporting**: a
    rest-angle mistake and a z-fighting artifact — see "Abstract
    concepts" and "Modeling" below.
  - **Round 2 — user asked to review all 13 side by side.** The first
    pass used floating metonymic objects (a graduation cap, a balloon,
    two wine glasses, a magnifying glass) for "cơ sở giáo dục," "vui chơi
    giải trí," "nhà hàng tiệc cưới," and "căn hộ dịch vụ" — matching the
    flat icons' own choices — but compared side by side these looked
    inconsistent with their building-shaped siblings, since "loại công
    trình" asks what's being *constructed*, not evoking a vibe. Rebuilt
    the first 3 into researched buildings/symbols (see "Abstract
    concepts" below); the 4th (`serviced-apartment`) got a reception
    bell prop as an intermediate fix, corrected again in round 3. Also
    caught and fixed here: `buildShowroom`'s glass panel covering 87% of
    the facade (read as a flat screen, not a building) — see the
    Modeling section's composition-gotcha notes.
  - **Round 3 — user asked to specifically re-search for pre-made models
    for 7 named categories**, clarifying that "căn hộ dịch vụ" means a
    for-rent apartment building (same idea as chung cư), not literal
    hospitality "service" — so its reception-bell prop was wrong on the
    premise, not just the execution. Checking 2 more Kenney packs (not
    consulted in the original research) found real matches for 4 of the
    7: `serviced-apartment`, `townhouse`, `factory`, and a nicer
    `villa-house` replacement — see "Pre-made assets (Kenney)" below for
    which packs, and why the other 3 (`school-building`, `gov-building`,
    `banquet-hall`) still have no match after checking all 4 packs.
- **Not yet converted to 3D models** (still flat gradient-badge icons from
  `entity-icons.tsx`, though already on the shared card structure/ratio
  above): service categories (1 step left).

This doc is the reusable "formula" for building the next model, whichever
step that ends up being; do one step at a time, not all of them in a single
pass (explicit user instruction, repeated more than once this session).

## Where the code actually lives

- `modules/inquiry/presentation/components/steps/three-models.js` — the
  per-object model builders, keyed by `MODEL_BUILDERS`. 32 keys as of this
  writing: `ac-unit`, `toolbox`, `building` (BranchSelectStep's 3) plus
  `cassette`, `ducted-unit`, `floor-standing`, `ceiling-exposed`,
  `fresh-air-unit`, `ducting-kit`, `water-filter`, `control-panel`,
  `smart-switch`, `smart-sensor`, `remote` (ProductCategoryPickerStep's
  12 — `ac-unit` is reused for "treo tường" rather than duplicated, since
  it's the same physical object) plus `install-kit`, `cleaning-spray`,
  `trade-in`, `clearance-tag`, `rental-clock`, `more-dots`
  (ServiceGroupPickerStep's 6 — `clearance-tag`/`rental-clock` reuse
  `buildAcUnit` internally rather than duplicating it) plus
  `serviced-apartment`, `school-building`, `storefront`, `factory`,
  `showroom`, `gov-building`, `hospital-cross`, `entertainment-building`,
  `villa-house`, `banquet-hall`, `townhouse`, `apartment-tower`,
  `office-tower` (ProjectTypePickerStep's 13 — 8 of these load a Kenney
  glTF asset instead of building procedural geometry; see "Pre-made
  assets (Kenney)"). Also exports
  `getCategoryModelKey(slug)` and `getServiceGroupModelKey(slug)`,
  substring-match lookups from a category/service-group slug to one of
  these keys (same defensive pattern as `deriveSupportType` in
  `LeadFormScreen.tsx` / `getCategoryIcon`+`getServiceGroupIcon` in
  `entity-icons.tsx`) — used by `ProductCategoryPickerStep.tsx` and
  `ServiceGroupPickerStep.tsx` respectively. **Plain JS, not TS** — see the
  file's top comment for why (it's loaded from two different module
  contexts that don't share a bundler: the React app and the standalone
  snapshot-render
  script below).
- `modules/inquiry/presentation/components/steps/three-scene-rig.js` — the
  shared lighting/camera/ground rig (below), also plain JS for the same
  reason.
- `modules/inquiry/presentation/components/steps/DragRotate3DCard.tsx` —
  the actual React component: gesture-gated mount, dynamic `import("three")`,
  drag-to-rotate, renders the `<img>` snapshot at rest.
- `modules/inquiry/presentation/components/steps/EntityPickerCard.tsx` —
  the shared picker-grid card (used by product/service category, service
  group, and project-type steps). Takes *either* an `icon` prop (old flat
  gradient-badge illustration) *or* a `modelKey` prop (new 3D card) —
  exactly one per call site, per step, as that step converts. Stayed a
  single `<button onClick>` rather than adopting `BranchSelectStep`'s
  separate-button restructure — see "Embedding in a clickable card" above
  for why that's a deliberate, context-dependent choice, not an
  inconsistency.
- `scripts/render-3d-icon-snapshots.mjs` — run this (`node
  scripts/render-3d-icon-snapshots.mjs`) whenever a model in
  `three-models.js` changes. Spins up a throwaway local HTTP server (needed
  because Chromium refuses ES module imports between `file://` documents —
  it treats each as an opaque/null origin, so `file://` + import maps
  silently fails with a CORS error), opens a harness page with Playwright,
  and renders every key currently in `MODEL_BUILDERS` (reads the key list
  from the harness at runtime — no separate list to keep in sync in the
  script itself anymore) to `public/images/3d-icons/<key>.png`.

## Why this exists

The lead form's picker cards (`modules/inquiry/presentation/components/steps/EntityPickerCard.tsx`)
need a per-item visual, but admin hasn't populated real catalog photos for
most rows. Flat icons/gradient badges (see `entity-icons.tsx`) are the
current placeholder. This pattern is the upgrade path: a lightweight,
realistic mini 3D model the visitor can grab and spin — without paying a
WebGL/Three.js cost for every card that's never touched.

## The core idea: gesture-gated mount, not hover-gated

A picker step can show up to ~13 cards at once. Mounting a live WebGL
context for all of them (or even on hover) is real cost — GPU/battery on
mobile, bundle size, risk of hitting browser WebGL-context limits. So:

1. **At rest**: every card shows a **static snapshot image** (a `<img>`,
   pre-rendered once) of the model at its resting angle. Zero WebGL, zero
   JS scene graph, just a bitmap. This is what 95% of visitors ever see.
2. **On gesture** (`mousedown` / `touchstart`, not `mouseenter`/hover): the
   real Three.js scene mounts, using the *exact same scene-graph builder*
   as the snapshot, so there's no visible "style swap" the instant the
   drag starts — the live render picks up exactly where the snapshot left
   off.
3. The snapshot is generated **once, offline**, by
   `scripts/render-3d-icon-snapshots.mjs` → `public/images/3d-icons/<key>.png`.
   Nothing renders it client-side at runtime — `DragRotate3DCard` just
   points a plain `<img>` at the pre-baked file until a gesture happens.
   (An earlier version of this doc described client-side snapshot
   generation as a stand-in for this; that's gone now, the real script
   exists — see "Where the code actually lives" above.)

```
resting state:  <img src="/images/3d-icons/ac-unit.png">   — no JS, no WebGL
   │  mousedown / touchstart
   ▼
live state:     dynamic import("three"), mount <canvas>, render loop while dragging
```

## Interaction: drag-to-rotate, not hover-follow

First attempt was hover-follow (cursor position → absolute rotation). User
feedback: that's not "the user controlling it," it's the cursor
controlling it. Correct pattern is what Sketchfab / product configurators
do — **press-and-drag with relative delta**, release holds the angle:

```js
function dragTo(clientX, clientY) {
  if (!dragging) return;
  const dx = clientX - lastX;
  const dy = clientY - lastY;
  lastX = clientX; lastY = clientY;
  currentY += dx * YAW_SENSITIVITY;                                    // free 360°, no clamp
  currentX = clamp(currentX + dy * PITCH_SENSITIVITY, -PITCH_LIMIT, PITCH_LIMIT); // clamp pitch — the back/underside has no modeled detail, don't let it flip there
}
```

Tuned constants that felt right at a 320px card:

- `YAW_SENSITIVITY = 0.02` rad/px — a full card-width drag (~300px) yields
  ~340°, i.e. almost one full turn per single drag gesture. (First pass
  used `0.008` for both axes — that under-rotates badly at small card
  sizes; **don't reuse `0.008` for yaw**.)
- `PITCH_SENSITIVITY = 0.008` rad/px, `PITCH_LIMIT = 0.55` rad (~31°) —
  pitch stays intentionally tighter and clamped.
- No easing/lerp on the *live* rotation — `group.rotation.y = currentY`
  directly in the render loop. (An earlier hover-follow version eased
  toward a target with `+= (target - current) * 0.12`; that's gone now
  that it's direct drag, not needed.)
- On release: **do not snap back**. The whole point is the visitor left it
  at the angle they chose.

Mouse listeners for `mousemove`/`mouseup` are attached to `window`, not the
card, so the drag keeps tracking even if the cursor leaves the small card
bounds mid-drag.

## Embedding in a clickable card: don't nest it inside the click target

First integration put `<DragRotate3DCard>` *inside* the same `<button>`
that selected the option (`onClick={() => onSelect(...)}` on the outer
element). Bug this caused: `mousedown` → drag to inspect the model →
`mouseup` on the same element still fires a native `click` that bubbles up
to that button, so spinning the model to look at it also silently selected
the option the instant the visitor let go.

Two things fixed this, and the second is the one that actually matters —
the first was a stopgap:

1. `DragRotate3DCard` tracks whether the press moved past a small pixel
   threshold (`MOVE_THRESHOLD = 4`, via `downPosRef`/`draggedRef` —
   independent of the async `three` import, since that hasn't resolved yet
   when `mousedown` fires) and calls `e.stopPropagation()` in its own
   `onClick` only if a real drag happened. A plain tap still bubbles and
   selects; a drag doesn't. Kept as defense-in-depth for whatever consumer
   wraps this component next.
2. **The actual fix**: restructured the card so the 3D model is no longer
   inside the click target at all.

   ```
   wrapper (div, not a button — just visual framing)
   ├── card con (one unified card, not two separate boxes)
   │     ├── <DragRotate3DCard>          — top
   │     └── title + description text    — bottom
   └── <Button onClick={() => onSelect(...)}>Chọn mục này</Button>  — separate, below
   ```

   Selecting an option now requires pressing the explicit button; the model
   area is purely for inspecting/rotating, with zero ambiguity about what a
   press-and-release there does. See `BranchSelectStep.tsx` for the actual
   JSX — `group`/`group-hover` on the outer wrapper still gives the
   lift-on-hover polish without the wrapper itself being interactive.

   This restructure also incidentally fixed a second bug: the static
   snapshot `<img>` had appeared to render the model at a different size
   than the live canvas. Root cause wasn't the image/canvas at all — it was
   the *old* two-separate-boxes layout (a header card with its own padding,
   sitting above a differently-padded model box) creating an actual visual
   size mismatch between the two boxes. One unified card con with
   consistent padding around both model and text resolved it.

3. Card heights: with per-option description text of different lengths
   (2–3 lines), the three cards ended up different heights, so the "Chọn
   mục này" buttons sat at different vertical positions across the row.
   Fixed the same way as `EntityPickerCard`'s title earlier in this
   project: `min-h-[3.75rem]` (3 lines' worth) on the description `<p>`,
   reserving the space regardless of actual line count.

**Update: `EntityPickerCard` now uses the same separate-button structure
too.** It originally stayed a single `<button onClick>` instead (the
reasoning above: a fast tap-to-advance grid of up to ~13 items, where a
confirm button per card seemed to cost more taps than it's worth). The
user later asked explicitly for the same wrapper → card con → separate
`<Button>` structure on *every* card in the flow, for consistency — so
`EntityPickerCard` was restructured to match `BranchSelectStep`: a
`bg-muted/10` frame wrapper (border, padding — the original nested-card
treatment, a solid `bg-background` card con floating on top of a
translucent frame, same as `LinkPreviewCard`'s `CardShell`), with the
model/icon + title inside card con, and a `<Button>` labeled "Chọn mục
này" below card con but still inside the wrapper's padding. See "Cards are
4:3, not square" below for exactly how card con's internal layout (model
vs. title split) evolved — that section supersedes the specific JSX shape
described earlier in this section, though the "button lives outside the
card" principle here is unchanged. The prop interface didn't change
(`onClick` still takes no args, and the never-used `subtitle` prop was
dropped entirely), so none of the 5 call sites
(`ProductCategoryPickerStep`, `ServiceCategoryPickerStep`,
`ServiceGroupPickerStep`, `ProjectCategoryPickerStep`,
`ProjectTypePickerStep`) needed edits. `DragRotate3DCard`'s
`draggedRef`/`stopPropagation` guard is kept as defense-in-depth even
though it's no longer the primary mechanism here — cheap to keep, and
protects any future consumer that nests this card inside a click target
again.

## Modeling: a real profile, not a box

A `RoundedBoxGeometry` reads as "a rounded box," not "an appliance." Real
wall-split AC indoor units are a rounded wedge: flat back against the wall,
glossy front bulging out around the upper-mid height, tapering to a thin
front lip where the discharge louvre hinges (confirmed via product-spec
research — width:height:depth ≈ 3.6:1.2:1, front-return-air panel, bottom
discharge louvre, control/display on the right side of the front face).

Technique: build the **2D side cross-section** as a `THREE.Shape` (a few
`bezierCurveTo`/`quadraticCurveTo` calls), then `ExtrudeGeometry` it along
the width axis, then re-orient with `translate`/`rotateY` so width lands on
the scene's X axis:

```js
const profile = new THREE.Shape();
profile.moveTo(0, 0);                                    // back-bottom (flush against wall)
profile.lineTo(0, H * 0.95);                              // back-top
profile.quadraticCurveTo(0, H, D * 0.12, H);               // round the back-top corner
profile.bezierCurveTo(D*0.55, H*0.99, D*0.97, H*0.75, D, H*0.42); // front bulge, top→apex
profile.bezierCurveTo(D*0.99, H*0.18, D*0.82, H*0.05, D*0.58, 0); // taper down to the front lip
profile.lineTo(0, 0);

const geo = new THREE.ExtrudeGeometry(profile, {
  depth: WIDTH, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015,
  bevelSegments: 3, curveSegments: 24,
});
geo.translate(0, 0, -WIDTH / 2);   // center the extrusion axis
geo.rotateY(-Math.PI / 2);         // extrusion axis (local Z) → scene X (width)
geo.translate(0, -H / 2, -D / 2);  // re-center height/depth after the rotation
```

This is the reusable part for every other model: **look up (or estimate
from photos) the real object's side silhouette, encode it as a `Shape`,
extrude.** A wrench, a water tank, a building — all read as "the real
thing" once the silhouette is right, far more than adding surface detail
to a box does.

Secondary detail that sells realism, roughly in order of payoff:

1. Correct silhouette (the extrude, above) — biggest win by far.
2. A separate mesh for the one functional detail people actually recognize
   (here: the angled discharge louvre with embossed fins as its own
   rotated mesh, not slats painted across the whole front).
3. One small "this is a real product" cue (the display window + a lit LED
   — `emissive` + `emissiveIntensity` on a `MeshPhysicalMaterial`).
4. Material: `MeshPhysicalMaterial` with `clearcoat` for the glossy plastic
   body, plain `roughness`-only for matte trim/grille parts.

**Most objects don't need the extrude-profile technique at all.** The
12-model product-category batch (`buildCassette` through `buildRemote` in
`three-models.js`) used plain `RoundedBoxGeometry` primitives for
everything except the wall AC unit — and that's correct, not a shortcut:
a smart switch, control panel, remote, and ceiling cassette really are
boxy consumer products in real life. Reach for the extrude-profile
technique specifically when the real object has a curved/wedge silhouette
a box can't approximate (like the wall AC's rounded front bulge) — don't
apply it reflexively to every model.

Two concrete bugs from building this batch, worth knowing before repeating them:

- **Anchor multi-part assemblies by rotating around a shared origin, not by
  translating then rotating.** `buildDuctingKit`'s first pass built each
  duct "stub" as a ring-chain starting at a local offset, then *translated*
  the whole stub group to a position near the hub, then rotated it — the
  translate-then-rotate combo moves the anchor point away from the hub, so
  the rings rendered floating disconnected in space instead of attached.
  Fix: keep the stub group's origin exactly at the hub's center (no
  position offset at all), start the ring chain at the hub's edge in local
  space, and *only* rotate the group — rotation around the shared origin
  keeps the first ring flush against the hub regardless of angle. If a
  sub-assembly needs to look attached to a parent mesh, its group origin
  should generally be the attachment point, not somewhere else that then
  gets moved into position.
- **Keep every model within roughly the same bounding size** (~3.2 units,
  matching the wall AC unit `buildAcUnit` was tuned against) since they all
  share one fixed camera/fov (see the Lighting rig section). `buildDuctedUnit`'s
  first pass (a box + 6-ring duct chain + diffuser) was noticeably wider
  than that and got cropped at the frame edges — the diffuser was
  partially cut off in the rendered snapshot. Fixed by shrinking ring count
  and spacing, not by changing the shared camera. If a new model's
  silhouette needs to be unusually large or small, that's a signal to
  reconsider the shape/detail level, not to special-case the camera per
  model (which would make cards in the same grid inconsistently scaled
  relative to each other).

## Pre-made assets (Kenney) — when to load a glTF instead of hand-building

Every model up to this point in the project is procedural: a JS function
builds `THREE.Mesh` primitives at runtime, no external files. For
`ProjectTypePickerStep`'s generic-building categories, the user explicitly
asked whether pre-made models existed instead of hand-rolling geometry —
worth researching rather than assuming procedural is always right, since
architecture is exactly the kind of detailed, multi-part geometry where a
professionally-modeled asset can look better than primitives for the same
time investment.

**What was found and used, across 2 research passes** — CC0-licensed
(public domain, no attribution required), glTF format, and already the
same flat-shaded low-poly look this project's procedural models use, so
they drop in without an art-style mismatch. Downloaded from kenney.nl,
inspected candidate files by actually rendering them (a throwaway
Playwright+Three.js preview script, not just eyeballing each pack's tiny
64×64 thumbnail previews — those were too small to judge shape from).

- **Pass 1 — "City Kit (Commercial)" + "City Kit (Suburban)"** (5 files):
  `building-skyscraper-a.glb` → `office-tower` (văn phòng);
  `building-j.glb`, has balconies → `apartment-tower` (chung cư);
  `building-e.glb` → `storefront` (cơ sở kinh doanh, + a hand-built
  awning); `building-l.glb` → `hospital-cross` (y tế, + a hand-built
  rooftop cross); `building-type-r.glb` (Suburban) → an initial
  `villa-house` (biệt thự, + a hand-built pool/lamp) — later superseded,
  see pass 2.
- **Pass 2 — user asked to check specifically for the categories pass 1
  had left procedural, including a re-check of `villa-house`.** Two more
  packs turned out to have real matches that pass 1's 2-pack search
  missed: **"City Kit (Industrial)"** (`building-k.glb`, a warehouse with
  a genuine sawtooth roof + `chimney-large.glb`) → `factory`; and
  **"Modular Buildings"** — a kit of building *pieces*, but it also ships
  4 pre-assembled "sample" buildings that turned out to fit categories
  pass 1 had declared "no match" for: `building-sample-tower-a.glb`
  (narrow, tall, arched entrance, window awnings) → `townhouse` (nhà
  phố) — pass 1 had checked only Commercial (wide mid-rise blocks) and
  Suburban (standalone yard houses) and correctly found neither fit a
  narrow row-house, but hadn't checked Modular Buildings yet;
  `building-sample-tower-b.glb` → `serviced-apartment` (căn hộ dịch vụ,
  after the user corrected the category's actual meaning — see "Abstract
  concepts" below); `building-sample-house-b.glb` (warm cream walls,
  arched windows) → a **replacement** `villa-house`, swapped in for pass
  1's plainer Suburban tract-house since "biệt thự" implies a nicer home
  than a generic suburban house.

**What was deliberately kept procedural after checking all 4 packs**, and
why — availability of a generic building doesn't mean it fits every
category: `school-building` (Vietnamese schools have a specific
yellow-ochre + open-corridor look no pack has), `banquet-hall` (Vietnamese
wedding halls are specifically neoclassical/domed — none of the 4 packs
have classical/ornate architecture), `gov-building` (no columned/pediment
civic-building style in any of the 4 packs — Modular Buildings' arched
windows come closest but still read residential/commercial, not civic),
`showroom` (needs a controlled glass-panel + mannequin composition no
generic building provides), `entertainment-building`/`balloon`
(symbolic — no dedicated fairground/carnival pack was found to exist at
all under Kenney, confirmed by web search, not just missing from the 2
packs checked). **The lesson, reinforced by finding 4 more matches in
pass 2 that pass 1 missed**: "I checked 2 packs and found nothing" is a
narrower claim than "no pre-made asset exists" — checking more of a
prolific asset creator's catalog (Kenney alone has dozens of CC0 packs)
before concluding "keep procedural" is worth the extra research pass,
especially when explicitly asked to double-check.

**Implementation — this is a bigger change than swapping a geometry call,
because loading is inherently async where every procedural builder was
synchronous**:

1. `three-models.js` gained a `loadGltfModel(THREE, GLTFLoader, url)`
   helper: loads the asset, then normalizes it — computes a bounding box,
   re-centers on the origin, and scales to a shared ~2.6-unit max
   dimension — since a loaded asset's native scale/pivot is whatever the
   source pack happened to use, not something built to this project's
   convention like every hand-built model already is.
2. All 9 Kenney-backed builders (`buildOfficeTower`, `buildApartmentTower`,
   `buildStorefront`, `buildHospitalCross`, `buildVillaHouse`,
   `buildFactory`, `buildTownhouse`, `buildServicedApartment`, across both
   research passes) are `async function`s returning
   `Promise<{ group, restY, restX }>` instead of the plain object every
   procedural builder returns directly. They also take a third parameter,
   `GLTFLoader`, alongside the existing `THREE`/`RoundedBoxGeometry` pair
   — same "pass the addon class in, don't import it inside this
   bundler-agnostic file" pattern already used for `RoundedBoxGeometry`.
   `buildFactory` loads *two* assets (`Promise.all` on the building +
   chimney) — the first builder in this batch to compose two separately-
   loaded glTFs into one model, same idea as `buildRentalClock` composing
   two procedural sub-models.
3. Both real consumers now `await` the builder's return value —
   `DragRotate3DCard.tsx` and `render-3d-icon-snapshots.mjs`'s harness.
   `await` on a plain (non-Promise) object just resolves immediately, so
   this didn't require branching sync vs. async builders; it works
   uniformly for all 20+ models in `MODEL_BUILDERS`.
4. Both consumers also now import `GLTFLoader` from
   `three/examples/jsm/loaders/GLTFLoader.js` (alongside the existing
   `RoundedBoxGeometry` import) and pass it through to the builder call.
5. The `.glb` files live in `public/models/kenney/`, referenced from
   builder code as `/models/kenney/...` — the path Next.js's `public/`
   convention serves at the site root. `render-3d-icon-snapshots.mjs`'s
   own throwaway static-file server serves the *raw repo root*, not a
   simulated `public/`, so it needed one addition: any request path
   starting with `/models/` gets `public/` prepended before resolving to
   an actual file, so the identical `/models/kenney/...` string embedded
   in `three-models.js` resolves correctly in both the real Next.js app
   and this local harness.
6. `.glb` added to both servers' MIME-type maps
   (`model/gltf-binary`) — without it Next either infers correctly via
   its own static file serving (fine) but the throwaway harness server
   would otherwise serve the wrong content-type, which — depending on the
   browser — can silently fail to parse as glTF.

**Bug caught and fixed: a Kenney "GLB format" file is not actually fully
self-contained.** Despite the folder name, these `.glb` files reference
an *external* texture (`Textures/colormap.png`) by relative path rather
than embedding it in the binary — confirmed by inspecting the glTF JSON
chunk directly (`images: [{ uri: "Textures/colormap.png" }]`), not by
guessing from the rendering symptom. Missing that file the first time
produced models that rendered in flat, textureless gray — easy to
mistake for a lighting problem, but actually a 404 on the texture falling
back to an untextured default material. Fixed by copying each pack's
`Textures/colormap.png` alongside its `.glb` files. **Second bug this
uncovered**: the Commercial and Suburban packs' `colormap.png` files are
*different images* but both referenced by the *same* relative path
(`Textures/colormap.png`) from their respective `.glb` files — copying
both packs' assets into one shared folder would make one pack's models
silently load the other pack's texture atlas. Fixed by splitting into
`public/models/kenney/commercial/` and `public/models/kenney/suburban/`
subfolders, each with its own `Textures/` directory, and updating the
load paths to match. General lesson: when combining assets from multiple
source packs that each assume they own a conventional relative path,
namespace them into separate folders rather than flattening — don't
assume filename conventions are collision-free across packs just because
they were collision-free within one pack.

**Self-audit caught one more issue after the texture fix**: `villa-house`
(the suburban asset) rendered with its roof peak within ~10% of the
frame's top edge — tighter margin than every other model in this batch,
and a real clipping risk once displayed at the card's actual (narrower)
aspect ratio. The shared 2.6-unit normalization in `loadGltfModel` isn't
uniformly safe for every asset's proportions — this specific asset (a
2-story house with an attached carport wing) is taller relative to its
footprint than the other 4 chosen assets. Fixed with a per-model extra
0.8× scale-down in `buildVillaHouse` specifically, not by changing the
shared normalization constant (which was fine for the other 4). (This
particular villa-house asset was later replaced entirely in pass 2 — see
above — but the general lesson about per-asset margin checks still
applies to every Kenney model added since.)

**Pass 2 bug: misidentified which file had the sawtooth roof while
eyeballing 6 similar-looking thumbnail renders side by side, and didn't
catch it until self-auditing the actual production render.** Copied
`building-o.glb` as `factory.glb` believing it was the one with a
sawtooth roof; it's actually a flat-roofed warehouse with a recessed
rooftop equipment well — visually similar enough to several sibling
files in a quick scan that the wrong letter got attached to the right
mental description. The mistake surfaced clearly once rendered through
the actual production camera angle (a near-flat rooftop reads as an
inscrutable dark box from a near-front elevation, nothing like a
sawtooth), which is exactly the case for self-auditing the *real*
pipeline output rather than trusting an earlier preview-script
impression. Fixed by re-rendering the *remaining* untested letters in
the pack (a through n, having only sampled a, d, g, k, o, s the first
time) and finding the actual sawtooth roof at `building-k.glb`. Lesson:
when identifying one specific asset among many similar-looking
candidates by comparing thumbnails, double check the exact filename
survived from "I looked at the image" to "I copied this file" — a
transcription slip between those two steps is easy to make and easy to
miss until the wrong asset is actually rendered in place.

**Pass 2 bug: `buildFactory`'s first attempt used this batch's default
near-front camera pitch (`restX` ~0.08), which is fine for the
procedural models' front-facing details but hides this particular
warehouse's sawtooth roof almost entirely** — the ridges run shallow
front-to-back and only read as a proper zigzag from a steeper, more
elevated angle (closer to how the standalone asset-preview script's
camera, which was never near-front, happened to frame it). Fixed with a
notably steeper `restX: 0.4` than any other model in this batch uses.
Same `chimney.glb` sub-model was also initially positioned with a visible
gap from the building — fixed by pulling it in closer to the corner so
it reads as attached rather than "two unrelated objects sharing a frame"
(the same composition-gotcha as the `buildRentalClock`/`buildShowroom`
bugs earlier in this doc, now hit a third time — worth treating "do two
composited sub-objects actually look connected" as a standard checklist
item for every multi-asset model, not just the ones where it's been
caught before).

## Research near-lookalike variants before modeling — don't improvise from the category name alone

The 12-item product-category batch includes several AC sub-types that
sound similar and are easy to conflate if you just improvise from the
Vietnamese name: `may-lanh-am-tran` (cassette), `may-lanh-giau-tran-noi-ong-gio`
(concealed duct), and `may-lanh-ap-tran` (ceiling-suspended) all involve
"ceiling" but are three structurally different products. First pass
modeled all three from assumption rather than checking, and got called out
by the user for it — the corrections, and what a web search of the
Vietnamese product-spec pages actually turned up:

- **Cassette (âm trần)** — took 3 passes:
  - Pass 1: a cross/plus-shaped vent through the center instead of 4
    separate edge vanes, and the vanes shared the grille's material color
    so even once correctly positioned they'd have visually fused into one
    blob instead of reading as 4 distinct parts.
  - Pass 2: fixed the vane layout (4 edges, own material) and confirmed
    the panel proportions against spec sheets (950×950mm mask over a
    900×900mm body — square, matching what was already built). Still
    missing two things visible in the user's reference photo: the
    return-air grille should be a LIGHT perforated panel with fine slits,
    not a dark solid block; and a swooping CHROME arc bridges each of the
    4 corners — standard across brands (Daikin, Mitsubishi, LG), not a
    one-off styling choice, and the single most visually distinctive part
    of the panel.
  - Pass 3: lightened the grille + added fine slit lines, and added the 4
    corner arcs — but the *first* attempt at the arcs used 4 quarter-torus
    segments all centered at the same point, which tiled into one closed
    ring instead of 4 separate diagonal accents (caught by rendering and
    looking before reporting, not by the user). Fixed by giving each arc
    its own smaller radius and offsetting its *position* out toward its
    own corner (`Math.cos/sin(cornerAngle) * dist`) instead of sharing a
    center — the general fix for "N rotated copies of the same arc
    accidentally forming a closed shape": increase the offset distance
    between copies, don't just rotate them.
  - Pass 4: user pointed out the panel/grille/vanes/arcs (all of the
    above) were already fine and explicitly said don't touch them — what
    was missing was the housing/body entirely (confirmed by rotating the
    live model to a pure side view, where it was revealed to be paper-
    thin — literally just the panel, no body behind it). First attempt at
    adding a body got the proportions backwards: modeled it as a TALL box
    floating above the panel in +Y, disconnected once viewed from the
    side. Real spec (an actual cassette body, e.g. iPAC-30CC:
    570×570×260mm W×D×H) is a *shallow square slab, not a tower* — same
    footprint as the panel, only ~40% as deep. Corrected version sits the
    body directly BEHIND the panel along the camera axis (−Z, since the
    panel-faces-camera convention here puts "deeper into the ceiling" at
    −Z, not +Y) with the same X/Y center as the panel, not offset. Also
    gave this model its own non-default rest pose (`restY: 0.55, restX:
    0.32`, a real 3/4 angle) instead of the near-front elevation every
    other model uses — a cassette viewed flat-on looks identical to a
    bare panel regardless of whether a body exists behind it, which is
    exactly why every manufacturer photo of these shows them tilted.
    **When a model's defining feature is only visible off-axis, give it a
    rest pose that shows it — don't force the shared near-front angle.**
  - Pass 5: after seeing the housing fix rendered, user said the 4 chrome
    corner arcs added back in pass 3 read as "4 cái râu" (whiskers) —
    curled comma shapes that don't look like a real mechanical part — and
    asked for the simpler mask from before they existed. Removed them
    (and the now-unused `chromeMat`). Worth noting *why* this one didn't
    survive contact while the other pass-3 fixes did: the grille-color and
    housing corrections were sourced from a spec sheet/photo, but the
    corner-arc detail was guessed ("standard across brands" was an
    assumption, not something verified against this specific reference
    photo). A guessed decorative detail is more likely to get reverted on
    user feedback than one anchored to a source — keep that distinction in
    mind about how much to defend a detail that wasn't actually sourced.
- **Concealed duct (giấu trần nối ống gió)** — 4 passes:
  - Pass 1: correctly established the width:height proportions from spec
    sheets (~1:3.5, e.g. Samsung AC071RNLDKG: 199×700mm), but *guessed* the
    material and surface details — a smooth white insulation-wrapped shell
    + duct-collar rings. Also visually dominated by an oversized duct
    assembly that overflowed the shared camera frame before being trimmed.
  - Pass 2: rebuilt directly against the user's reference photo instead of
    guessing. Real catalog shots of this category show the BARE
    galvanized-steel casing as manufactured — field ductwork is attached
    later and isn't in a product photo — with a recessed opening exposing
    the coil (fins) near one end of the front face, and an exposed
    electrical/control box + copper refrigerant pipes on the *opposite*
    end's side face. Kept pass 1's proportions, replaced the material and
    every surface detail. Since the coil opening and the electrical/pipes
    sit on two different faces, this model also needed its own angled rest
    pose (`restY: 0.4, restX: 0.3`) to show both at once — same reasoning
    as the cassette fix above.
  - Pass 3: user flagged the coil opening as way too small relative to the
    reference photo ("cái khe gió ra tao thấy nó gần hết w mà?" — the
    opening spans almost the full width in the photo). It was only 0.85
    wide against a 2.7-wide casing (31%) — a small square patch, when the
    coil is the heat exchanger and needs maximum surface area, so it
    should run nearly the full length minus the control-box end. Widened
    to 1.9 (70%).
  - Pass 4: re-checked the *box* proportions (not just the coil), since the
    user also asked "dài rộng cao đúng chưa?" (are length/width/height
    correct). Width:height was already right (pass 1), but depth had never
    actually been verified against a spec — it was guessed at `D=1.0`
    against `WIDTH=2.7, H=0.8`, only 1.25× the height and 37% of the
    width. Slim-duct catalog dimension tables (Daikin FDXM-F9: H 200mm, W
    750–1150mm, D 620mm; consistent across other slim-duct models found)
    put real depth at ~2.5–3× the height and ~55–80% of the width — these
    units are a fairly chunky box front-to-back, not a shallow slab.
    Corrected to `D=2.0` (2.5× H, 74% of W).
    **Doubling the depth then broke something that had been fine before:**
    the second copper pipe (previously separated from the first along the
    *depth* axis, `pz: -0.15` vs `0.35`) rotated out of view, hidden behind
    the unit's own bulk at the model's rest angle — a pipe positioned
    outside the box's X-extent can still end up behind the box's silhouette
    in screen space once the box gets deep enough, even though the two
    don't geometrically intersect. Fixed by re-laying the twin pipes +
    valve out along the *height* axis instead (stacked in Y at the same,
    near-front Z) rather than spread along depth — incidentally also a
    better match for reference photos, which show twin refrigerant lines
    exiting close together near one fitting, not spread front-to-back.
    **Lesson: changing one dimension of a model can silently break the
    on-screen visibility of unrelated child meshes positioned relative to
    it — re-check child positions (not just re-check the dimension itself)
    after a proportion fix, especially anything near the edge the changed
    dimension affects.**
- **Ceiling-suspended (áp trần)** — got this one wrong *twice*, worth
  reading both failures:
  - Pass 1: modeled it as a flatter version of the wall unit (no real
    distinguishing feature).
  - Pass 2 (text-search-only "fix"): a generic English-language search hit
    described mini-splits as sometimes installed via "threaded rods... to
    suspend the unit," and that got carried over as a confident visual
    detail (dangling suspension rods) *without a source photo to check it
    against*. Wrong — Vietnamese product pages for this specific category
    say it's mounted "gắn sát trần" (flush/close to the ceiling), and the
    user's reference photo confirms no visible rods at all.
  - Pass 3 (source-verified): rebuilt against the user-provided reference
    photo directly — a slim wide slab mounted flush/close (no rods), with
    a two-band front face: a ribbed silver/chrome strip above a dark
    grille of DIAGONAL slats (not straight horizontal). Also caught and
    fixed a geometry bug in this pass before shipping it: the diagonal
    slats' length wasn't checked against the grille panel's height, so at
    the chosen rotation angle they overshot the panel and stuck out past
    both edges like spikes — fixed by computing slat length from the
    target vertical span ÷ cos(angle), not picking a length by feel.

- **Fresh-air / heat-recovery ventilator (máy cấp khí tươi thu hồi nhiệt)**
  — user flagged this line as specifically Menred-branded product-wise, so
  research targeted that architecture rather than guessing. Menred's own
  product page text didn't yield usable dimensions/photos, but a Daikin
  ceiling-suspended ERV catalog (full spec table + dimensional drawing +
  product photo) did — and this category's physical form (long horizontal
  insulated box, round duct spigots at the two ends, external control box)
  is standardized across brands for this specific product type (same
  "compact horizontal design for ceiling application" phrasing shows up
  verbatim in both Menred's and Daikin's marketing copy), so a
  well-sourced reference from a different brand is legitimate evidence
  here — this isn't the "hold loose until there's a matching-brand photo"
  situation from the ceiling-suspended case above, because the shape is a
  category-wide standard, not a brand-specific styling choice.
  Corrections against that catalog (spec table + dimensional drawing, both
  with real numbers, not just marketing text):
  - Previous pass modeled a near-cube (1.7×1.1×0.9 ≈ 1.9:1.2:1) with a
    slatted front grille that had no source at all — pure invention. Real
    spec (Daikin ERV 250D-1000D, all 4 sizes share L/W/H):
    1940×1000×550mm = 3.53:1.82:1 (length:depth:height) — a long, flat
    box. No front grille exists on the real unit at all; air only moves
    through round duct spigots at the two ends.
  - Previous pass had only 2 ports total (1 per side). The real unit has
    **4**: fresh-air-in + extract-out share one end, return-in +
    supply-out share the other, each pair sitting side-by-side along the
    depth axis (confirmed from the catalog's plan-view dimensional
    drawing, not guessed) — not stacked vertically, and not 1-per-end.
  - Self-audit caught a framing quirk worth noting for next time: at this
    model's rest angle, the near end shows its 2 ports clearly separated,
    but the *far* end's 2 ports (same depth-axis separation) project
    almost on top of each other in screen space and read as one port —
    perspective foreshortening on the more oblique end, not a wrong
    position (checked the actual local coordinates against the spec's
    dimensional drawing — they're correct). Accepted as-is since the near
    end already establishes "duct ports at both ends," but if a future
    model has symmetric paired details at both ends, consider whether the
    shared rest angle actually shows both ends evenly before shipping.

**The meta-lesson from getting the same category wrong twice: a text-only
web search summary is not the same evidence as an actual reference photo.**
Pass 2 treated a generic English search result as ground truth for a
specific visual detail and stated it with unwarranted confidence — that's
what went wrong, not the research effort itself. When the user provides a
real photo (or one is findable), model against *that* directly; when only
text descriptions are available, hold specific visual claims (exact
mounting hardware, exact panel layout) more loosely than structural facts
(overall proportions, what's on which face) until there's an image to
confirm against. And in general: **when 2+ categories share a word in
their name (here, "trần"/ceiling) or sound like variations on the same
object, don't assume they're geometrically similar — verify each one
individually.**

## Self-audit against the reference before reporting back

After the áp trần rebuild (pass 3 above), the render was compared point-by-
point against the user's reference photo *before* telling the user it was
done — shape, mounting (flush vs. rods), the two-band front layout, colors
— rather than shipping it and asking the user to spot any remaining
mismatches. This was in direct response to explicit user feedback earlier
in the same session ("mày đi research và tự audit + review trước khi làm
đi chứ tao cũng là được giao để code thôi không am hiểu cái này" — the user
is not an HVAC domain expert either and can't reliably validate technical/
visual accuracy; that verification job is Claude's, not something to defer
back to the user's judgment call). Applies beyond this one model: for any
visual-accuracy work where the user has said they can't judge correctness
themselves, self-verify against whatever reference material exists (photo,
spec sheet) before presenting the result, rather than asking "does this
look right?"

## Abstract concepts / actions have no shape — use metonymy

A static 3D model can only depict an *object*, never a *verb*. "Dịch vụ"
(service — an action: install/repair/maintain) and "Dự án công trình"
(project — a concept) have no literal physical form. Same fix designers
always use for this: pick the object most associated with the
action/concept and model *that* instead — the same reason a settings icon
is a gear, not a picture of someone adjusting something.

- **Dịch vụ** → a toolbox + wrench (`buildToolbox`). The tool stands in for
  "service work" generally, not any specific repair.
- **Dự án công trình** → a building (`buildBuilding`). The building is the
  concrete referent for "construction project."
- **Mua sản phẩm** → the product itself (`buildAcUnit`) — this one's just a
  subject/object already, no substitution needed.
- **The 6 `ServiceGroupPickerStep` cards, a whole batch of the same
  problem at once**: every one of these is a service action, none a
  product.
  - **Cung cấp & lắp đặt** (supply & install) → a wall-mount bracket +
    wrench + loose screws (`buildInstallKit`) — deliberately more specific
    hardware than the generic toolbox+wrench that already stands for
    "Dịch vụ" as a whole, so the two don't read as the same icon reused.
  - **Vệ sinh bảo trì** (cleaning & maintenance) → a spray bottle + folded
    cloth (`buildCleaningSpray`) — this one IS a literal object already
    (the actual tools of the job), no substitution needed, same as
    `buildAcUnit`.
  - **Thu cũ đổi mới** (trade-in) → two chasing curved arrows forming an
    exchange loop (`buildTradeIn`) — no object referent exists at all for
    "trade old for new" as a concept, so this one stays purely symbolic
    (the same shape language as a refresh/sync icon) rather than forcing
    an arbitrary physical stand-in onto it. Not every abstract concept
    needs a *literal* object — sometimes the honest answer is a symbol.
  - **Thanh lý máy lạnh** (AC clearance sale) → an AC unit + a price tag
    (`buildClearanceTag`) — reuses `buildAcUnit`'s geometry at a smaller
    scale rather than re-modeling a wall-split from scratch, since the
    object being cleared out literally is that product.
  - **Cho thuê** (rental) → an AC unit + a wall clock (`buildRentalClock`)
    — the clock stands in for "temporary/short-term," the same role a
    calendar icon usually plays. Also reuses `buildAcUnit`.
  - **Khác** (other/uncategorized) → three dots (`buildMoreDots`) — a
    direct 3D translation of the existing flat "..." icon. Sometimes the
    2D placeholder's own symbol is already the right answer and doesn't
    need reinventing as an "object."

When adding a new model for something that isn't a literal object, ask
"what tool/artifact does a person picture when they hear this phrase?"
before starting on geometry — but also accept when the honest answer is
"no object, only a symbol" (`buildTradeIn`) rather than forcing one.

**Composition gotcha when combining two reused sub-models (e.g.
`buildClearanceTag`/`buildRentalClock`, both nesting a scaled-down
`buildAcUnit`): check they don't visually occlude each other's
distinguishing details, not just that both objects "fit in frame."**
`buildRentalClock`'s first pass positioned the clock close enough in
front of (larger z) and overlapping (in x) the AC unit that it covered the
AC's display/LED — the one detail that actually reads as "air
conditioner" rather than a plain white tube. Self-audit caught this by
looking at the actual rendered PNG, not by checking the numbers looked
reasonable. Fixed by increasing the x-separation and reducing the z-offset
between the two sub-objects so both silhouettes stay independently
legible.

**A second, more severe version of the same lesson: `buildShowroom`'s
glass panel covering 87% of the facade width made the whole building
read as a flat screen, not a building with a window in it — caught by
the user, not by self-audit, with "sao cái showroom nó kì thế?" (why
does the showroom look so weird?) and a screenshot.** Comparing the
numbers after the fact: a display window needs to look like a window IN
A WALL, which means the wall has to stay visibly dominant — a good rule
of thumb from this fix is keeping window coverage closer to 50-60% of
the facade, not 80%+, plus a distinct roofline cap so the top edge
doesn't just blend into the glass. This pass also re-exposed the
composition-gotcha above in a new shape: the mannequin figure standing
in that window had its torso positioned to *overlap* the pedestal
instead of sitting on top of it (the torso's bottom edge was below the
pedestal's top edge), which buried most of the figure and left only a
sliver visible in the render — fixed by deriving the torso's Y position
from the pedestal's actual top surface instead of picking both positions
independently by eye. And a third bug in the same function: the pedestal
was deep enough (0.3 units) at its chosen Z position to physically poke
*through* the glass panel rather than sitting behind it — any time two
meshes are positioned independently by picking Z values that "look about
right," check whether their Z *ranges* (position ± half-depth) actually
overlap where they shouldn't, not just whether the single position
numbers seem reasonable.

## Material note: avoid high `metalness` without an environment map

`MeshPhysicalMaterial`'s metallic look comes almost entirely from
environment reflections. This scene has no `envMap` (only the three
directional lights + ambient) — a `metalness` near `1` renders as
near-black everywhere except the direct specular highlight, which reads as
a broken/black blob, not brushed metal (hit this on the wrench's first
pass: `metalness: 0.85–0.9` came out looking like a dark claw). Keep
metal-ish parts around `metalness: 0.4–0.45` with `roughness: 0.4+` instead
— reads as brushed steel under lights-only lighting, no envMap required.

## Cards are 4:3, not square

Changed from the original square cards to a 4:3 landscape ratio ("ngang 4
dài 3" — user's explicit request, describing the desired shape as
resembling a bank card's landscape proportions). Getting the *scope* of
that ratio right took several passes, worth reading in order since each
one was a real, reasoned attempt that turned out not to be what the user
meant — not a mistake to gloss over:

1. **First pass: 4:3 on just the model/icon region.** Reasoning at the
   time: forcing the *whole* card (image + title + button stacked) into a
   rigid 4:3 box is a responsive hazard, since `aspect-ratio` on a grid
   item scales height with the item's own width — a narrow mobile card
   would shrink to a height too short for a title + button before the
   text itself can shrink further. So only the image region got
   `aspect-[4/3]`, and the wrapper was left to size itself from content.
   **This shipped, then failed self-audit against a real screenshot**:
   measuring the actual rendered boxes showed the image region genuinely
   was 4:3 (confirmed via `getComputedStyle`), but stacking title+button
   below it added enough height that the *whole card* came out portrait
   (~0.72 ratio — close to what the user called "3:4"). Any stacked
   layout mathematically can't produce an overall-landscape card once you
   add non-zero height for text below an already-4:3 image — that's
   arithmetic, not a bug, and the lesson is to measure the actual outer
   box a user is looking at, not just the one class you changed.
2. **Second pass: poster/overlay style.** To make the *whole* card
   genuinely 4:3, title + button were painted as a gradient-scrim overlay
   on top of the image (absolute-positioned, not adding height) rather
   than stacked below it — same idea as a real bank card, where the
   numbers are printed on the card face, not on a separate strip glued to
   the bottom. This actually achieved a true 4:3 *whole-wrapper* box
   (verified: 213×160px, ratio 1.333). **The user rejected this on sight**
   — they wanted the model and title/description visually separated into
   distinct stacked regions, not text overlaid on the image. Technically
   correct for the ratio, wrong layout.
3. **Final, user-specified structure** — nesting the ratio one level
   in from where pass 1 put it:
   ```
   wrapper (bg-muted/10 frame, border, padding — auto-height, NOT itself
            aspect-constrained)
   ├── card con (aspect-[4/3] — THIS box carries the ratio)
   │     ├── 3D model / icon   (top,    flex-1 min-h-0 — fills whatever's left)
   │     └── title             (bottom, fixed compact row, shrink-0)
   └── <Button>Chọn mục này</Button>   (separate, below card con, still
                                         inside the wrapper's padding)
   ```
   The model region is *not* independently 4:3 here — card con as a whole
   is, so the model flex-shrinks to share the fixed-ratio box with the
   title row instead of owning its own separate 4:3 slice (this is what
   makes it different from pass 1: the title's height comes out of the
   model's budget, not added on top of it). The wrapper is deliberately
   *not* aspect-constrained — only card con is — which is what actually
   avoids the pass-1 failure mode without needing the pass-2 overlay: the
   button can have whatever height it needs since it's outside the
   fixed-ratio box entirely.

Because the model's own region ratio now depends on how much of card
con's fixed height the title row eats — which changes with the card's
absolute pixel width, which changes with viewport/column count — there
isn't one single "correct" ratio for the pre-rendered static snapshot to
match everywhere. Measured live: **~1.55:1 at desktop (2-col, ~312px
cards)** vs **~1.79:1 at mobile (2-col, ~147px cards — same fixed-height
title row eats a much bigger share of a much smaller card)**. Settled on
**1.7:1** for `scripts/render-3d-icon-snapshots.mjs`'s `WIDTH`/`HEIGHT` as
a compromise that minimizes letterboxing at both ends rather than
optimizing for one breakpoint — there's no way to hit both exactly with a
single static image.

Rendering pipeline pieces that all have to agree on whatever the current
ratio is (not just one CSS class) — this list stays true regardless of
which ratio number is current:

1. `DragRotate3DCard.tsx`'s wrapper — no longer declares its own aspect
   class at all (`h-full w-full`, fills whatever box the caller gives it)
   since the caller (`EntityPickerCard`/`BranchSelectStep`) now controls
   the shape via its own flex layout, not a fixed aspect on this
   component directly.
2. **The renderer/camera, which don't know about Tailwind classes.**
   Sizes the renderer to the wrapper's *actual* `getBoundingClientRect()`
   width/height at mount time (not a hardcoded ratio), and passes
   `width / height` as the `aspect` parameter to `buildSceneRig` so the
   camera's projection always matches whatever shape the flex layout
   produced — this is what makes the live drag canvas correct at every
   breakpoint even though the model region's ratio isn't constant.
3. `three-scene-rig.js`'s `buildSceneRig(THREE, group, aspect)` — `aspect`
   defaults to `4 / 3` (used as `PerspectiveCamera(28, aspect, 0.1, 100)`)
   but is always passed explicitly by both real consumers. Vertical FOV
   (28) stays fixed regardless of aspect — widening only ever *adds*
   horizontal framing room, it can't newly crop a model that already fit
   a narrower ratio.
4. `scripts/render-3d-icon-snapshots.mjs` — `WIDTH`/`HEIGHT` constants
   (currently 512×300, the ~1.7:1 compromise above). **All 14 snapshot
   PNGs were regenerated** after every ratio change in this whole saga —
   the static `<img>` and the live WebGL canvas need to match reasonably
   closely or mousedown causes a visible size/shape jump at the
   gesture-gated mount handoff.

Self-audit after each regeneration: checked the tallest model
(`floor-standing`) at the new ratio each time — never cropped, confirming
that widening (relative to height) only adds horizontal margin, consistent
across all three ratio values tried (4:3, then 1.7:1).

## Grid layout: fixed 2 columns, no responsive collapse

Also went through a couple of iterations before landing:
1. Multi-column grid matching the old square-card layout
   (`grid-cols-2 sm:grid-cols-4`) — kept as-is initially when the card
   *shape* changed to 4:3, without revisiting the column count.
2. User asked to collapse to a single column (`flex flex-col`, 1 card per
   row) — landscape cards read oddly in a dense multi-column grid.
3. User then refined: 2 columns on desktop/landscape-tablet, 1 column on
   portrait-tablet/mobile (`grid-cols-1 lg:grid-cols-2`).
4. **Final**: user asked for portrait-tablet and mobile to also use 2
   columns, synced with the desktop/landscape-tablet count — i.e. a fixed
   `grid-cols-2` at every breakpoint, no responsive collapse at all. This
   is what's live now across `BranchSelectStep.tsx`, all 5
   `EntityPickerCard`-based picker steps, and `PickerLayout.tsx`'s loading
   skeleton (kept in sync with the real grid so there's no layout shift
   when data loads in).

This is also *why* the model-region ratio varies so much between
"desktop" and "mobile" in the section above — both are the same
`grid-cols-2`, so the ratio difference comes entirely from the absolute
card width shrinking on a narrow viewport, not from a column-count change.

## Lighting rig (reusable as-is)

Three-point-ish, neutral/cool (no warm "clay" tint — that was explicitly
rejected in favor of a modern Apple/Linear-adjacent look):

```js
key  = DirectionalLight(0xffffff, 2.6) at (4, 6, 4), castShadow, PCFSoftShadowMap
fill = DirectionalLight(0xdce6ff, 0.7) at (-5, 2, -2)
rim  = DirectionalLight(0xbfd4ff, 0.5) at (0, 2, -5)
ambient = AmbientLight(0xffffff, 0.5)
ground = ShadowMaterial(opacity: 0.16) plane, receiveShadow only (invisible except for the soft contact shadow)
camera = PerspectiveCamera(fov 28) at (0.6, 1.0, 8.6), looking at (0, 0.05, 0)
```

Reuse this rig unchanged for every new model — only the `group` contents
(the object itself) should differ per icon.

**Camera is a near-front elevation, not a 3/4 "hero shot" angle** — this
changed after the first pass shipped: the original camera was at
`(4.6, 3.1, 5.6)` (roughly equal X/Z offset, a diagonal 3/4 view), which
mostly showed side/end profiles and hid the front-face detail (vents,
display, windows) each model was actually designed to show. Real product
photography shoots appliances straight-on; matching that (small X offset
only, for a hint of depth — not X=0, which would look like a flat cutout)
reads better and matches the reference photo used to sign off on the AC
model's silhouette. **When changing camera position/fov, change distance
and fov together** — tightening fov and shortening distance at the same
time compounds into a zoomed/cropped shot (hit this exact bug once: fov 26
+ distance ~6.5 cropped the AC unit at the edges; fov 28 + distance ~8.7 is
what actually frames all three models correctly. If you narrow the fov,
move further back to compensate, don't do both by feel).

**`restY`/`restX` are per-model, not global** — each `MODEL_BUILDERS[key]`
call returns its own `{ group, restY, restX }`, read by both
`DragRotate3DCard.tsx` (live) and `render-3d-icon-snapshots.mjs` (the
baked resting-pose PNG). All three current models converged on `restY:
0.06` (near-zero yaw, i.e. facing the camera) with a small per-model
`restX` pitch tweak — but don't assume 0.06 is universal, it's just what
these three happened to want; a future model might need a different
resting yaw if its most recognizable face isn't the "front."

## What's still open

- Product categories (12/12) and service groups (6/6) are done, via
  `EntityPickerCard`'s `modelKey` prop. Service categories and project
  types (13) — still on the flat gradient-badge icons in
  `entity-icons.tsx`, though already sharing the same card
  structure/4:3 ratio as the converted steps (see "Card structure" note
  in Status above). Same formula applies for the actual 3D conversion, one
  step at a time (per explicit user instruction — don't batch multiple
  steps into one pass, it invites mistakes). Next candidate step not
  confirmed by the user as of this writing — check rather than assuming
  which one's next.
- `DragRotate3DCard` sizes its renderer once from the wrapper's
  `getBoundingClientRect()` at mount time — it does not re-measure on
  window resize/breakpoint changes. Fine for now since the branch cards'
  grid columns don't change after mount within a single viewport, but worth
  a `ResizeObserver` if a future step's card size changes dynamically.
  post-mount.
- `three` (`^0.185.1`) and `@types/three` are now real `dependencies` in
  `package.json` (installed via `bun add three @types/three`), not just a
  CDN experiment.

## Reference

Live: `BranchSelectStep.tsx` + the four files under "Where the code
actually lives" above. Superseded: `tmp/three-preview.html` (gitignored
scratch file, was the throwaway HTML demo used to design the pattern
in-session before the real integration existed — may not exist in a later
session, and the real component has since diverged from it in some details
like renderer sizing and TS types).
