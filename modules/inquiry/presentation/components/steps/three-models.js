// Model builders for the drag-to-rotate 3D icons (see
// docs/interactive-3d-icon-pattern.md for the full pattern/formula).
//
// Deliberately plain JS, not TS: this file is loaded from two different
// contexts that don't share a bundler —
//   1. scripts/render-3d-icon-snapshots.mjs's browser harness (native ESM
//      <script type="module"> in a throwaway HTML page, no Next.js/webpack)
//   2. DragRotate3DCard.tsx (bundled by Next, `three` dynamically imported)
// Each function takes the THREE namespace + RoundedBoxGeometry class as
// params instead of importing "three" itself, so it has no bundler-specific
// import resolution and works unmodified in both places. A handful of
// builders (see "Pre-made assets (Kenney)" in the doc) also take a
// GLTFLoader class as a third param and are async — see loadGltfModel
// below.

/**
 * Loads a glTF/GLB file and returns its scene graph, normalized to this
 * batch's shared ~2.6-unit bounding size and re-centered on the origin —
 * every hand-built model in this file is already sized/centered by
 * construction, but a loaded asset's native scale and pivot are whatever
 * the source pack happened to use, so this normalizes any asset to fit
 * the shared camera/lighting rig without per-asset tuning.
 * @param {typeof import("three")} THREE
 * @param {new () => { load: (url: string, onLoad: (gltf: { scene: import("three").Group }) => void, onProgress: undefined, onError: (e: unknown) => void) => void }} GLTFLoader
 * @param {string} url
 * @returns {Promise<import("three").Group>}
 */
function loadGltfModel(THREE, GLTFLoader, url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => {
        const scene = gltf.scene;
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        scene.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        scene.scale.setScalar(2.6 / maxDim);
        scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        resolve(scene);
      },
      undefined,
      reject,
    );
  });
}

