// Shared lighting rig + camera, reused unchanged across every model (see
// docs/interactive-3d-icon-pattern.md). Only the `group` contents (the
// object itself, from three-models.js) should differ per icon.

/**
 * @param {typeof import("three")} THREE
 * @param {import("three").Group} group - already positioned/rotated by the caller
 * @param {number} [aspect] - width/height of the render target. Cards are
 *   4:3 (ngang 4 dài 3, a deliberate change from the original square
 *   cards), so this defaults to 4/3 — pass a different value only if some
 *   future consumer renders into a non-4:3 box.
 * @returns {{ scene: import("three").Scene, camera: import("three").PerspectiveCamera }}
 */
export function buildSceneRig(THREE, group, aspect = 4 / 3) {
  const scene = new THREE.Scene();

  // Near-front elevation, not the diagonal 3/4 "hero shot" this used to be
  // — matches how real product photography shoots appliances (straight-on,
  // slightly above eye level), and it's what actually shows off each
  // model's front-face detail (vents, display, windows) instead of mostly
  // showing a side/end profile. A small X offset (not 0) keeps a hint of
  // depth so it still reads as 3D rather than a flat cutout.
  // Vertical FOV (28) stays fixed when aspect changes — a wider aspect
  // just gives more horizontal room via the aspect param itself, so
  // widening the card from square to 4:3 only ever gains framing margin,
  // never crops a model that already fit the square version.
  const camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 100);
  camera.position.set(0.6, 1.0, 8.6);
  camera.lookAt(0, 0.05, 0);

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(4, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.radius = 6;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xdce6ff, 0.7);
  fill.position.set(-5, 2, -2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xbfd4ff, 0.5);
  rim.position.set(0, 2, -5);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.16 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.85;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.add(group);

  return { scene, camera };
}
