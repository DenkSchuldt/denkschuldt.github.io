"use client";

import { useEffect, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useRenderDemand } from "../runtime/render-scheduler";
import { useActiveReality } from "./RealityProvider";

// Blueprint reads as an architectural drawing, not a blue color grade: a
// single vivid, saturated "field" (derived from the spec's #203a63) carries
// almost every surface plus the background/fog, and a dense white wireframe
// (derived from #ebeced) carries the structure. Surfaces intentionally stay
// in a narrow tonal band around the field — close to unlit — rather than a
// wide light/dark ladder, so the room reads as lines on a flat plane first.
const FIELD_HUE = 216.7 / 360;
const FIELD_SATURATION = 0.72;
const FIELD_LIGHTNESS = 0.42;
const BLUEPRINT_FIELD = new THREE.Color().setHSL(FIELD_HUE, FIELD_SATURATION, FIELD_LIGHTNESS);
const TECHNICAL_LIGHT = "#ebeced";
// Photographic surfaces (posters, certificates, portfolio/polaroid photos)
// keep their map so content stays recognizable, but are multiplied by this
// fixed, dark/saturated tint instead of their own color — a light tint barely
// dents a full-color photo under multiply blending, so this stays dark
// enough to crush the original hues down into the drawing.
const MAPPED_SURFACE_TONE = new THREE.Color().setHSL(FIELD_HUE, 0.35, 0.1);
const BLUEPRINT_ROUGHNESS = 1;
const TRANSITION_DURATION_MS = 850;

const hslScratch = { h: 0, s: 0, l: 0 };
function blueprintTone(original: THREE.Color) {
  original.getHSL(hslScratch);
  // Only a slight lightness nudge survives from the original material — the
  // point is that surfaces read as "the same substance as the field," not a
  // ladder from dark to light.
  const lift = (hslScratch.l - 0.5) * 0.16;
  const lightness = THREE.MathUtils.clamp(FIELD_LIGHTNESS + lift, 0.14, 0.6);
  return new THREE.Color().setHSL(FIELD_HUE, FIELD_SATURATION, lightness);
}

// Keyed by the live THREE.Color instance (material.color, scene.background,
// scene.fog.color all qualify), so the true Cinematic value is captured once
// and survives any number of Reality switches.
const colorOriginals = new WeakMap<THREE.Color, THREE.Color>();
function originalColorFor(color: THREE.Color) {
  let original = colorOriginals.get(color);
  if (!original) {
    original = color.clone();
    colorOriginals.set(color, original);
  }
  return original;
}

interface SurfaceBackup {
  metalness?: number;
  roughness?: number;
  maps: Partial<Record<(typeof SUPPRESSED_MAP_KEYS)[number], THREE.Texture | null>>;
}
const SUPPRESSED_MAP_KEYS = ["normalMap", "roughnessMap", "metalnessMap", "aoMap"] as const;
const materialSurfaceBackups = new WeakMap<THREE.Material, SurfaceBackup>();
// ACES Filmic tonemapping recovers saturation in bright highlights, so a
// multiply-darkened photo (a bright sky, a lit spacesuit) can still come back
// looking vivid on screen even though its raw color was crushed dark. Bypass
// tonemapping on these materials specifically while Blueprint is active so
// the tint reads as intended; restored on revert.
const mappedToneMappedBackups = new WeakMap<THREE.Material, boolean>();

type ColoredMaterial = THREE.Material &
  Partial<{
    color: THREE.Color;
    map: THREE.Texture | null;
    metalness: number;
    roughness: number;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
    metalnessMap: THREE.Texture | null;
    aoMap: THREE.Texture | null;
    toneMapped: boolean;
  }>;

interface ColorTransitionEntry {
  live: THREE.Color;
  from: THREE.Color;
  to: THREE.Color;
}

function isInstanced(object: THREE.Object3D): object is THREE.InstancedMesh {
  return (object as THREE.InstancedMesh).isInstancedMesh === true;
}

const EDGE_MATERIAL = new THREE.LineBasicMaterial({ color: TECHNICAL_LIGHT, toneMapped: false });
const wireframeGeometryCache = new WeakMap<THREE.BufferGeometry, THREE.WireframeGeometry>();