/**
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildAcUnit(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xf3f5f8, roughness: 0.28, metalness: 0.04, clearcoat: 0.75, clearcoatRoughness: 0.18,
  });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x6b7280, roughness: 0.5, metalness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1c2230, roughness: 0.15, metalness: 0.3, transmission: 0.1, thickness: 0.05,
  });

  // Real wall-split indoor units are a rounded wedge, not a box: flat back
  // against the wall, glossy front bulging around the upper-mid height,
  // tapering to a thin front lip where the discharge flap hinges.
  const WIDTH = 3.2, H = 0.95, D = 0.85;
  const profile = new THREE.Shape();
  profile.moveTo(0, 0);
  profile.lineTo(0, H * 0.95);
  profile.quadraticCurveTo(0, H, D * 0.12, H);
  profile.bezierCurveTo(D * 0.55, H * 0.99, D * 0.97, H * 0.75, D, H * 0.42);
  profile.bezierCurveTo(D * 0.99, H * 0.18, D * 0.82, H * 0.05, D * 0.58, 0);
  profile.lineTo(0, 0);

  const bodyGeo = new THREE.ExtrudeGeometry(profile, {
    steps: 1, depth: WIDTH, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -WIDTH / 2);
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.translate(0, -H / 2, -D / 2);

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // Bottom discharge louvre — a hinged-looking flap, not slats painted
  // across the front (that's not where a real unit actually blows air).
  const flap = new THREE.Mesh(new RoundedBoxGeometry(WIDTH * 0.88, 0.05, 0.34, 4, 0.02), darkMat);
  flap.position.set(0, -H / 2 + 0.05, D * 0.24);
  flap.rotation.x = -0.62;
  flap.castShadow = true;
  group.add(flap);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(WIDTH * 0.82, 0.012, 0.012), darkMat);
    fin.position.set(0, -H / 2 + 0.05 - i * 0.02, D * 0.24 + 0.12 - i * 0.07);
    fin.rotation.x = -0.62;
    group.add(fin);
  }

  const display = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.16, 0.03, 3, 0.03), glassMat);
  display.position.set(1.1, H * 0.18, D * 0.46);
  group.add(display);

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 20, 20),
    new THREE.MeshPhysicalMaterial({ color: 0x4f8dff, emissive: 0x2f6fe0, emissiveIntensity: 1.6, roughness: 0.2 }),
  );
  led.position.set(1.1, H * 0.18, D * 0.5);
  group.add(led);

  return { group, restY: 0.06, restX: 0.06 };
}

/**
 * "Dịch vụ" has no single physical form — it's an action, not an object —
 * so it's represented metonymically by the tool associated with the action
 * (a toolbox + wrench), the same way a settings icon shows a gear rather
 * than a picture of "adjusting something".
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildToolbox(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();

  // Kept off high-metalness values everywhere here: MeshPhysicalMaterial's
  // metallic response comes almost entirely from environment reflections,
  // and this scene has no envMap — a metalness near 1 with only direct
  // lights renders as near-black outside the direct highlight. Moderate
  // metalness + higher roughness reads as brushed steel instead under
  // lights-only lighting.
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf2924a, roughness: 0.5, metalness: 0.04, clearcoat: 0.25, clearcoatRoughness: 0.45 });
  const metalMat = new THREE.MeshPhysicalMaterial({ color: 0xc3c8d1, roughness: 0.45, metalness: 0.4 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.2 });
  const wrenchMat = new THREE.MeshPhysicalMaterial({ color: 0xb0b6c0, roughness: 0.4, metalness: 0.45 });

  const base = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.85, 1.0, 4, 0.08), bodyMat);
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  const seam = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.02, 1.04), darkMat);
  seam.position.y = 0.3;
  group.add(seam);

  for (const x of [-0.6, 0.6]) {
    const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.16, 0.06, 2, 0.02), metalMat);
    clasp.position.set(x, 0.05, 0.51);
    clasp.castShadow = true;
    group.add(clasp);
  }

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 12, 24, Math.PI), metalMat);
  handle.rotation.z = Math.PI;
  handle.position.set(0, 0.42, 0);
  handle.castShadow = true;
  group.add(handle);

  // wrench leaning across the lid — handle bar + a closed ring-spanner head
  // at one end (a full torus, not a partial arc — an open-end jaw drawn
  // from a partial torus reads as an ambiguous blob at this scale).
  const wrench = new THREE.Group();
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.1, 0.05, 3, 0.02), wrenchMat);
  wrench.add(bar);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.055, 12, 24), wrenchMat);
  head.position.set(0.5, 0, 0);
  wrench.add(head);
  wrench.rotation.z = 0.85;
  wrench.position.set(0.5, 0.78, 0.18);
  wrench.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(wrench);

  return { group, restY: 0.06, restX: 0.12 };
}

/**
 * "Dự án công trình" (construction project) is likewise a concept, not an
 * object — represented by the building itself as the concrete stand-in.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildBuilding(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xeef0f3, roughness: 0.35, metalness: 0.08, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const backMat = new THREE.MeshPhysicalMaterial({ color: 0xd7dbe0, roughness: 0.4, metalness: 0.06 });
  const litGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x8fb3ee, roughness: 0.2, metalness: 0.3, emissive: 0x2f6fe0, emissiveIntensity: 0.35 });
  const darkGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.3 });

  const back = new THREE.Mesh(new RoundedBoxGeometry(0.85, 1.3, 0.7, 4, 0.05), backMat);
  back.position.set(0.7, -0.05, -0.38);
  back.castShadow = true; back.receiveShadow = true;
  group.add(back);

  const main = new THREE.Mesh(new RoundedBoxGeometry(1.15, 2.0, 0.9, 4, 0.06), bodyMat);
  main.position.set(-0.15, 0.25, 0.1);
  main.castShadow = true; main.receiveShadow = true;
  group.add(main);

  const cols = 3, rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (r * cols + c) % 3 === 0;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.02), lit ? litGlassMat : darkGlassMat);
      win.position.set(-0.15 - 0.32 + c * 0.32, -0.55 + r * 0.28, 0.1 + 0.451);
      group.add(win);
    }
  }

  return { group, restY: 0.06, restX: 0.08 };
}

// ---------------------------------------------------------------------
// Product categories (dòng máy) — modules/inquiry/presentation/components/
// steps/ProductCategoryPickerStep.tsx. "treo tường" reuses buildAcUnit
// above (may-lanh-treo-tuong is a wall-mounted split unit — the same
// object). Every other category here is a genuinely different physical
// object, so each gets its own silhouette rather than reusing a shape.
// ---------------------------------------------------------------------

/**
 * Ceiling cassette (âm trần đa hướng thổi) — a flat panel flush-mounted in
 * the ceiling. Modeled as a plaque *facing the camera* (its large faces
 * along the Z axis), matching how these are actually photographed for
 * product listings, not its true installed orientation (which would show
 * only a paper-thin edge to a front-on camera).
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildCassette(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.3, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const grilleMat = new THREE.MeshPhysicalMaterial({ color: 0xe4e6e9, roughness: 0.4, metalness: 0.05 });
  const slitMat = new THREE.MeshPhysicalMaterial({ color: 0x9aa1ab, roughness: 0.5, metalness: 0.1 });
  const vaneMat = new THREE.MeshPhysicalMaterial({ color: 0xd7dbe0, roughness: 0.35, metalness: 0.15 });

  // Rebuilt against the user's reference photo (previous pass got the
  // vane layout right — 4 edge vanes, not a cross — but the reference
  // showed the return-air grille as a LIGHT perforated panel with fine
  // slits, not a dark solid block). Panel size confirmed via spec sheets:
  // 950×950mm mask over a 900×900mm body — a near-uniform square, which
  // the existing 2.3×2.3 already matched, so only the internal layout
  // needed correcting here.
  //
  // A later pass added 4 chrome corner arcs here (a "swooping trim"
  // guessed as a vane-swing-motor cover). User feedback after seeing it
  // alongside the housing fix: those arcs read as "4 cái râu" (whiskers) —
  // curled comma shapes sitting oddly on the panel, not as a real
  // mechanical part — and explicitly preferred the simpler mask from
  // before they were added. Removed. Don't reintroduce corner trim like
  // this without a reference photo actually showing it; it was guessed,
  // not sourced, unlike the housing/grille-color fixes elsewhere in this
  // function which came directly from a spec sheet or photo.
  const panel = new THREE.Mesh(new RoundedBoxGeometry(2.3, 2.3, 0.14, 5, 0.12), bodyMat);
  panel.castShadow = true; panel.receiveShadow = true;
  group.add(panel);

  const grille = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.3, 0.03, 4, 0.05), grilleMat);
  grille.position.z = 0.075;
  group.add(grille);
  for (let i = 0; i < 9; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.018, 0.01), slitMat);
    slit.position.set(0, -0.6 + i * 0.15, 0.092);
    group.add(slit);
  }

  const vaneLen = 1.6, vaneW = 0.14, inset = 0.98;
  const vanePositions = [
    { x: 0, y: inset, w: vaneLen, h: vaneW },
    { x: 0, y: -inset, w: vaneLen, h: vaneW },
    { x: inset, y: 0, w: vaneW, h: vaneLen },
    { x: -inset, y: 0, w: vaneW, h: vaneLen },
  ];
  for (const v of vanePositions) {
    const vane = new THREE.Mesh(new RoundedBoxGeometry(v.w, v.h, 0.05, 2, 0.02), vaneMat);
    vane.position.set(v.x, v.y, 0.085);
    group.add(vane);
  }

  // small round sensor/receiver dome in one corner
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
  sensor.rotation.x = Math.PI;
  sensor.position.set(0.95, 0.95, 0.075);
  group.add(sensor);

  // Housing/plenum box — the part that sits above the ceiling tile,
  // normally hidden once installed. User feedback: everything above this
  // point in the function (the white mặt nạ + grille + vanes + corner
  // arcs + sensor) was already correct and should NOT be touched — the
  // thing actually missing was this body.
  //
  // First attempt at this box got the geometry backwards: it stood TALL
  // and floated above the panel in +Y, which read as a disconnected
  // chimney once rotated to a side view. Corrected against real spec
  // sheets (an actual cassette body, e.g. iPAC-30CC: 570×570×260mm W×D×H
  // — a square footprint matching the panel, only ~260mm TALL). So the
  // body isn't a tower sitting above the panel — it's a shallow square
  // slab sitting directly BEHIND the panel along the camera axis (the
  // ceiling-normal direction, which in this "panel faces the camera"
  // convention is -Z, not +Y). Same X/Y center as the panel, not shifted.
  const grayMat = new THREE.MeshPhysicalMaterial({ color: 0xacb3bd, roughness: 0.45, metalness: 0.25 });
  const ventDarkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.1 });

  const HOUSING_SIZE = 2.0; // ~570/647 of the panel's 2.3 — square, matching the panel's footprint
  const HOUSING_DEPTH = 0.92; // ~260/647 of the panel's 2.3 — shallow, not a tall tower
  const panelBackZ = -0.07;
  const housing = new THREE.Mesh(new RoundedBoxGeometry(HOUSING_SIZE, HOUSING_SIZE, HOUSING_DEPTH, 4, 0.08), grayMat);
  housing.position.set(0, 0, panelBackZ - HOUSING_DEPTH / 2);
  housing.castShadow = true; housing.receiveShadow = true;
  group.add(housing);

  // small rectangular vent cutouts on the two visible side faces, spaced
  // along the depth (front-to-back) rather than stacked vertically —
  // these sit on the box's ±X side faces now, not near its top
  for (const side of [-1, 1]) {
    for (const vz of [-0.25, -0.62]) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.16), ventDarkMat);
      vent.position.set(side * (HOUSING_SIZE / 2 + 0.006), 0.35, panelBackZ + vz);
      group.add(vent);
    }
  }

  // small motor/control box bump on the housing's top face
  const bump = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.13, 0.32, 2, 0.03), grayMat);
  bump.position.set(0.3, HOUSING_SIZE / 2 + 0.065, panelBackZ - 0.45);
  group.add(bump);

  // Rest pose is a real 3/4 angle here, not the near-front elevation the
  // other models use — a cassette shown flat-on looks identical to a bare
  // panel (the whole point of this fix was to reveal there's a body
  // behind it at all), which is exactly why every manufacturer product
  // photo of these shows them tilted like this.
  return { group, restY: 0.55, restX: 0.32 };
}

/**
 * Concealed duct unit (giấu trần nối ống gió) — the box unit hides above
 * the ceiling, so what's actually recognizable is the flexible corrugated
 * duct + rectangular diffuser grille it connects to.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildDuctedUnit(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshPhysicalMaterial({ color: 0xb7bbc0, roughness: 0.55, metalness: 0.35 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3d42, roughness: 0.5, metalness: 0.2 });
  const finMat = new THREE.MeshPhysicalMaterial({ color: 0xd4d7db, roughness: 0.4, metalness: 0.3 });
  const copperMat = new THREE.MeshPhysicalMaterial({ color: 0xb5651d, roughness: 0.3, metalness: 0.6 });

  // Rebuilt against the user's reference photo — the previous version
  // (smooth white box + insulation seam + duct-collar rings) had the
  // wrong material and wrong details entirely, guessed rather than
  // checked against a photo. Real catalog photos of this category show
  // the BARE galvanized-steel casing as manufactured (field ductwork is
  // attached later, off-camera for a product shot): a recessed opening
  // exposing the coil near one end of the front face, and an exposed
  // electrical/control box + copper refrigerant pipes on one side face —
  // not a smooth insulation-wrapped shell with a duct already attached.
  // Overall proportions: ~1:3.5 height:width per spec sheets (Samsung
  // AC071RNLDKG: 199×700mm) — unchanged, already correct. Depth WAS wrong
  // though (D=1.0, only 1.25x H and 37% of W) — slim-duct catalog spec
  // sheets (Daikin FDXM-F9: H 200mm, W 750-1150mm, D 620mm; general
  // slim-duct dimension tables) consistently put depth at ~2.5-3x the
  // height and ~55-80% of the width, not a thin bar. Corrected to D=2.0
  // (2.5x H, 74% of W) — these units are a fairly chunky box front-to-back,
  // not a shallow slab.
  const WIDTH = 2.7, H = 0.8, D = 2.0;
  const box = new THREE.Mesh(new RoundedBoxGeometry(WIDTH, H, D, 3, 0.05), metalMat);
  box.castShadow = true; box.receiveShadow = true;
  group.add(box);

  // Recessed coil-access opening — spans most of the unit's LENGTH (the
  // coil is the heat exchanger, it needs maximum surface area, so it runs
  // nearly the full width minus the control-box end), not a small square
  // patch. First pass made this only 0.85 wide against a 2.7-wide unit
  // (31%) — way too small next to the reference photo, where the opening
  // clearly spans most of the casing, leaving room only for the
  // control-box section at the opposite end.
  const coilX = -0.3;
  const coilFrame = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.5, 0.04, 2, 0.02), darkMat);
  coilFrame.position.set(coilX, 0.02, D / 2 + 0.015);
  group.add(coilFrame);
  for (let i = 0; i < 7; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.03, 0.02), finMat);
    fin.position.set(coilX, -0.19 + i * 0.065, D / 2 + 0.04);
    group.add(fin);
  }

  // electrical/control box + copper refrigerant pipes + a valve, all on
  // the opposite end's side face — a different face than the coil opening,
  // which is why this model needs a real 3/4 rest angle to show both at
  // once (see restY/restX below).
  const ctrlBox = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.4, 0.22, 2, 0.03), darkMat);
  ctrlBox.position.set(WIDTH / 2 + 0.02, 0.15, 0.5);
  group.add(ctrlBox);
  // Both pipes kept at the SAME z (near the front edge, z=0.6) and spread
  // in y instead — stacked one above the other rather than separated along
  // depth. Separating them along z (an earlier pass) put one pipe far
  // enough toward the back that it fell behind the unit's own silhouette
  // from this rest angle once D was doubled to 2.0 (see WIDTH/H/D comment
  // above): the box's own front-right corner projects over that screen
  // region at this camera angle, hiding anything not near the front edge,
  // even though the pipe geometry itself doesn't intersect the box. Two
  // pipes at slightly different heights next to the same fitting also
  // matches how these actually look in reference photos (twin refrigerant
  // lines exiting close together near one valve).
  for (const py of [0.05, -0.22]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 12), copperMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(WIDTH / 2 + 0.22, py, 0.6);
    pipe.castShadow = true;
    group.add(pipe);
  }
  const valve = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), copperMat);
  valve.position.set(WIDTH / 2 + 0.09, -0.22, 0.42);
  group.add(valve);

  return { group, restY: 0.4, restX: 0.3 };
}

/**
 * Floor-standing unit (tủ đứng) — a tall vertical cabinet.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildFloorStanding(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.3, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x6b7280, roughness: 0.5, metalness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1c2230, roughness: 0.15, metalness: 0.3 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.05, 2.6, 0.75, 4, 0.1), bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const display = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.1, 0.05, 3, 0.02), glassMat);
  display.position.set(-0.05, 1.05, 0.39);
  group.add(display);
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x4f8dff, emissive: 0x2f6fe0, emissiveIntensity: 1.6, roughness: 0.2 }),
  );
  led.position.set(0.18, 1.05, 0.42);
  group.add(led);

  for (let i = 0; i < 6; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.02), darkMat);
    slat.position.set(0, -1.05 + i * 0.09, 0.39);
    group.add(slat);
  }

  return { group, restY: 0.1, restX: 0.05 };
}

/**
 * Ceiling-exposed low-profile unit (áp trần) — wide, thin, flush against
 * the ceiling; a linear discharge vent along the front-bottom edge (not a
 * hinged flap like the wall unit — these are typically fixed louvres).
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildCeilingExposed(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.3, metalness: 0.05, clearcoat: 0.55, clearcoatRoughness: 0.25 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x25282e, roughness: 0.45, metalness: 0.15 });
  const silverMat = new THREE.MeshPhysicalMaterial({ color: 0xc7ccd4, roughness: 0.3, metalness: 0.55 });

  // Rebuilt against an actual reference photo after the first two passes
  // were both wrong (see docs/interactive-3d-icon-pattern.md "Research
  // near-lookalike variants"). Confirmed from the photo + product-spec
  // search: mounted close/flush to the ceiling (NOT hanging on visible
  // rods — that was a fabricated detail with no source), a slim wide slab
  // (not the boxier shape the second pass over-corrected to), and the
  // front-facing edge has two distinct bands: a ribbed silver/chrome strip
  // above a dark grille of DIAGONAL slats (not straight horizontal —
  // confirmed against the photo, which shows angled fins, not a flat
  // louvre strip).
  // Real spec sheets (Daikin FHA-A9 ceiling-suspended: H 235mm, W
  // 960-1590mm, D 690mm) put depth at ~3x the height — this model's first
  // pass made D only ~1.5x H, so it rendered as a thin flat slab instead
  // of a proper chunky box. D corrected to match that ratio.
  const WIDTH = 2.9, H = 0.55, D = 1.6;
  const body = new THREE.Mesh(new RoundedBoxGeometry(WIDTH, H, D, 4, 0.1), bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // upper band: ribbed metallic strip
  const silverY = 0.11;
  const silverBand = new THREE.Mesh(new RoundedBoxGeometry(WIDTH - 0.3, 0.15, 0.03, 3, 0.02), silverMat);
  silverBand.position.set(0, silverY, D / 2 + 0.02);
  group.add(silverBand);
  const ribCount = 20;
  for (let i = 0; i < ribCount; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.12, 0.015), darkMat);
    rib.position.set(-((WIDTH - 0.3) / 2) + 0.08 + i * ((WIDTH - 0.46) / (ribCount - 1)), silverY, D / 2 + 0.04);
    group.add(rib);
  }

  // lower band: dark grille with diagonal slats
  const grilleY = -0.13;
  const grille = new THREE.Mesh(new RoundedBoxGeometry(WIDTH - 0.3, 0.28, 0.03, 3, 0.03), darkMat);
  grille.position.set(0, grilleY, D / 2 + 0.02);
  group.add(grille);
  const slatCount = 18;
  const slatAngle = 0.45; // ~26°, matches the diagonal fin angle in the reference photo
  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.27, 0.014), bodyMat);
    slat.rotation.z = slatAngle;
    slat.position.set(-((WIDTH - 0.3) / 2) + 0.14 + i * ((WIDTH - 0.58) / (slatCount - 1)), grilleY, D / 2 + 0.045);
    group.add(slat);
  }

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x4f8dff, emissive: 0x2f6fe0, emissiveIntensity: 1.6, roughness: 0.2 }),
  );
  led.position.set(WIDTH / 2 - 0.22, silverY, D / 2 + 0.05);
  group.add(led);

  return { group, restY: 0.1, restX: 0.06 };
}

/**
 * Fresh-air / heat-recovery ventilator (máy cấp khí tươi thu hồi nhiệt) —
 * researched against a Daikin ceiling-suspended ERV catalog (full spec +
 * dimensional drawing + product photo), since this category shares the
 * exact same "compact horizontal design for ceiling application"
 * architecture across brands including Menred's ducted line — this isn't
 * a Daikin-specific shape, it's the standard form factor for this whole
 * product category.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildFreshAirUnit(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.32, metalness: 0.05, clearcoat: 0.55, clearcoatRoughness: 0.25 });
  const ductMat = new THREE.MeshPhysicalMaterial({ color: 0xc7ccd4, roughness: 0.5, metalness: 0.15 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.1 });

  // Previous pass modeled this as a near-cube (1.7×1.1×0.9 ≈ 1.9:1.2:1)
  // with a slatted front grille that had no basis in any reference — pure
  // guess. Daikin's ERV catalog (250D-1000D, all 4 sizes share the same
  // L/W/H) gives real numbers: 1940×1000×550mm = 3.53:1.82:1 (L:D:H),
  // i.e. a long, flat box, not a cube. Also: no front grille at all on the
  // real unit — the front is a plain insulated panel, air only moves
  // through round duct spigots at the two ENDS. WIDTH/H/D below scaled
  // from that ratio, keeping H the free variable to match this batch's
  // shared bounding size (~3.2 units, see the doc's "Modeling" section).
  const WIDTH = 3.2, H = 0.9, D = 1.65;
  const box = new THREE.Mesh(new RoundedBoxGeometry(WIDTH, H, D, 4, 0.08), bodyMat);
  box.castShadow = true; box.receiveShadow = true;
  group.add(box);

  // Double-skin panel seam, running the length of the top — a visible
  // construction line in the reference photo, not a functional part.
  const seam = new THREE.Mesh(new THREE.BoxGeometry(WIDTH - 0.1, 0.015, 0.015), darkMat);
  seam.position.set(0, H / 2, 0);
  group.add(seam);

  // 4 round duct spigots total — 2 per END face, side-by-side along depth
  // (not stacked vertically, and not 1-per-side like the previous pass).
  // Real unit: intake (fresh air in) + exhaust (extract air out) share one
  // end; return-air-in + supply-air-out share the other end. Port
  // diameter ~330mm against a 550mm-tall casing (60%) per the dimensional
  // drawing — scaled here to H * 0.6 radius-equivalent.
  const portRadius = H * 0.3;
  const portLen = 0.22;
  for (const side of [-1, 1]) {
    for (const pz of [-D * 0.27, D * 0.27]) {
      const port = new THREE.Mesh(new THREE.CylinderGeometry(portRadius, portRadius, portLen, 24), ductMat);
      port.rotation.z = Math.PI / 2;
      port.position.set(side * (WIDTH / 2 + portLen / 2 - 0.02), 0, pz);
      port.castShadow = true;
      group.add(port);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(portRadius, 0.025, 8, 20), darkMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(side * (WIDTH / 2 + portLen - 0.02), 0, pz);
      group.add(ring);
    }
  }

  // External control box on one long side, mounted proud of the casing —
  // visible as a light attached enclosure in the reference photo's
  // exploded/assembled views, not part of the main casing body.
  const ctrlBox = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.22, 3, 0.04), bodyMat);
  ctrlBox.position.set(-WIDTH * 0.28, 0, D / 2 + 0.11);
  ctrlBox.castShadow = true;
  group.add(ctrlBox);
  const ctrlSeam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 0.01), darkMat);
  ctrlSeam.position.set(-WIDTH * 0.28, 0.16, D / 2 + 0.225);
  group.add(ctrlSeam);

  // Small nameplate on the main casing front, opposite the control box.
  const nameplate = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.22, 0.015, 3, 0.02), darkMat);
  nameplate.position.set(WIDTH * 0.22, 0.05, D / 2 + 0.012);
  group.add(nameplate);

  // Both ends carry a port pair, and the control box sits on a side face —
  // a real 3/4 angle is needed to show a full end (both its ports) and the
  // control-box side at once, same reasoning as ducted-unit/cassette.
  return { group, restY: 0.32, restX: 0.14 };
}

/**
 * Ducting accessories kit (phụ kiện đồng bộ của hệ thống cấp gió tươi) —
 * not a single product; a manifold fitting with several corrugated stubs
 * radiating out, reading as "a bundle of parts" rather than one device.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildDuctingKit(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const ductMat = new THREE.MeshPhysicalMaterial({ color: 0xc7ccd4, roughness: 0.55, metalness: 0.15 });
  const fittingMat = new THREE.MeshPhysicalMaterial({ color: 0x8b93a1, roughness: 0.4, metalness: 0.35 });
  const greenMat = new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.5, metalness: 0.1 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.15 });

  const HUB = 0.55;
  const hub = new THREE.Mesh(new RoundedBoxGeometry(HUB, HUB, HUB, 4, 0.1), fittingMat);
  hub.castShadow = true; hub.receiveShadow = true;
  group.add(hub);

  // Each stub's ring chain starts at the hub's half-extent (HUB / 2) along
  // local +X and is only ever *rotated*, never translated — the stub
  // group's origin stays exactly at the hub's center, so no matter the
  // rotation the first ring stays flush against the hub surface instead of
  // floating disconnected in space (what a position+rotation combo did on
  // the first pass — translating the offset ring stack, then rotating it,
  // moves the anchor point away from the hub).
  function addStub(mat, rotY, rotZ, ringCount) {
    const stub = new THREE.Group();
    for (let i = 0; i < ringCount; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 8, 16), mat);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = HUB / 2 + i * 0.13;
      ring.castShadow = true;
      stub.add(ring);
    }
    stub.rotation.set(0, rotY, rotZ);
    group.add(stub);
  }

  addStub(ductMat, 0, 0.4, 5);
  addStub(greenMat, 1.9, -0.3, 4);

  for (const p of [[-0.35, -0.42, 0.32], [0.4, 0.4, -0.28]]) {
    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), darkMat);
    clamp.position.set(p[0], p[1], p[2]);
    clamp.rotation.x = Math.PI / 3;
    group.add(clamp);
  }

  return { group, restY: 0.3, restX: 0.15 };
}

/**
 * RO water filter (máy lọc nước RO 3 in 1) — tank + a faucet spout + a
 * falling water droplet, the combination that reads unambiguously as
 * "water filtration" rather than any other white plastic box.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildWaterFilter(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.3, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const metalMat = new THREE.MeshPhysicalMaterial({ color: 0xc3c8d1, roughness: 0.35, metalness: 0.4 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1c2230, roughness: 0.15, metalness: 0.3 });
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8, roughness: 0.1, metalness: 0.05, transmission: 0.4, transparent: true, opacity: 0.9,
  });

  const tank = new THREE.Mesh(new RoundedBoxGeometry(0.85, 1.7, 0.55, 4, 0.12), bodyMat);
  tank.castShadow = true; tank.receiveShadow = true;
  group.add(tank);

  const display = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.14, 0.03, 3, 0.02), glassMat);
  display.position.set(0, 0.6, 0.29);
  group.add(display);

  const faucet = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 16), metalMat);
  faucet.add(stem);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16), metalMat);
  spout.rotation.z = Math.PI / 2;
  spout.position.set(0.22, 0.22, 0);
  faucet.add(spout);
  const spoutTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), metalMat);
  spoutTip.position.set(0.44, 0.22, 0);
  faucet.add(spoutTip);
  faucet.position.set(0.55, -0.55, 0.15);
  faucet.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(faucet);

  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), waterMat);
  drop.scale.set(0.8, 1.3, 0.8);
  drop.position.set(0.99, -0.95, 0.15);
  group.add(drop);

  return { group, restY: 0.1, restX: 0.08 };
}

/**
 * Wall control panel (bảng điều khiển) — plate + rotary dial + display.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildControlPanel(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.3, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1c2230, roughness: 0.15, metalness: 0.3 });

  const plate = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.7, 0.14, 4, 0.1), bodyMat);
  plate.castShadow = true; plate.receiveShadow = true;
  group.add(plate);

  const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 12, 32), darkMat);
  dialRing.position.set(0, 0.35, 0.09);
  group.add(dialRing);
  const dialFace = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 32), bodyMat);
  dialFace.rotation.x = Math.PI / 2;
  dialFace.position.set(0, 0.35, 0.1);
  group.add(dialFace);
  const dialIndicator = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.02), darkMat);
  dialIndicator.position.set(0, 0.5, 0.13);
  group.add(dialIndicator);

  const display = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.18, 0.03, 3, 0.02), glassMat);
  display.position.set(0, -0.15, 0.09);
  group.add(display);

  for (const x of [-0.25, 0.25]) {
    const btn = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.14, 0.04, 3, 0.03), darkMat);
    btn.position.set(x, -0.55, 0.1);
    group.add(btn);
  }

  return { group, restY: 0.08, restX: 0.06 };
}

/**
 * Smart switch (công tắc thông minh) — wall plate + two rocker paddles.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildSmartSwitch(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.3, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x2b2f36, roughness: 0.35, metalness: 0.15, clearcoat: 0.3 });

  const plate = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.7, 0.12, 4, 0.12), bodyMat);
  plate.castShadow = true; plate.receiveShadow = true;
  group.add(plate);

  for (const y of [0.4, -0.4]) {
    const rocker = new THREE.Mesh(new RoundedBoxGeometry(0.65, 0.55, 0.06, 3, 0.1), darkMat);
    rocker.position.set(0, y, 0.09);
    rocker.castShadow = true;
    group.add(rocker);
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 12, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x4f8dff, emissive: 0x2f6fe0, emissiveIntensity: 1.6, roughness: 0.2 }),
    );
    led.position.set(0.24, y - 0.2, 0.13);
    group.add(led);
  }

  return { group, restY: 0.08, restX: 0.06 };
}

/**
 * Smart sensor (cảm biến thông minh) — a compact puck with a lens and a
 * glowing status ring, oriented so its flat face (not its rim) faces the
 * camera — that's the side that's actually recognizable as a sensor.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildSmartSensor(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.28, metalness: 0.06, clearcoat: 0.7, clearcoatRoughness: 0.15 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.15 });
  const ledMat = new THREE.MeshPhysicalMaterial({ color: 0x4f8dff, emissive: 0x2f6fe0, emissiveIntensity: 1.4, roughness: 0.2 });

  const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.3, 48), bodyMat);
  puck.rotation.x = Math.PI / 2;
  puck.castShadow = true; puck.receiveShadow = true;
  group.add(puck);

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32), darkMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.16;
  group.add(lens);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.02, 8, 40), ledMat);
  ring.position.z = 0.15;
  group.add(ring);
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.06, restX: 0.06 };
}

/**
 * Handheld remote (remote cầm tay) — vertical body, display, button grid,
 * IR emitter. Same silhouette family as the branch-select toolbox
 * component's tool props, but this is the actual selectable category.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildRemote(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.32, metalness: 0.05, clearcoat: 0.55, clearcoatRoughness: 0.25 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x2b2f36, roughness: 0.35, metalness: 0.15 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1c2230, roughness: 0.15, metalness: 0.3 });
  const ledMat = new THREE.MeshPhysicalMaterial({ color: 0x4f8dff, emissive: 0x2f6fe0, emissiveIntensity: 1.6, roughness: 0.2 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.85, 2.3, 0.28, 4, 0.14), bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const display = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.35, 0.04, 3, 0.03), glassMat);
  display.position.set(0, 0.75, 0.15);
  group.add(display);

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      const btn = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.16, 0.04, 3, 0.03), darkMat);
      btn.position.set(-0.19 + c * 0.38, 0.28 - r * 0.26, 0.15);
      group.add(btn);
    }
  }

  const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), ledMat);
  emitter.position.set(0, 1.08, 0.13);
  group.add(emitter);

  return { group, restY: 0.06, restX: 0.08 };
}

// ---------------------------------------------------------------------
// Service groups (nhóm dịch vụ) —
// ServiceGroupPickerStep.tsx ("Bạn cần nhóm dịch vụ nào?"). Every one of
// these 6 is a service ACTION, not a physical product — same situation as
// "Dịch vụ" in BranchSelectStep (buildToolbox), so each gets a
// representative object standing in for the action (see "Abstract
// concepts / actions have no shape — use metonymy" in
// docs/interactive-3d-icon-pattern.md) rather than a literal render of
// "cleaning" or "trading in." No spec-sheet research needed here the way
// the AC sub-type products required — these are everyday objects
// (wrench, spray bottle, price tag), not equipment with brand-specific
// dimensions to get wrong.
// ---------------------------------------------------------------------

/**
 * Cung cấp & lắp đặt (supply & install) — a wall-mount bracket + wrench +
 * loose screws: the concrete hardware of an install job, more specific
 * than the generic toolbox+wrench that already stands for "Dịch vụ" as a
 * whole in BranchSelectStep.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildInstallKit(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bracketMat = new THREE.MeshPhysicalMaterial({ color: 0xb0b6c0, roughness: 0.45, metalness: 0.4 });
  const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.15 });
  const wrenchMat = new THREE.MeshPhysicalMaterial({ color: 0xc3c8d1, roughness: 0.4, metalness: 0.45 });
  const screwMat = new THREE.MeshPhysicalMaterial({ color: 0x9aa1ab, roughness: 0.4, metalness: 0.5 });

  const bracket = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.1, 0.08, 3, 0.06), bracketMat);
  bracket.castShadow = true; bracket.receiveShadow = true;
  group.add(bracket);

  for (const x of [-0.75, 0.75]) {
    for (const y of [0.35, -0.35]) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 16), darkMat);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(x, y, 0.02);
      group.add(hole);
    }
  }

  // wrench laid diagonally across the bracket — same bar+ring-head shape
  // as buildToolbox's wrench, reused deliberately for visual consistency
  // across every "tool" reference in this flow.
  const wrench = new THREE.Group();
  const bar = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.16, 0.09, 3, 0.03), wrenchMat);
  wrench.add(bar);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.09, 12, 24), wrenchMat);
  head.position.set(0.85, 0, 0);
  wrench.add(head);
  wrench.rotation.z = 0.5;
  wrench.position.set(-0.1, 0.05, 0.16);
  wrench.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(wrench);

  for (const [x, y] of [[0.95, -0.62], [1.15, -0.8]]) {
    const screw = new THREE.Group();
    const screwHead = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 6), screwMat);
    screw.add(screwHead);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), screwMat);
    shaft.position.y = -0.08;
    screw.add(shaft);
    screw.rotation.z = 0.3;
    screw.position.set(x, y, 0.12);
    group.add(screw);
  }

  return { group, restY: 0.1, restX: 0.12 };
}

/**
 * Vệ sinh bảo trì (cleaning & maintenance) — spray bottle + folded cloth,
 * the literal tools of the job (this one IS a physical object, no
 * metonymy substitution needed, same as buildWaterFilter).
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildCleaningSpray(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: 0x5eead4, roughness: 0.15, metalness: 0.05, transmission: 0.35, transparent: true, opacity: 0.92,
  });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.2 });
  const clothMat = new THREE.MeshPhysicalMaterial({ color: 0x60a5fa, roughness: 0.7, metalness: 0.02 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.62, 1.3, 0.4, 4, 0.14), bottleMat);
  body.position.y = -0.05;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.2, 16), capMat);
  neck.position.y = 0.65;
  group.add(neck);

  const triggerBody = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.28, 0.28, 3, 0.05), capMat);
  triggerBody.position.set(0, 0.85, 0.05);
  group.add(triggerBody);

  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.22, 12), capMat);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0.22, 0.92, 0.05);
  group.add(nozzle);

  const trigger = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.18, 0.16, 2, 0.02), capMat);
  trigger.position.set(-0.02, 0.72, 0.22);
  trigger.rotation.x = -0.3;
  group.add(trigger);

  // folded cloth beside the bottle
  const cloth = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.12, 0.6, 3, 0.05), clothMat);
  cloth.position.set(0.72, -0.68, -0.02);
  cloth.rotation.y = 0.15;
  cloth.castShadow = true;
  group.add(cloth);
  const clothFold = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.1, 0.55, 3, 0.05), clothMat);
  clothFold.position.set(0.7, -0.56, 0.03);
  clothFold.rotation.y = -0.1;
  group.add(clothFold);

  return { group, restY: 0.15, restX: 0.06 };
}

/**
 * Thu cũ đổi mới (trade-in old for new) — two chasing curved arrows
 * forming an exchange/cycle loop. Pure concept with no object referent at
 * all (not even a tool), so this stays purely symbolic — same shape
 * language as a "sync"/"refresh" icon, translated into 3D via two partial
 * TorusGeometry arcs with cone arrowheads, rather than picking a random
 * physical stand-in.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildTradeIn(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const matA = new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, roughness: 0.35, metalness: 0.25 });
  const matB = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.25 });

  function buildArrow(mat, startAngle) {
    const arcGroup = new THREE.Group();
    const arcLength = Math.PI * 0.78;
    const radius = 0.75;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.09, 12, 32, arcLength), mat);
    arc.rotation.z = startAngle;
    arc.castShadow = true;
    arcGroup.add(arc);

    const tipAngle = startAngle + arcLength;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 16), mat);
    head.position.set(Math.cos(tipAngle) * radius, Math.sin(tipAngle) * radius, 0);
    head.rotation.z = tipAngle + Math.PI / 2;
    head.castShadow = true;
    arcGroup.add(head);
    return arcGroup;
  }

  group.add(buildArrow(matA, 0));
  group.add(buildArrow(matB, Math.PI));
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.06, restX: 0.06 };
}

/**
 * Thanh lý máy lạnh (AC clearance sale) — an AC unit with a price tag
 * hanging off it. Reuses buildAcUnit's silhouette at a smaller scale
 * rather than re-modeling a wall-split from scratch — the object being
 * cleared out is the same product as the "treo tường" category, no
 * reason to duplicate that geometry.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildClearanceTag(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const { group: acGroup } = buildAcUnit(THREE, RoundedBoxGeometry);
  acGroup.scale.setScalar(0.7);
  acGroup.position.set(-0.3, 0.15, 0);
  group.add(acGroup);

  const tagMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.05 });
  const stringMat = new THREE.MeshPhysicalMaterial({ color: 0xe5e7eb, roughness: 0.5, metalness: 0.1 });

  // Classic price-tag silhouette: a rectangle with a triangular point on
  // the left, plus a punch-hole near the point for the string.
  const tagShape = new THREE.Shape();
  tagShape.moveTo(-0.5, 0);
  tagShape.lineTo(-0.2, 0.28);
  tagShape.lineTo(0.5, 0.28);
  tagShape.lineTo(0.5, -0.28);
  tagShape.lineTo(-0.2, -0.28);
  tagShape.closePath();
  const holePath = new THREE.Path();
  holePath.absarc(-0.32, 0, 0.055, 0, Math.PI * 2, false);
  tagShape.holes.push(holePath);

  const tagGeo = new THREE.ExtrudeGeometry(tagShape, {
    depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2,
  });
  const tag = new THREE.Mesh(tagGeo, tagMat);
  tag.position.set(0.72, -0.35, 0.1);
  tag.rotation.z = -0.35;
  tag.castShadow = true;
  group.add(tag);

  const string = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 20), stringMat);
  string.position.set(0.42, 0.02, 0.1);
  group.add(string);

  return { group, restY: 0.1, restX: 0.08 };
}

/**
 * Cho thuê (rental) — an AC unit + a wall clock, the clock standing in
 * for "temporary/short-term" the way a calendar icon usually would.
 * Reuses buildAcUnit the same way buildClearanceTag does.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildRentalClock(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const { group: acGroup } = buildAcUnit(THREE, RoundedBoxGeometry);
  acGroup.scale.setScalar(0.62);
  // Pushed further left/apart from the clock than a first pass had it —
  // that version put the clock enough in front of (and overlapping) the
  // AC unit's right side that it covered the display/LED, the one detail
  // that actually reads as "air conditioner" rather than a plain white
  // tube. Separating them so both silhouettes stay independently visible.
  acGroup.position.set(-0.85, 0.35, 0);
  group.add(acGroup);

  const faceMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.05, clearcoat: 0.5 });
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.3 });
  const handMat = new THREE.MeshPhysicalMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.1 });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: 0x4f8dff, roughness: 0.3, metalness: 0.2, emissive: 0x2f6fe0, emissiveIntensity: 0.4,
  });

  const clock = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.09, 40), rimMat);
  rim.rotation.x = Math.PI / 2;
  clock.add(rim);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 40), faceMat);
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.02;
  clock.add(face);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.02), handMat);
    tick.position.set(Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0.05);
    tick.rotation.z = -a;
    clock.add(tick);
  }

  // Hands pivot from the clock's center: geometry is translated so one end
  // sits at the local origin *before* the mesh is placed at the clock
  // center, so rotation.z sweeps around that center instead of around the
  // hand's own midpoint (a box left at its default centered origin would
  // rotate around its own middle, not its attachment point).
  const hourGeo = new RoundedBoxGeometry(0.05, 0.26, 0.025, 2, 0.02);
  hourGeo.translate(0, 0.13, 0);
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.position.set(0, 0, 0.06);
  hourHand.rotation.z = -0.6;
  clock.add(hourHand);

  const minGeo = new RoundedBoxGeometry(0.04, 0.38, 0.025, 2, 0.02);
  minGeo.translate(0, 0.19, 0);
  const minHand = new THREE.Mesh(minGeo, handMat);
  minHand.position.set(0, 0, 0.07);
  minHand.rotation.z = 1.3;
  clock.add(minHand);

  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), accentMat);
  pin.position.z = 0.08;
  clock.add(pin);

  clock.position.set(0.85, 0.1, 0.15);
  clock.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(clock);

  return { group, restY: 0.15, restX: 0.08 };
}

/**
 * Khác (other/uncategorized) — three dots, a direct 3D translation of the
 * flat "..." ellipsis icon. No better object-level metonymy exists for
 * "an uncategorized bucket" — the ellipsis itself already IS the
 * universal symbol for "more/other," so it's kept as-is rather than
 * forcing an arbitrary object onto it.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildMoreDots(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const dotMat = new THREE.MeshPhysicalMaterial({ color: 0x9ca3af, roughness: 0.4, metalness: 0.15 });
  for (const x of [-0.55, 0, 0.55]) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), dotMat);
    dot.position.x = x;
    dot.castShadow = true;
    group.add(dot);
  }
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.06, restX: 0.06 };
}

// ---------------------------------------------------------------------
// Project types (loại công trình) —
// ProjectTypePickerStep.tsx ("Loại công trình của bạn?"). Unlike the
// service-group actions above, these ARE physical objects (buildings) —
// same situation as `building` in BranchSelectStep — so each gets a
// literal building silhouette distinguished by one clear feature (a
// school's cap+flagpole, a hospital's cross, a factory's sawtooth roof),
// following buildBuilding's own "two boxes + window grid" technique
// rather than needing metonymy. Two exceptions read better as pure
// symbols instead of an ambiguous building shape — "vui chơi giải trí"
// (entertainment) and "nhà hàng tiệc cưới" (restaurant/wedding hall)
// don't have one obvious building form, so they follow the flat icon's
// own precedent (a balloon, a toast) rather than forcing architecture.
// "Văn phòng" (office) reuses `buildBuilding` directly rather than
// duplicating it — the existing model already IS a generic office-tower
// pair, same reasoning as `ac-unit` being reused for "treo tường".
// ---------------------------------------------------------------------

/**
 * Căn hộ dịch vụ (serviced apartment) — a Kenney "Modular Buildings"
 * sample apartment tower (see "Pre-made assets (Kenney)" in the doc).
 *
 * Went through 2 wrong readings before this: pass 1 modeled a hand-built
 * tower + a magnifying glass (copying the flat icon's own "lookup"
 * detail literally); pass 2 swapped that for a reception bell, reasoning
 * "serviced" meant hotel-style hospitality service. User corrected this
 * directly: "căn hộ dịch vụ" here means a *for-rent apartment* building
 * (same category as chung cư), not literal "service" — so no
 * hospitality-metonymy prop belongs on it at all. Uses a different
 * Kenney building than `apartment-tower` (Modular's warm/arched style vs.
 * Commercial's cool-toned balcony block) so the two rental-apartment
 * categories don't look identical.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildServicedApartment(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const building = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/modular/serviced-apartment.glb");
  group.add(building);
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.15, restX: 0.06 };
}

/**
 * Cơ sở giáo dục (education) — a literal school building, not a
 * graduation-cap accessory. First pass used a floating mortarboard cap
 * (matching the flat icon's own metonymy), but "loại công trình" is
 * asking what building type is being constructed — every sibling category
 * in this step (factory, storefront, gov-building, hospital, villa,
 * townhouse, apartment) is an actual building, so a cap read as
 * inconsistent with its neighbors once actually compared side by side.
 * Researched Vietnamese school architecture specifically rather than
 * generic "school": tropical-climate classroom blocks typically have an
 * OPEN-AIR corridor with a railing on each floor (not enclosed glass,
 * for ventilation) and are commonly painted yellow-ochre (the standard
 * Vietnamese public-school color) — both used here as the features that
 * distinguish this from the office/apartment tower models, which use
 * enclosed glass windows instead. A flagpole is near-universal in front of
 * Vietnamese schools (mandatory flag-raising ceremonies), so it's the
 * other distinguishing prop.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildSchoolBuilding(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xf4c542, roughness: 0.5, metalness: 0.03 });
  const railMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.1 });
  const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x7c2d12, roughness: 0.5, metalness: 0.05 });
  const poleMat = new THREE.MeshPhysicalMaterial({ color: 0xd1d5db, roughness: 0.3, metalness: 0.5 });
  const flagMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.5, metalness: 0.02, side: THREE.DoubleSide });

  const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.6, 0.9, 3, 0.03), wallMat);
  body.position.y = -0.15;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const roofCap = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.1, 1.0, 2, 0.02), roofMat);
  roofCap.position.y = 0.7;
  group.add(roofCap);

  // Open-corridor railings per floor, instead of glass windows — the
  // detail that reads as "school" rather than office/apartment.
  for (const y of [0.35, -0.15, -0.65]) {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.03, 0.02, 1, 0.01), railMat);
    rail.position.set(0, y, 0.46);
    group.add(rail);
    for (let i = 0; i < 9; i++) {
      const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.02), railMat);
      baluster.position.set(-1.05 + i * 0.26, y - 0.14, 0.46);
      group.add(baluster);
    }
  }

  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), poleMat);
  flagPole.position.set(1.5, 0.1, 0.7);
  group.add(flagPole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.24), flagMat);
  flag.position.set(1.68, 0.75, 0.7);
  group.add(flag);

  return { group, restY: 0.15, restX: 0.06 };
}

/**
 * Cơ sở kinh doanh (business/commercial establishment) — a Kenney "City Kit
 * Commercial" storefront building (see "Pre-made assets (Kenney)" in the
 * doc) + a hand-built striped awning attached over the entrance. First
 * pass hand-built the whole storefront from primitives; kept the awning
 * (a detail the asset pack doesn't have) but replaced the building body
 * with the loaded asset for more architectural detail than primitives
 * alone were delivering.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildStorefront(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const awningMatA = new THREE.MeshPhysicalMaterial({ color: 0xea580c, roughness: 0.5, metalness: 0.05 });
  const awningMatB = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.05 });

  const building = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/commercial/storefront.glb");
  building.position.y -= 0.3;
  group.add(building);

  // Striped awning — the one detail the Kenney asset doesn't have and
  // that actually reads as "storefront" rather than a generic office;
  // positioned relative to the loaded building's own normalized bounds.
  const awning = new THREE.Mesh(new RoundedBoxGeometry(2.35, 0.35, 0.55, 2, 0.05), awningMatA);
  awning.rotation.x = -0.35;
  awning.position.set(0, 0.75, 0.95);
  awning.castShadow = true;
  group.add(awning);
  const stripeCount = 6;
  for (let i = 0; i < stripeCount; i += 2) {
    const stripe = new THREE.Mesh(new RoundedBoxGeometry((2.35 / stripeCount) * 0.85, 0.36, 0.02, 1, 0.01), awningMatB);
    stripe.rotation.x = -0.35;
    stripe.position.set(-1.15 + (2.35 / stripeCount) * (i + 0.5), 0.75, 1.22);
    group.add(stripe);
  }

  return { group, restY: 0.12, restX: 0.06 };
}

/**
 * Công trình công nghiệp (industrial) — a Kenney "City Kit Industrial"
 * warehouse (which already has a real sawtooth roof, unlike the earlier
 * hand-built version) + a separately-loaded chimney asset from the same
 * pack (see "Pre-made assets (Kenney)" in the doc). Both pieces are
 * loaded assets here, not one asset plus a hand-built prop like
 * storefront/hospital/villa-house — City Kit Industrial ships the
 * chimney as its own separate piece rather than attached to any
 * building, matching how this project already composes multiple
 * sub-models (e.g. buildRentalClock's AC unit + clock).
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildFactory(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const [building, chimney] = await Promise.all([
    loadGltfModel(THREE, GLTFLoader, "/models/kenney/industrial/factory.glb"),
    loadGltfModel(THREE, GLTFLoader, "/models/kenney/industrial/chimney.glb"),
  ]);
  building.position.y -= 0.2;
  group.add(building);

  // Chimney normalized to the same shared 2.6-unit scale as the building
  // by loadGltfModel, so it needs scaling back down and repositioning to
  // sit beside the warehouse at a proportionate real-world size instead
  // of matching the building's own height. Pulled in closer to the
  // building's corner than a first pass had it — that version left a
  // visible gap that read as "two unrelated objects" rather than "a
  // chimney attached to the building."
  chimney.scale.multiplyScalar(0.55);
  chimney.position.set(0.85, 0.15, -0.15);
  group.add(chimney);
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  // This building's sawtooth roof ridges run shallow (front-to-back) and
  // read as a flat, recessed rooftop from a near-front elevation — the
  // shared default angle every other model in this batch uses. A much
  // steeper pitch is needed to actually see the sawtooth profile, closer
  // to how it was confirmed to look in the standalone asset-preview
  // render (a 3/4-elevated angle) than to this batch's usual near-eye-
  // level framing.
  return { group, restY: 0.3, restX: 0.4 };
}

/**
 * Showroom — a building with a display window (not the whole facade) and
 * a mannequin figure on a pedestal beside an entrance door.
 *
 * First pass made the glass panel 2.1×1.35 against a 2.4×1.7 body — 87%
 * of the width and 79% of the height, leaving almost no visible wall
 * material around it, plus no roofline cap and no door. User feedback
 * ("sao cái showroom nó kì thế?" + a screenshot) confirmed what that adds
 * up to: the whole box read as a flat screen/monitor showing a pictogram,
 * not a building with a display window in it. Fixed by shrinking the
 * glass to a real "window in a wall" proportion, adding a dark roofline
 * cap so the top edge doesn't blend into the glass, and adding a proper
 * entrance door beside the window instead of leaving the mannequin
 * standing exposed across the entire face.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildShowroom(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.35, metalness: 0.05 });
  const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.15 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd, roughness: 0.1, metalness: 0.15, transmission: 0.4, transparent: true, opacity: 0.75,
  });
  const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.15 });
  const pedestalMat = new THREE.MeshPhysicalMaterial({ color: 0xd1d5db, roughness: 0.4, metalness: 0.2 });
  const figureMat = new THREE.MeshPhysicalMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.05 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.7, 1.0, 3, 0.06), bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const roofCap = new THREE.Mesh(new RoundedBoxGeometry(2.46, 0.12, 1.06, 2, 0.02), roofMat);
  roofCap.position.y = 0.91;
  group.add(roofCap);

  // Display window sized like a real shop window relative to the wall
  // (~54% of the facade width, not 87%) — offset toward one side so a
  // separate door fits beside it, the detail the first pass was missing.
  const glassPanel = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.0, 0.04, 3, 0.03), glassMat);
  glassPanel.position.set(-0.45, 0.05, 0.51);
  group.add(glassPanel);
  const glassFrame = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.1, 0.06, 3, 0.03), doorMat);
  glassFrame.position.set(-0.45, 0.05, 0.48);
  group.add(glassFrame);

  const door = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.1, 0.05, 2, 0.03), doorMat);
  door.position.set(0.75, -0.15, 0.51);
  group.add(door);

  // Pedestal depth (0.3) kept shallow and pulled back to z=0.35 — a first
  // pass at z=0.4 with this same depth spanned z 0.25-0.55, which poked
  // *through* the glass panel (z=0.51, 0.04 thick) instead of sitting
  // safely behind it, clipping oddly at the intersection.
  const pedestal = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.12, 0.3, 2, 0.02), pedestalMat);
  pedestal.position.set(-0.45, -0.38, 0.35);
  group.add(pedestal);

  // Mannequin: stacked directly on the pedestal's top surface (not
  // overlapping it) and scaled up — a first pass had the torso's bottom
  // sitting *inside* the pedestal instead of on top of it, which buried
  // most of the figure and left only a sliver visible above the pedestal
  // in the render (caught by cropping/zooming the actual PNG, not by
  // re-reading the position numbers).
  const pedestalTop = -0.38 + 0.06;
  const torsoHeight = 0.4;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), figureMat);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, torsoHeight, 16), figureMat);
  torso.position.set(-0.45, pedestalTop + torsoHeight / 2, 0.4);
  group.add(torso);
  head.position.set(-0.45, pedestalTop + torsoHeight + 0.13, 0.4);
  group.add(head);

  const baseline = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.05, 0.1, 2, 0.02), pedestalMat);
  baseline.position.set(0, -0.87, 0.55);
  group.add(baseline);

  // Slight extra yaw over the shared 0.06 default reveals a hint of the
  // box's side wall, so it reads as a volume rather than a flat panel.
  return { group, restY: 0.14, restX: 0.06 };
}

/**
 * Trụ sở cơ quan (government office) — columns + a triangular pediment
 * roof + entrance steps, the classic civic-building silhouette.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildGovBuilding(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f0e8, roughness: 0.4, metalness: 0.04 });
  const roofMat = new THREE.MeshPhysicalMaterial({ color: 0xcbb994, roughness: 0.45, metalness: 0.08 });
  const stepMat = new THREE.MeshPhysicalMaterial({ color: 0xe5e0d3, roughness: 0.5, metalness: 0.05 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.1, 0.9, 3, 0.03), bodyMat);
  body.position.y = -0.15;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.25, 0);
  roofShape.lineTo(0, 0.55);
  roofShape.lineTo(1.25, 0);
  roofShape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1.0, bevelEnabled: false });
  roofGeo.translate(0, 0, -0.5);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 0.4, -0.1);
  roof.castShadow = true;
  group.add(roof);

  for (let i = 0; i < 5; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.95, 16), bodyMat);
    col.position.set(-0.9 + i * 0.45, -0.15, 0.55);
    col.castShadow = true;
    group.add(col);
  }

  const step1 = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.12, 1.1, 2, 0.02), stepMat);
  step1.position.set(0, -0.76, 0.1);
  group.add(step1);
  const step2 = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.12, 0.9, 2, 0.02), stepMat);
  step2.position.set(0, -0.64, 0.2);
  group.add(step2);

  return { group, restY: 0.1, restX: 0.05 };
}

/**
 * Y tế (healthcare) — a Kenney "City Kit Commercial" building (see
 * "Pre-made assets (Kenney)" in the doc) + a hand-built rooftop cross
 * sign, the universal healthcare-facility marker the asset pack doesn't
 * have on its own.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildHospitalCross(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const crossMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.4, metalness: 0.05 });

  const building = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/commercial/hospital.glb");
  building.position.y -= 0.3;
  group.add(building);

  const crossV = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.9, 0.1, 2, 0.03), crossMat);
  crossV.position.set(0, 1.65, 0.05);
  crossV.castShadow = true;
  group.add(crossV);
  const crossH = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.3, 0.1, 2, 0.03), crossMat);
  crossH.position.set(0, 1.65, 0.05);
  crossH.castShadow = true;
  group.add(crossH);

  return { group, restY: 0.08, restX: 0.05 };
}

/**
 * Vui chơi giải trí (entertainment) — a building + Ferris wheel. First
 * pass used a floating balloon (matching the flat icon's own metonymy),
 * same inconsistency-with-neighbors problem as the graduation cap above.
 * Researched what an actual "trung tâm vui chơi giải trí" looks like —
 * there's no single common building form (arcade, cinema, trampoline
 * park, water park all vary too much architecturally), so rather than
 * guessing at one specific sub-type's building, a Ferris wheel is used as
 * the single strongest unambiguous "entertainment complex" silhouette,
 * attached to a generic building instead of floating alone.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildEntertainmentBuilding(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.4, metalness: 0.05 });
  const signMat = new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.1, emissive: 0xfbbf24, emissiveIntensity: 0.3 });
  const wheelMat = new THREE.MeshPhysicalMaterial({ color: 0xa21caf, roughness: 0.35, metalness: 0.3 });
  const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x581c87, roughness: 0.4, metalness: 0.1 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.3, 0.9, 3, 0.05), bodyMat);
  body.position.set(-0.5, -0.35, 0);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const sign = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.32, 0.08, 2, 0.03), signMat);
  sign.position.set(-0.5, 0.42, 0.47);
  group.add(sign);

  const door = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.7, 0.05, 2, 0.03), doorMat);
  door.position.set(-0.5, -0.65, 0.47);
  group.add(door);

  // Ferris wheel — TorusGeometry's ring already lies face-on toward the
  // camera by default (flat in the XY plane), so this group is left
  // unrotated; rotating it would turn the wheel edge-on and collapse it
  // to a thin line from the shared near-front camera.
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 10, 32), wheelMat);
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), wheelMat);
    spoke.position.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0);
    spoke.rotation.z = a + Math.PI / 2;
    wheel.add(spoke);
    const cabin = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.09, 0.09, 2, 0.02), signMat);
    cabin.position.set(Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0);
    wheel.add(cabin);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), wheelMat);
  wheel.add(hub);
  wheel.position.set(0.75, 0.15, -0.1);
  wheel.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(wheel);

  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), wheelMat);
  support.position.set(0.75, -0.5, -0.1);
  group.add(support);

  return { group, restY: 0.15, restX: 0.02 };
}

/**
 * Biệt thự (villa) — a Kenney "Modular Buildings" sample house (see
 * "Pre-made assets (Kenney)" in the doc) + a hand-built pool and lamp
 * post, the resort/villa cues the generic house asset doesn't include on
 * its own. Switched from an earlier pass's "City Kit Suburban" house
 * (plain green-roof tract-house look) to this Modular Buildings one
 * (warm cream walls, arched windows, a covered upper window) — "biệt
 * thự" implies a nicer/more distinctive home than a plain suburban
 * tract house, and this asset's extra architectural character reads
 * closer to that.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildVillaHouse(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.03 });
  const poolMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8, roughness: 0.1, metalness: 0.1, transmission: 0.3, transparent: true, opacity: 0.85,
  });
  const postMat = new THREE.MeshPhysicalMaterial({ color: 0x4b5563, roughness: 0.4, metalness: 0.3 });
  const lampMat = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 1.2, roughness: 0.3 });

  const house = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/modular/villa-house.glb");
  house.position.set(-0.45, -0.35, 0);
  group.add(house);

  const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32), poolMat);
  pool.position.set(1.1, -0.72, 0.35);
  group.add(pool);
  const poolRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 8, 32), wallMat);
  poolRim.rotation.x = Math.PI / 2;
  poolRim.position.set(1.1, -0.7, 0.35);
  group.add(poolRim);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), postMat);
  post.position.set(1.6, -0.5, 0.1);
  group.add(post);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), lampMat);
  lamp.position.set(1.6, -0.18, 0.1);
  group.add(lamp);

  return { group, restY: 0.12, restX: 0.06 };
}

/**
 * Nhà hàng tiệc cưới (restaurant/wedding banquet hall) — a neoclassical
 * hall building: dome + arched entrance + flanking columns. First pass
 * used two clinking wine glasses (a celebratory symbol, matching the flat
 * icon's own metonymy), same inconsistency-with-neighbors problem as the
 * other two floating-object models in this batch. Researched actual
 * Vietnamese wedding-hall architecture specifically — the dominant style
 * is explicitly neoclassical/French-manor: symmetrical tiered blocks,
 * arched windows/doors, relief-decorated white or cream walls, gold trim
 * — distinguished here from `buildGovBuilding`'s plainer triangular
 * pediment by a rounded dome + gold accents instead, matching that
 * neoclassical/ornate character rather than a civic building's austerity.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @returns {{ group: import("three").Group, restY: number, restX: number }}
 */
