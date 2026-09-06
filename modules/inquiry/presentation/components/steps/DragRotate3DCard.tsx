"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

import { MODEL_BUILDERS } from "./three-models.js";
import { buildSceneRig } from "./three-scene-rig.js";

type ModelKey = keyof typeof MODEL_BUILDERS;

interface DragRotate3DCardProps {
  modelKey: ModelKey;
  className?: string;
}

// Gesture-gated drag-to-rotate 3D icon — see
// docs/interactive-3d-icon-pattern.md for the full pattern this implements.
// At rest this is just an <img> (the snapshot from
// scripts/render-3d-icon-snapshots.mjs, public/images/3d-icons/<key>.png) —
// zero JS/WebGL cost for a visitor who never touches the card. Three.js
// itself is dynamically imported, and the live scene only mounts on
// mousedown/touchstart, not hover: a visitor who scrolls past never spins
// up a WebGL context.
export function DragRotate3DCard({ modelKey, className }: DragRotate3DCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: import("three").WebGLRenderer;
    scene: import("three").Scene;
    camera: import("three").PerspectiveCamera;
    group: import("three").Group;
    raf: number;
    dragging: boolean;
    lastX: number;
    lastY: number;
    currentY: number;
    currentX: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  // Tracks whether the current press moved enough to count as a drag —
  // independent of stateRef, which doesn't exist yet until the dynamic
  // import("three") resolves, so it stays accurate even during that gap.
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const MOVE_THRESHOLD = 4; // px

  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s) {
        cancelAnimationFrame(s.raf);
        s.renderer.dispose();
      }
    };
  }, []);

  async function ensureMounted() {
    if (stateRef.current || !wrapRef.current) return;
    const wrap = wrapRef.current;

    const [THREE, { RoundedBoxGeometry }, { GLTFLoader }] = await Promise.all([
      import("three"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]);

    if (stateRef.current || !wrapRef.current) return; // guard against a second concurrent gesture while loading

    // Most builders are synchronous (procedural geometry); a few
    // (office-tower, apartment-tower, storefront, hospital-cross,
    // villa-house) load a pre-made Kenney glTF asset and are async instead
    // — see docs/interactive-3d-icon-pattern.md's "Pre-made assets
    // (Kenney)" section. `await` on a non-Promise value just resolves
    // immediately, so this line works for both without branching.
    const { group, restY, restX } = await MODEL_BUILDERS[modelKey](THREE, RoundedBoxGeometry, GLTFLoader);
    if (stateRef.current || !wrapRef.current) return; // re-check after the (possibly slower) async load
    group.rotation.y = restY;
    group.rotation.x = restX;
    group.position.y = 0.05;

    // This card fills whatever box its caller gives it (see the `aspect-*`
    // class on that wrapper, not here) — size the renderer to the actual
    // rendered box and match the camera's aspect to it, instead of the old
    // Math.max(width, height) square canvas that would have stretched to
    // fill a rectangular box unevenly.
    const rect = wrap.getBoundingClientRect();
    const width = rect.width || 200;
    const height = rect.height || 150;
    const { scene, camera } = buildSceneRig(THREE, group, width / height);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    wrap.appendChild(renderer.domElement);

    stateRef.current = {
      renderer, scene, camera, group, raf: 0,
      dragging: false, lastX: 0, lastY: 0, currentY: restY, currentX: restX,
    };
    setMounted(true);

    const loop = () => {
      const s = stateRef.current;
      if (!s) return;
      s.group.rotation.y = s.currentY;
      s.group.rotation.x = s.currentX;
      s.renderer.render(s.scene, s.camera);
      s.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  const YAW_SENSITIVITY = 0.02;
  const PITCH_SENSITIVITY = 0.008;
  const PITCH_LIMIT = 0.55;

  function trackMove(clientX: number, clientY: number) {
    const down = downPosRef.current;
    if (down && !draggedRef.current) {
      const dist = Math.hypot(clientX - down.x, clientY - down.y);
      if (dist > MOVE_THRESHOLD) draggedRef.current = true;
    }
  }

  async function beginDrag(clientX: number, clientY: number) {
    downPosRef.current = { x: clientX, y: clientY };
    draggedRef.current = false;
    await ensureMounted();
    const s = stateRef.current;
    if (!s) return;
    s.dragging = true;
    s.lastX = clientX;
    s.lastY = clientY;
  }

  function dragTo(clientX: number, clientY: number) {
    const s = stateRef.current;
    if (!s || !s.dragging) return;
    const dx = clientX - s.lastX;
    const dy = clientY - s.lastY;
    s.lastX = clientX;
    s.lastY = clientY;
    s.currentY += dx * YAW_SENSITIVITY;
    s.currentX = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.currentX + dy * PITCH_SENSITIVITY));
  }

  function endDrag() {
    const s = stateRef.current;
    if (s) s.dragging = false;
    downPosRef.current = null;
  }

  useEffect(() => {
    function onMove(e: MouseEvent) { trackMove(e.clientX, e.clientY); dragTo(e.clientX, e.clientY); }
    function onUp() { endDrag(); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={cn("relative h-full w-full touch-none select-none", mounted ? "cursor-grab active:cursor-grabbing" : "cursor-grab", className)}
      onMouseDown={(e) => void beginDrag(e.clientX, e.clientY)}
      onTouchStart={(e) => { if (e.touches[0]) void beginDrag(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchMove={(e) => { if (e.touches[0]) { trackMove(e.touches[0].clientX, e.touches[0].clientY); dragTo(e.touches[0].clientX, e.touches[0].clientY); } }}
      onTouchEnd={endDrag}
      // EntityPickerCard/BranchSelectStep now overlay their "select" button
      // on top of this card face (poster-style, bottom scrim) rather than
      // wrapping this whole element in one — the button occupies its own
      // small region and stops propagation itself, so dragging the model
      // and clicking the button are spatially, not just structurally,
      // separate; no click-vs-drag conflict reaches this element in that
      // layout. Kept as defense-in-depth for any other consumer that does
      // nest this inside a click target — suppress the click only if a
      // real drag happened (see draggedRef); a plain tap still bubbles.
      onClick={(e) => { if (draggedRef.current) e.stopPropagation(); }}
    >
      {/* Static snapshot — pre-rendered by scripts/render-3d-icon-snapshots.mjs,
          this is what a visitor who never drags ever sees. Plain <img>, not
          next/image: this needs to sit under an absolutely-positioned
          <canvas> the live scene appends directly into the same wrapper,
          which next/image's own layout wrapper doesn't accommodate. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/3d-icons/${modelKey}.png`}
        alt=""
        className={cn("absolute inset-0 h-full w-full object-contain transition-opacity duration-150", mounted ? "opacity-0" : "opacity-100")}
        draggable={false}
      />
    </div>
  );
}