// Single traversal of the persistent scene graph, run once per Reality
// change (never per frame):
//  - every material's color is queued for the animated lerp below;
//  - non-photographic materials additionally get their surface-variation
//    maps (normal/roughness/metalness/AO) suppressed and metalness/
//    roughness flattened, since those are what make a material read as
//    "realistically shaded" rather than a flat technical plane;
//  - on the very first Blueprint activation, every non-instanced mesh gets a
//    cached, reusable THREE.WireframeGeometry line-segments child (instanced
//    meshes are skipped — decorative trim/casters — since one wireframe copy
//    can't represent per-instance transforms). Later switches only toggle
//    those lines' visibility; nothing is regenerated.
function applyBlueprintPass(
  scene: THREE.Scene,
  toBlueprint: boolean,
  edgeLineCache: THREE.LineSegments[],
): ColorTransitionEntry[] {
  const entries: ColorTransitionEntry[] = [];
  const buildEdges = edgeLineCache.length === 0;
  const addColor = (color: THREE.Color, blueprintTarget: THREE.Color) => {
    const original = originalColorFor(color);
    entries.push({
      live: color,
      from: color.clone(),
      to: toBlueprint ? blueprintTarget : original,
    });
  };
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      const colored = material as ColoredMaterial;
      if (!colored.color) return;
      const hasPhotoMap = Boolean(colored.map);
      addColor(
        colored.color,
        hasPhotoMap ? MAPPED_SURFACE_TONE : blueprintTone(originalColorFor(colored.color)),
      );
      if (hasPhotoMap) {
        if (colored.toneMapped !== undefined) {
          if (!mappedToneMappedBackups.has(material))
            mappedToneMappedBackups.set(material, colored.toneMapped);
          colored.toneMapped = toBlueprint ? false : mappedToneMappedBackups.get(material)!;
        }
        return;
      }
      let surface = materialSurfaceBackups.get(material);
      if (!surface) {
        surface = {
          metalness: colored.metalness,
          roughness: colored.roughness,
          maps: Object.fromEntries(SUPPRESSED_MAP_KEYS.map((key) => [key, colored[key] ?? null])),
        };
        materialSurfaceBackups.set(material, surface);
      }
      if (colored.metalness !== undefined) colored.metalness = toBlueprint ? 0 : surface.metalness;
      if (colored.roughness !== undefined)
        colored.roughness = toBlueprint ? BLUEPRINT_ROUGHNESS : surface.roughness;
      let mapsChanged = false;
      SUPPRESSED_MAP_KEYS.forEach((key) => {
        const originalMap = surface!.maps[key];
        if (!originalMap) return;
        const next = toBlueprint ? null : originalMap;
        if (colored[key] !== next) {
          colored[key] = next;
          mapsChanged = true;
        }
      });
      if (mapsChanged) material.needsUpdate = true;
    });
    if (buildEdges && !isInstanced(mesh) && mesh.geometry) {
      let wireframe = wireframeGeometryCache.get(mesh.geometry);
      if (!wireframe) {
        wireframe = new THREE.WireframeGeometry(mesh.geometry);
        wireframeGeometryCache.set(mesh.geometry, wireframe);
      }
      const line = new THREE.LineSegments(wireframe, EDGE_MATERIAL);
      line.raycast = () => {};
      line.visible = false;
      mesh.add(line);
      edgeLineCache.push(line);
    }
  });
  if (scene.background instanceof THREE.Color) addColor(scene.background, BLUEPRINT_FIELD);
  if (scene.fog) addColor(scene.fog.color, BLUEPRINT_FIELD);
  edgeLineCache.forEach((line) => {
    line.visible = toBlueprint;
  });
  return entries;
}

// Applies Blueprint as a temporary, reversible visual override on top of the
// existing Cinematic scene graph: geometry, lighting rigs, and post-
// processing wiring are untouched — only live color/metalness/roughness/map
// values are nudged and restored, plus a cached wireframe outline per mesh
// toggled visible. See RealityProvider.tsx for the registry this responds
// to, and Lighting.tsx / CinematicEffects.tsx for the other minimal
// per-reality overrides.
export function RealityRuntimeBridge() {
  const scene = useThree((state) => state.scene);
  const realityId = useActiveReality((reality) => reality.id);
  const renderDemand = useRenderDemand("reality-runtime");
  const edgeLinesRef = useRef<THREE.LineSegments[]>([]);
  const transitionRef = useRef<{ entries: ColorTransitionEntry[]; start: number } | null>(null);

  useEffect(() => {
    const toBlueprint = realityId === "blueprint";
    transitionRef.current = {
      entries: applyBlueprintPass(scene, toBlueprint, edgeLinesRef.current),
      start: performance.now(),
    };
    renderDemand.invalidate("reality-transition");
    return renderDemand.acquireFor(
      { reason: "reality-transition", priority: 2 },
      TRANSITION_DURATION_MS + 100,
    );
  }, [realityId, scene, renderDemand]);

  useFrame(() => {
    const transition = transitionRef.current;
    if (!transition) return;
    const t = Math.min(1, (performance.now() - transition.start) / TRANSITION_DURATION_MS);
    const eased = t * t * (3 - 2 * t);
    transition.entries.forEach(({ live, from, to }) => live.lerpColors(from, to, eased));
    if (t >= 1) transitionRef.current = null;
  });

  return null;
}