export function buildBanquetHall(THREE, RoundedBoxGeometry) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xfefce8, roughness: 0.35, metalness: 0.03, clearcoat: 0.3 });
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.6 });
  const domeMat = new THREE.MeshPhysicalMaterial({ color: 0x6b7280, roughness: 0.4, metalness: 0.15 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd, roughness: 0.15, metalness: 0.2, transmission: 0.3, transparent: true, opacity: 0.8,
  });

  const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.3, 1.0, 3, 0.04), wallMat);
  body.position.y = -0.25;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.set(0, 0.4, 0);
  dome.castShadow = true;
  group.add(dome);
  const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 24), wallMat);
  domeBase.position.set(0, 0.32, 0);
  group.add(domeBase);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), goldMat);
  spire.position.set(0, 1.0, 0);
  group.add(spire);

  // arched entrance — a semicircle-topped opening, the defining feature
  // that reads as "ornate hall" vs. gov-building's plain rectangular door
  const archShape = new THREE.Shape();
  archShape.moveTo(-0.35, -0.65);
  archShape.lineTo(-0.35, 0);
  archShape.absarc(0, 0, 0.35, Math.PI, 0, true);
  archShape.lineTo(0.35, -0.65);
  archShape.closePath();
  const archGeo = new THREE.ExtrudeGeometry(archShape, { depth: 0.06, bevelEnabled: false });
  const arch = new THREE.Mesh(archGeo, glassMat);
  arch.position.set(0, -0.25, 0.51);
  group.add(arch);

  // gold-capped columns flanking the entrance
  for (const x of [-0.7, 0.7]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 16), wallMat);
    col.position.set(x, -0.25, 0.55);
    group.add(col);
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.06, 16), goldMat);
    capital.position.set(x, 0.3, 0.55);
    group.add(capital);
  }

  return { group, restY: 0.1, restX: 0.06 };
}

/**
 * Nhà phố (townhouse) — a Kenney "Modular Buildings" sample tower (see
 * "Pre-made assets (Kenney)" in the doc): narrow, tall, multi-floor, with
 * an arched entrance and window awnings. First pass hand-built this;
 * flagged at the time as having no good pre-made match since neither
 * City Kit Commercial (wide mid-rise blocks) nor City Kit Suburban
 * (standalone yard houses) has a narrow row-house typology — Modular
 * Buildings' pre-assembled "tower" samples turned out to be exactly this
 * shape and weren't checked in the original pass.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildTownhouse(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const building = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/modular/townhouse.glb");
  group.add(building);
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.15, restX: 0.06 };
}

/**
 * Chung cư (apartment building) — a Kenney "City Kit Commercial" building
 * with balconies (see "Pre-made assets (Kenney)" in the doc) — the
 * balcony row is exactly the detail that reads as "apartment block" over
 * a plain office tower, and the loaded asset already has it built in, so
 * no hand-built props are needed here unlike the other 4 Kenney-based
 * models in this batch.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildApartmentTower(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const building = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/commercial/apartment-tower.glb");
  group.add(building);
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.1, restX: 0.06 };
}

/**
 * Văn phòng (office) — a Kenney "City Kit Commercial" glass skyscraper
 * (see "Pre-made assets (Kenney)" in the doc). This is its own key rather
 * than reusing `buildBuilding` — that model is also used by
 * BranchSelectStep's "Dự án công trình" (construction project in
 * general, a broader concept than specifically an office), so repointing
 * it here would have changed that unrelated card too.
 * @param {typeof import("three")} THREE
 * @param {new (w?: number, h?: number, d?: number, seg?: number, r?: number) => import("three").BufferGeometry} RoundedBoxGeometry
 * @param {new () => { load: Function }} GLTFLoader
 * @returns {Promise<{ group: import("three").Group, restY: number, restX: number }>}
 */
export async function buildOfficeTower(THREE, RoundedBoxGeometry, GLTFLoader) {
  const group = new THREE.Group();
  const building = await loadGltfModel(THREE, GLTFLoader, "/models/kenney/commercial/office-tower.glb");
  group.add(building);
  void RoundedBoxGeometry; // unused in this model, kept for consistent signature

  return { group, restY: 0.15, restX: 0.06 };
}

export const MODEL_BUILDERS = {
  "ac-unit": buildAcUnit,
  toolbox: buildToolbox,
  building: buildBuilding,
  cassette: buildCassette,
  "ducted-unit": buildDuctedUnit,
  "floor-standing": buildFloorStanding,
  "ceiling-exposed": buildCeilingExposed,
  "fresh-air-unit": buildFreshAirUnit,
  "ducting-kit": buildDuctingKit,
  "water-filter": buildWaterFilter,
  "control-panel": buildControlPanel,
  "smart-switch": buildSmartSwitch,
  "smart-sensor": buildSmartSensor,
  remote: buildRemote,
  "install-kit": buildInstallKit,
  "cleaning-spray": buildCleaningSpray,
  "trade-in": buildTradeIn,
  "clearance-tag": buildClearanceTag,
  "rental-clock": buildRentalClock,
  "more-dots": buildMoreDots,
  "serviced-apartment": buildServicedApartment,
  "school-building": buildSchoolBuilding,
  storefront: buildStorefront,
  factory: buildFactory,
  showroom: buildShowroom,
  "gov-building": buildGovBuilding,
  "hospital-cross": buildHospitalCross,
  "entertainment-building": buildEntertainmentBuilding,
  "villa-house": buildVillaHouse,
  "banquet-hall": buildBanquetHall,
  townhouse: buildTownhouse,
  "apartment-tower": buildApartmentTower,
  "office-tower": buildOfficeTower,
};

// Product-category slug → model key. Substring match, same defensive
// pattern as deriveSupportType in LeadFormScreen — a slug admin tweaks
// later (e.g. adds "-inverter") still resolves; anything wholly
// unrecognized falls back to the wall-mounted unit rather than breaking.
export function getCategoryModelKey(slug) {
  const s = slug ?? "";
  if (s.includes("treo-tuong")) return "ac-unit";
  if (s.includes("am-tran")) return "cassette";
  if (s.includes("giau-tran")) return "ducted-unit";
  if (s.includes("tu-dung")) return "floor-standing";
  if (s.includes("ap-tran")) return "ceiling-exposed";
  if (s.includes("khi-tuoi") || s.includes("thu-hoi-nhiet")) return "fresh-air-unit";
  if (s.includes("phu-kien")) return "ducting-kit";
  if (s.includes("loc-nuoc")) return "water-filter";
  if (s.includes("bang-dieu-khien")) return "control-panel";
  if (s.includes("cong-tac")) return "smart-switch";
  if (s.includes("cam-bien")) return "smart-sensor";
  if (s.includes("remote")) return "remote";
  return "ac-unit";
}

// Service-group slug → model key. Same substring-match pattern as
// getCategoryModelKey, mirroring getServiceGroupIcon's own slug matching
// in entity-icons.tsx exactly (same branches, same order) so the two
// lookups can never silently diverge on which group gets which
// treatment.
export function getServiceGroupModelKey(slug) {
  const s = slug ?? "";
  if (s.includes("cung-cap") || s.includes("lap-dat")) return "install-kit";
  if (s.includes("bao-tri") || s.includes("bao-duong") || s.includes("ve-sinh")) return "cleaning-spray";
  if (s.includes("thu-cu")) return "trade-in";
  if (s.includes("thanh-ly")) return "clearance-tag";
  if (s.includes("cho-thue")) return "rental-clock";
  return "more-dots";
}

// Project-type slug → model key. Same substring-match pattern, mirroring
// getProjectTypeIcon's own slug matching in entity-icons.tsx exactly
// (same branches, same order).
export function getProjectTypeModelKey(slug) {
  const s = slug ?? "";
  if (s.includes("can-ho-dich-vu")) return "serviced-apartment";
  if (s.includes("giao-duc")) return "school-building";
  if (s.includes("kinh-doanh")) return "storefront";
  if (s.includes("cong-nghiep")) return "factory";
  if (s.includes("showroom")) return "showroom";
  if (s.includes("tru-so") || s.includes("co-quan")) return "gov-building";
  if (s.includes("van-phong")) return "office-tower";
  if (s.includes("y-te")) return "hospital-cross";
  if (s.includes("vui-choi") || s.includes("giai-tri")) return "entertainment-building";
  if (s.includes("biet-thu")) return "villa-house";
  if (s.includes("nha-hang") || s.includes("tiec-cuoi")) return "banquet-hall";
  if (s.includes("nha-pho")) return "townhouse";
  if (s.includes("chung-cu")) return "apartment-tower";
  return "building";
}
