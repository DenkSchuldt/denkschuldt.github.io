"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Capsule, RoundedBox, Text, useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { useRuntimeSnapshot, useRuntimeTask } from "@denk/cinematic-navigation/react";

import { withSceneBasePath } from "../camera/sceneRoutes";
import { PALETTE as C } from "../constants";
import { RENDERING_INTENT } from "../rendering/renderingIntent";
import {
  measurePerformanceTask,
  performanceDiagnostics,
} from "../diagnostics/performance/performanceStore";
import {
  isResourceResidentState,
  useDestinationWorkingSet,
  useOwnedTexture,
  useOwnedTextures,
} from "../runtime/working-set";
import { useRenderDemand } from "../runtime/render-scheduler";
import { PHONE_LAYOUT } from "../sceneLayout";
import { CERTIFICATES, CERTIFICATE_LAYOUT } from "./certificates";

import type { MutableRefObject, RefObject } from "react";
import type { RuntimeTaskRegistration } from "@denk/cinematic-navigation";
import type { SceneId } from "../camera/navigationTypes";
import type { RenderReason } from "../runtime/render-scheduler";
import type { CertificateRecord } from "./certificates";

function useMeasuredRuntimeTask(task: RuntimeTaskRegistration) {
  useRuntimeTask({
    ...task,
    update: (context) => {
      if (!performanceDiagnostics.switches.nonCameraTasks) return;
      if (task.id === "task:coffee-steam" && !performanceDiagnostics.switches.coffeeSteam) return;
      return measurePerformanceTask(task.id, () => task.update(context));
    },
  });
}

function useFeatureSettleLease(
  ownerId: string,
  active: boolean,
  reason: RenderReason,
  durationMs = 1400,
) {
  const demand = useRenderDemand(ownerId);
  useEffect(() => {
    demand.invalidate(reason);
    if (active) return demand.acquireFor({ reason, priority: 2 }, durationMs);
  }, [active, demand, durationMs, reason]);
}

const mat = { roughness: 0.82, metalness: 0 };
const MACBOOK_CHASSIS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#55585a",
  roughness: 0.46,
  metalness: 0.24,
});
const MACBOOK_DARK_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#090b0c",
  roughness: 0.72,
  metalness: 0.05,
});
const MACBOOK_TRACKPAD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#5e6163",
  roughness: 0.54,
  metalness: 0.16,
});
const MACBOOK_PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);
const MACBOOK_HINGE_GEOMETRY = new THREE.CylinderGeometry(0.026, 0.026, 1.18, 8, 1, false);
const DESK_LAMP_METAL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#292a29",
  roughness: 0.52,
  metalness: 0.34,
});
const DESK_LAMP_BRASS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#766047",
  roughness: 0.46,
  metalness: 0.58,
});
const DESK_LAMP_DIFFUSER_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#d9b483",
  roughness: 0.72,
  metalness: 0,
});
const DESK_LAMP_BASE_GEOMETRY = new THREE.CylinderGeometry(0.28, 0.3, 0.065, 16, 1, false);
const DESK_LAMP_BASE_INSET_GEOMETRY = new THREE.CylinderGeometry(0.19, 0.22, 0.016, 12, 1, false);
const DESK_LAMP_ARM_GEOMETRY = new THREE.CylinderGeometry(0.022, 0.025, 1, 8, 1, false);
const DESK_LAMP_JOINT_GEOMETRY = new THREE.CylinderGeometry(0.055, 0.055, 0.034, 10, 1, false);
const DESK_LAMP_HEAD_GEOMETRY = new THREE.CylinderGeometry(0.105, 0.17, 0.205, 16, 1, true);
const DESK_LAMP_COLLAR_GEOMETRY = new THREE.CylinderGeometry(0.047, 0.052, 0.12, 10, 1, false);
const DESK_LAMP_DIFFUSER_GEOMETRY = new THREE.CircleGeometry(0.154, 16);
const IPHONE_FRAME_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#242728",
  roughness: 0.38,
  metalness: 0.62,
});
const IPHONE_BACK_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#0b0d0e",
  roughness: 0.34,
  metalness: 0.12,
});
const IPHONE_GLASS_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#010203",
  roughness: 0.16,
  metalness: 0.04,
});
const IPHONE_FLASH_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#d4cec0",
  roughness: 0.68,
  metalness: 0,
});
const IPHONE_BODY_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(0.325, 0.65, 0.057), {
  depth: 0.026,
  steps: 1,
  curveSegments: 2,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.004,
  bevelThickness: 0.004,
});
IPHONE_BODY_GEOMETRY.center();
IPHONE_BODY_GEOMETRY.rotateX(-Math.PI / 2);
IPHONE_BODY_GEOMETRY.computeVertexNormals();
const IPHONE_SCREEN_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(0.299, 0.618, 0.047),
  2,
);
IPHONE_SCREEN_GEOMETRY.rotateX(-Math.PI / 2);
const IPHONE_SCREEN_IMAGE_GEOMETRY = IPHONE_SCREEN_GEOMETRY.clone();
{
  const positions = IPHONE_SCREEN_IMAGE_GEOMETRY.getAttribute("position");
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index++) {
    uvs[index * 2] = positions.getX(index) / 0.299 + 0.5;
    uvs[index * 2 + 1] = 0.5 - positions.getZ(index) / 0.618;
  }
  IPHONE_SCREEN_IMAGE_GEOMETRY.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
}
const IPHONE_BACK_GEOMETRY = new THREE.ShapeGeometry(roundedRectangleShape(0.305, 0.63, 0.05), 2);
IPHONE_BACK_GEOMETRY.rotateX(Math.PI / 2);
const IPHONE_CAMERA_ISLAND_GEOMETRY = new THREE.ExtrudeGeometry(
  roundedRectangleShape(0.135, 0.135, 0.03),
  { depth: 0.006, steps: 1, curveSegments: 2, bevelEnabled: false },
);
IPHONE_CAMERA_ISLAND_GEOMETRY.center();
IPHONE_CAMERA_ISLAND_GEOMETRY.rotateX(Math.PI / 2);
IPHONE_CAMERA_ISLAND_GEOMETRY.computeVertexNormals();
const IPHONE_DYNAMIC_ISLAND_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(0.105, 0.025, 0.0125),
  1,
);
IPHONE_DYNAMIC_ISLAND_GEOMETRY.rotateX(-Math.PI / 2);
const IPHONE_LENS_GEOMETRY = new THREE.CylinderGeometry(0.026, 0.026, 0.004, 8, 1, false);
const IPHONE_FLASH_GEOMETRY = new THREE.CircleGeometry(0.011, 8);
const IPHONE_WHATSAPP_BUTTON_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(0.22, 0.052, 0.018),
  2,
);
IPHONE_WHATSAPP_BUTTON_GEOMETRY.rotateX(-Math.PI / 2);
const IPHONE_WHATSAPP_BUTTON_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#25d366",
  toneMapped: false,
});
const IPHONE_SCREEN_TEXTURE_REPEAT_X = 0.299 / 0.618 / (675 / 1200);
const PHONE_CONTACT_URL = "https://wa.me/+593964198839?text=Hello%20from%20your%20website%21";
const ZZ_LEAF_DARK_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#334f36",
  roughness: 0.8,
  metalness: 0,
  side: THREE.DoubleSide,
});
const ZZ_LEAF_LIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#405f3d",
  roughness: 0.76,
  metalness: 0,
  side: THREE.DoubleSide,
});
const ZZ_POT_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#927b67",
  roughness: 0.8,
  metalness: 0,
});
const ZZ_SOIL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#241a14",
  roughness: 1,
  metalness: 0,
});
const ZZ_STEM_GEOMETRY = new THREE.CylinderGeometry(0.012, 0.016, 1, 5, 1, false);
const ZZ_POT_GEOMETRY = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0.17, -0.11),
    new THREE.Vector2(0.183, -0.105),
    new THREE.Vector2(0.192, -0.09),
    new THREE.Vector2(0.222, 0.23),
    new THREE.Vector2(0.235, 0.275),
    new THREE.Vector2(0.252, 0.29),
    new THREE.Vector2(0.255, 0.305),
    new THREE.Vector2(0.248, 0.318),
    new THREE.Vector2(0.225, 0.325),
    new THREE.Vector2(0.212, 0.314),
    new THREE.Vector2(0.208, 0.29),
  ],
  12,
);
const ZZ_LEAF_GEOMETRY = new THREE.BufferGeometry();
ZZ_LEAF_GEOMETRY.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Float32Array([
      0, 0, 0, -0.035, 0.09, 0.002, 0.035, 0.09, 0.002, -0.065, 0.2, 0.012, 0.065, 0.2, 0.012,
      -0.045, 0.32, 0.032, 0.045, 0.32, 0.032, 0, 0.42, 0.06,
    ]),
    3,
  ),
);
ZZ_LEAF_GEOMETRY.setIndex([0, 2, 1, 1, 2, 4, 1, 4, 3, 3, 4, 6, 3, 6, 5, 5, 6, 7]);
ZZ_LEAF_GEOMETRY.computeVertexNormals();
const ZZ_STEMS = [
  { x: -0.07, z: 0.015, height: 0.88, leanX: -0.12, leanZ: 0.025, angle: 2.8 },
  { x: 0.045, z: -0.025, height: 1.02, leanX: 0.075, leanZ: -0.04, angle: 0.18 },
  { x: -0.015, z: 0.055, height: 0.78, leanX: 0.035, leanZ: 0.11, angle: 1.35 },
  { x: 0.09, z: 0.04, height: 0.9, leanX: 0.14, leanZ: 0.055, angle: 0.55 },
  { x: -0.1, z: -0.045, height: 0.74, leanX: -0.15, leanZ: -0.08, angle: -2.35 },
] as const;
const CHAIR_FRAME_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#1d2021",
  roughness: 0.68,
  metalness: 0.08,
});
const CHAIR_FABRIC_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#292827",
  roughness: 0.94,
  metalness: 0,
  side: THREE.DoubleSide,
});
const CHAIR_BACKING_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#343638",
  roughness: 0.86,
  metalness: 0,
  side: THREE.DoubleSide,
});
const CHAIR_METAL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#4a4c4c",
  roughness: 0.42,
  metalness: 0.58,
});
const CHAIR_BACK_FRAME_SHAPE = roundedRectangleShape(1.12, 1.52, 0.18);
CHAIR_BACK_FRAME_SHAPE.holes.push(roundedRectangleHole(0.91, 1.29, 0.12));
const CHAIR_BACK_FRAME_GEOMETRY = new THREE.ExtrudeGeometry(CHAIR_BACK_FRAME_SHAPE, {
  depth: 0.045,
  steps: 1,
  curveSegments: 2,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.012,
  bevelThickness: 0.012,
});
CHAIR_BACK_FRAME_GEOMETRY.center();
CHAIR_BACK_FRAME_GEOMETRY.computeVertexNormals();
const CHAIR_BACK_PANEL_GEOMETRY = new THREE.ExtrudeGeometry(
  roundedRectangleShape(0.9, 1.28, 0.12),
  {
    depth: 0.025,
    steps: 1,
    curveSegments: 2,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  },
);
CHAIR_BACK_PANEL_GEOMETRY.center();
CHAIR_BACK_PANEL_GEOMETRY.computeVertexNormals();
const CHAIR_BACK_MESH_GEOMETRY = new THREE.BufferGeometry();
CHAIR_BACK_MESH_GEOMETRY.setAttribute(
  "position",
  new THREE.BufferAttribute(
    new Float32Array([
      -0.38, -0.64, 0, 0.38, -0.64, 0, -0.44, -0.23, 0.04, 0.44, -0.23, 0.04, -0.44, 0.2, 0.06,
      0.44, 0.2, 0.06, -0.42, 0.64, 0.02, 0.42, 0.64, 0.02,
    ]),
    3,
  ),
);
CHAIR_BACK_MESH_GEOMETRY.setIndex([0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4, 4, 5, 7, 4, 7, 6]);
CHAIR_BACK_MESH_GEOMETRY.computeVertexNormals();
const CHAIR_SEAT_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(1.13, 0.98, 0.17), {
  depth: 0.12,
  steps: 1,
  curveSegments: 2,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.025,
  bevelThickness: 0.025,
});
CHAIR_SEAT_GEOMETRY.center();
CHAIR_SEAT_GEOMETRY.rotateX(-Math.PI / 2);
CHAIR_SEAT_GEOMETRY.computeVertexNormals();
const CHAIR_ARM_PAD_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(0.38, 0.11, 0.05), {
  depth: 0.055,
  steps: 1,
  curveSegments: 1,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.012,
  bevelThickness: 0.012,
});
CHAIR_ARM_PAD_GEOMETRY.center();
CHAIR_ARM_PAD_GEOMETRY.rotateX(-Math.PI / 2);
CHAIR_ARM_PAD_GEOMETRY.computeVertexNormals();
const CHAIR_ARM_SUPPORT_GEOMETRY = new THREE.CylinderGeometry(0.035, 0.045, 0.52, 6, 1, false);
const CHAIR_BASE_ARM_GEOMETRY = new THREE.BoxGeometry(1, 0.07, 0.09);
const CHAIR_CASTER_FORK_GEOMETRY = new THREE.BoxGeometry(0.07, 0.1, 0.055);
const CHAIR_CASTER_GEOMETRY = new THREE.CylinderGeometry(0.065, 0.065, 0.045, 8, 1, false);
const CHAIR_GAS_LIFT_GEOMETRY = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8, 1, false);
const CHAIR_GAS_COLLAR_GEOMETRY = new THREE.CylinderGeometry(0.075, 0.09, 0.17, 8, 1, false);
const CHAIR_HUB_GEOMETRY = new THREE.CylinderGeometry(0.12, 0.14, 0.1, 10, 1, false);
const CHAIR_SPINE_GEOMETRY = new THREE.CylinderGeometry(0.026, 0.032, 0.7, 6, 1, false);
const CHAIR_LUMBAR_GEOMETRY = new THREE.CylinderGeometry(0.025, 0.025, 0.66, 6, 1, false);
const MUG_CERAMIC_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#6f211d",
  roughness: 0.72,
  metalness: 0,
});
const MUG_COFFEE_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#170b07",
  roughness: 0.24,
  metalness: 0.02,
});
const MUG_BODY_GEOMETRY = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0.12, -0.17),
    new THREE.Vector2(0.14, -0.16),
    new THREE.Vector2(0.15, -0.13),
    new THREE.Vector2(0.158, 0.12),
    new THREE.Vector2(0.16, 0.155),
    new THREE.Vector2(0.155, 0.17),
    new THREE.Vector2(0.137, 0.17),
    new THREE.Vector2(0.132, 0.155),
    new THREE.Vector2(0.13, 0.13),
  ],
  12,
);
const MUG_HANDLE_GEOMETRY = new THREE.TubeGeometry(
  new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0.105, 0),
    new THREE.Vector3(0.2, 0.11, 0),
    new THREE.Vector3(0.2, -0.11, 0),
    new THREE.Vector3(0, -0.105, 0),
  ),
  8,
  0.026,
  4,
  false,
);
const MUG_COFFEE_GEOMETRY = new THREE.CircleGeometry(0.129, 12);
const STEAM_DATA = new Uint8Array(16 * 32 * 4);
for (let y = 0; y < 32; y++)
  for (let x = 0; x < 16; x++) {
    const index = (y * 16 + x) * 4,
      nx = (x - 7.5) / 7.5,
      ny = y / 31;
    const wispy =
      Math.exp(-nx * nx * 5.4) *
      Math.pow(Math.sin(Math.PI * ny), 1.25) *
      (0.68 + 0.32 * Math.sin(x * 1.7 + y * 0.63));
    STEAM_DATA[index] = 225;
    STEAM_DATA[index + 1] = 220;
    STEAM_DATA[index + 2] = 214;
    STEAM_DATA[index + 3] = Math.max(0, Math.round(wispy * 150));
  }
const STEAM_TEXTURE = new THREE.DataTexture(STEAM_DATA, 16, 32, THREE.RGBAFormat);
STEAM_TEXTURE.minFilter = THREE.LinearFilter;
STEAM_TEXTURE.magFilter = THREE.LinearFilter;
STEAM_TEXTURE.generateMipmaps = false;
STEAM_TEXTURE.needsUpdate = true;
const PORTFOLIO_LEATHER_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#38231a",
  roughness: 0.8,
  metalness: 0,
});
const PORTFOLIO_LINING_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#211b18",
  roughness: 0.92,
  metalness: 0,
});
const PORTFOLIO_PAPER_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#d8ceb9",
  roughness: 0.92,
  metalness: 0,
});
const PORTFOLIO_METAL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#7a7771",
  roughness: 0.38,
  metalness: 0.72,
});
const PORTFOLIO_COVER_GEOMETRY = new THREE.ExtrudeGeometry(
  roundedRectangleShape(0.84, 0.78, 0.055),
  {
    depth: 0.045,
    steps: 1,
    curveSegments: 2,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  },
);
PORTFOLIO_COVER_GEOMETRY.center();
PORTFOLIO_COVER_GEOMETRY.rotateX(-Math.PI / 2);
PORTFOLIO_COVER_GEOMETRY.computeVertexNormals();
const PORTFOLIO_LINING_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(0.77, 0.71, 0.045),
  1,
);
PORTFOLIO_LINING_GEOMETRY.rotateX(-Math.PI / 2);
const PORTFOLIO_POCKET_GEOMETRY = new THREE.ExtrudeGeometry(
  roundedRectangleShape(0.68, 0.5, 0.04),
  {
    depth: 0.014,
    steps: 1,
    curveSegments: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  },
);
PORTFOLIO_POCKET_GEOMETRY.center();
PORTFOLIO_POCKET_GEOMETRY.rotateX(-Math.PI / 2);
PORTFOLIO_POCKET_GEOMETRY.computeVertexNormals();
const PORTFOLIO_PAGE_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(0.72, 0.7, 0.025), {
  depth: 0.007,
  steps: 1,
  curveSegments: 2,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.003,
  bevelThickness: 0.003,
});
PORTFOLIO_PAGE_GEOMETRY.center();
PORTFOLIO_PAGE_GEOMETRY.rotateX(-Math.PI / 2);
PORTFOLIO_PAGE_GEOMETRY.computeVertexNormals();
const PORTFOLIO_PAGE_SURFACE_GEOMETRY = new THREE.PlaneGeometry(0.704, 0.682);
const PORTFOLIO_RING_GEOMETRY = new THREE.TorusGeometry(0.032, 0.007, 4, 8, Math.PI * 1.75);
// Small washers make the paper-to-ring connection legible at the close reading shot.
// They sit on the top sheet only; the real binding is carried by the low-poly torus rings.
const PORTFOLIO_EYELET_GEOMETRY = new THREE.CylinderGeometry(0.014, 0.014, 0.003, 8, 1, false);
const PORTFOLIO_STITCH_GEOMETRY = new THREE.BoxGeometry(0.035, 0.003, 0.006);
const PORTFOLIO_PEN_LOOP_GEOMETRY = new THREE.TorusGeometry(0.026, 0.008, 4, 8);
const PORTFOLIO_ZIPPER_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-0.78, 0.011, -0.41),
    new THREE.Vector3(0.78, 0.011, -0.41),
    new THREE.Vector3(0.86, 0.011, -0.34),
    new THREE.Vector3(0.86, 0.011, 0.34),
    new THREE.Vector3(0.78, 0.011, 0.41),
    new THREE.Vector3(-0.78, 0.011, 0.41),
    new THREE.Vector3(-0.86, 0.011, 0.34),
    new THREE.Vector3(-0.86, 0.011, -0.34),
  ],
  true,
  "catmullrom",
  0.1,
);
const PORTFOLIO_ZIPPER_GEOMETRY = new THREE.TubeGeometry(
  PORTFOLIO_ZIPPER_CURVE,
  48,
  0.006,
  3,
  true,
);
const PORTFOLIO_POLAROID_GEOMETRY = new THREE.BoxGeometry(0.34, 0.008, 0.4);
const PORTFOLIO_PHOTO_GEOMETRY = new THREE.PlaneGeometry(0.27, 0.285);
const PORTFOLIO_SLOT_GEOMETRY = new THREE.BoxGeometry(0.32, 0.01, 0.045);
const PORTFOLIO_PULL_GEOMETRY = new THREE.BoxGeometry(0.06, 0.012, 0.026);
const ARCHITECTURAL_WOOD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#39271d",
  roughness: 0.78,
  metalness: 0,
  vertexColors: true,
});
const ARCHITECTURAL_PANEL_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const ARCHITECTURAL_BASEBOARD_GEOMETRY = (() => {
  const crossSection: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ] = [
    [0, 0],
    [0, 0.05],
    [0.09, 0.05],
    [0.105, 0.037],
    [0.105, 0],
  ];
  const positions: number[] = [];
  for (const x of [-0.5, 0.5]) for (const [y, z] of crossSection) positions.push(x, y, z);
  const indices: number[] = [];
  for (let index = 0; index < crossSection.length; index++) {
    const next = (index + 1) % crossSection.length;
    indices.push(index, next, 5 + next, index, 5 + next, 5 + index);
  }
  indices.push(0, 2, 1, 0, 3, 2, 0, 4, 3, 5, 6, 7, 5, 7, 8, 5, 8, 9);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
})();

function roundedRectangleShape(width: number, height: number, radius: number) {
  const x = -width / 2,
    y = -height / 2,
    shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function roundedRectangleHole(width: number, height: number, radius: number) {
  const x = -width / 2,
    y = -height / 2,
    path = new THREE.Path();
  path.moveTo(x + radius, y);
  path.quadraticCurveTo(x, y, x, y + radius);
  path.lineTo(x, y + height - radius);
  path.quadraticCurveTo(x, y + height, x + radius, y + height);
  path.lineTo(x + width - radius, y + height);
  path.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  path.lineTo(x + width, y + radius);
  path.quadraticCurveTo(x + width, y, x + width - radius, y);
  path.lineTo(x + radius, y);
  return path;
}

function useMacBookShellGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel: number,
) {
  const geometry = useMemo(() => {
    const result = new THREE.ExtrudeGeometry(roundedRectangleShape(width, height, radius), {
      depth,
      steps: 1,
      curveSegments: 2,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
    });
    result.center();
    result.computeVertexNormals();
    return result;
  }, [width, height, depth, radius, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

const WALL_GRAIN_TEXTURE_SIZE = 128;
const WALL_GRAIN_TILE_SIZE = 0.35; // world units per grain repeat — fine, paint-like scale

// Independent per-pixel noise, not smoothed/Perlin noise, so it tiles with
// no visible seam by construction. Used as a roughnessMap only (see
// useWallGrainTexture below) — a plain painted-plaster micro-variation, not
// a normal/bump map and not a screen-space grain filter.
function createWallGrainTexture(strength: number) {
  const canvas = document.createElement("canvas");
  canvas.width = WALL_GRAIN_TEXTURE_SIZE;
  canvas.height = WALL_GRAIN_TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(WALL_GRAIN_TEXTURE_SIZE, WALL_GRAIN_TEXTURE_SIZE);
  const low = 255 * (1 - strength);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.round(low + Math.random() * (255 - low));
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function useWallGrainTexture(width: number, height: number) {
  const base = useMemo(
    () =>
      typeof document === "undefined"
        ? null
        : createWallGrainTexture(RENDERING_INTENT.architecture.wallGrainStrength),
    [],
  );
  const tiled = useMemo(() => {
    if (!base) return null;
    const texture = base.clone();
    texture.repeat.set(
      Math.round(width / WALL_GRAIN_TILE_SIZE),
      Math.round(height / WALL_GRAIN_TILE_SIZE),
    );
    texture.needsUpdate = true;
    return texture;
  }, [base, width, height]);
  useEffect(() => () => tiled?.dispose(), [tiled]);
  useEffect(() => () => base?.dispose(), [base]);
  return tiled;
}

export function Room() {
  const backWallGrain = useWallGrainTexture(18, 8);
  const accentWallGrain = useWallGrainTexture(8, 8);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial color={C.floor} {...mat} />
      </mesh>
      <mesh position={[0, 4, -4]} receiveShadow>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial
          color={RENDERING_INTENT.architecture.lightWallColor}
          roughness={RENDERING_INTENT.architecture.wallRoughness}
          roughnessMap={backWallGrain}
          metalness={0}
        />
      </mesh>
      <mesh position={[-6, 4, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#303239" {...mat} />
      </mesh>
      <mesh position={[5.85, 4, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial
          color={RENDERING_INTENT.architecture.accentWallColor}
          roughness={RENDERING_INTENT.architecture.wallRoughness}
          roughnessMap={accentWallGrain}
          metalness={0}
        />
      </mesh>
      <mesh position={[0, 8, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial color="#24221f" {...mat} />
      </mesh>
      <ArchitecturalWoodwork />
    </group>
  );
}

function ArchitecturalWoodwork() {
  const baseboardsRef = useRef<THREE.InstancedMesh>(null),
    panelsRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const baseboards = baseboardsRef.current,
      panels = panelsRef.current;
    if (!baseboards || !panels) return;
    const dummy = new THREE.Object3D();
    const baseboardTransforms = [
      { position: [-0.075, 0, -3.995], rotation: 0, scale: [11.85, 1, 1] },
      { position: [-5.995, 0, 1.75], rotation: Math.PI / 2, scale: [11.5, 1, 1] },
      { position: [5.845, 0, 1.75], rotation: -Math.PI / 2, scale: [11.5, 1, 1] },
      { position: [0, 2.055, -3.95], rotation: 0, scale: [5.62, 0.28, 0.7] },
    ] as const;
    baseboardTransforms.forEach(({ position, rotation, scale }, index) => {
      dummy.position.set(...position);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.set(...scale);
      dummy.updateMatrix();
      baseboards.setMatrixAt(index, dummy.matrix);
    });
    const panelColors = [
      "#3b291e",
      "#36241b",
      "#402c20",
      "#39271d",
      "#3d2a1f",
      "#35241b",
      "#3f2b20",
    ];
    panelColors.forEach((color, index) => {
      dummy.position.set((index - 3) * 0.8, 1.08, -3.975);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.786, 1.94, 0.04);
      dummy.updateMatrix();
      panels.setMatrixAt(index, dummy.matrix);
      panels.setColorAt(index, new THREE.Color(color));
    });
    [baseboards, panels].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
    if (panels.instanceColor) panels.instanceColor.needsUpdate = true;
  }, []);
  return (
    <group dispose={null}>
      <instancedMesh
        ref={baseboardsRef}
        args={[ARCHITECTURAL_BASEBOARD_GEOMETRY, ARCHITECTURAL_WOOD_MATERIAL, 4]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={panelsRef}
        args={[ARCHITECTURAL_PANEL_GEOMETRY, ARCHITECTURAL_WOOD_MATERIAL, 7]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

export function Desk() {
  return (
    <group position={[0, 0, -1.5]}>
      <RoundedBox
        args={[5.5, 0.18, 2.2]}
        radius={0.08}
        position={[0, 1.15, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={C.wood} roughness={0.66} />
      </RoundedBox>
      {[-2.35, 2.35].flatMap((x) =>
        [-0.75, 0.75].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.56, z]} castShadow>
            <boxGeometry args={[0.13, 1.12, 0.13]} />
            <meshStandardMaterial color={C.metal} metalness={0.65} roughness={0.34} />
          </mesh>
        )),
      )}
      <Drawer />
    </group>
  );
}

function Drawer() {
  return (
    <group position={[1.72, 0.68, 0]}>
      <RoundedBox args={[1.5, 0.72, 1.72]} radius={0.04} castShadow>
        <meshStandardMaterial color={C.woodEdge} roughness={0.72} />
      </RoundedBox>
      {[0.86, 0.62].map((y) => (
        <group key={y}>
          <mesh position={[0, y - 0.68, 0.87]}>
            <boxGeometry args={[1.37, 0.19, 0.04]} />
            <meshStandardMaterial color={C.wood} />
          </mesh>
          <mesh position={[0, y - 0.68, 0.91]}>
            <boxGeometry args={[0.28, 0.035, 0.05]} />
            <meshStandardMaterial color={C.metal} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Laptop({
  position,
  rotation,
  screenRef,
}: {
  position: [number, number, number];
  rotation: number;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}) {
  const bodyGeometry = useMacBookShellGeometry(1.72, 1.04, 0.044, 0.075, 0.006);
  const lidGeometry = useMacBookShellGeometry(1.7, 0.99, 0.022, 0.07, 0.005);
  return (
    <group
      position={[position[0], 1.24 + position[1], -1.5 + position[2]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
      dispose={null}
    >
      <mesh
        geometry={bodyGeometry}
        position={[0, 0.028, 0]}
        rotation-x={-Math.PI / 2}
        castShadow
        receiveShadow
      >
        <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_PLANE_GEOMETRY}
        scale={[1.35, 0.5, 1]}
        position={[0, 0.058, -0.15]}
        rotation-x={-Math.PI / 2}
      >
        <primitive object={MACBOOK_DARK_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_PLANE_GEOMETRY}
        scale={[0.62, 0.31, 1]}
        position={[0, 0.0585, 0.31]}
        rotation-x={-Math.PI / 2}
      >
        <primitive object={MACBOOK_TRACKPAD_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={MACBOOK_HINGE_GEOMETRY}
        position={[0, 0.061, -0.49]}
        rotation-z={Math.PI / 2}
        castShadow
      >
        <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material" />
      </mesh>
      <group position={[0, 0.061, -0.49]} rotation-x={THREE.MathUtils.degToRad(-13)}>
        <mesh geometry={lidGeometry} position={[0, 0.495, 0]} castShadow>
          <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material" />
        </mesh>
        <mesh
          ref={screenRef}
          geometry={MACBOOK_PLANE_GEOMETRY}
          scale={[1.57, 0.86, 1]}
          position={[0, 0.495, 0.017]}
        >
          <primitive object={MACBOOK_DARK_MATERIAL} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

interface DeskObjectsProps {
  coffeePosition: [number, number, number];
  lampPosition: [number, number, number];
  folderPosition: [number, number];
  folderRotation: number;
  paperPosition: [number, number];
  paperRotation: number;
  penPosition: [number, number];
  penRotation: number;
  paperScreenRef?: MutableRefObject<THREE.Mesh | null>;
  photoScreenRef?: MutableRefObject<THREE.Mesh | null>;
  poemsScreenRef?: MutableRefObject<THREE.Mesh | null>;
  activeScene: SceneId;
  onPhotoOpen?: () => void;
}

export function DeskObjects({
  coffeePosition,
  lampPosition,
  folderPosition,
  folderRotation,
  paperPosition,
  paperRotation,
  penPosition,
  penRotation,
  paperScreenRef,
  photoScreenRef,
  poemsScreenRef,
  activeScene,
  onPhotoOpen,
}: DeskObjectsProps) {
  // --------------------------------------------------------------------------
  // Derived State
  // --------------------------------------------------------------------------

  const isCoffeeActive =
    activeScene === "opening" || activeScene === "about" || activeScene === "projects";
  const isPhoneActive = activeScene === "phone";
  const isPoemsActive = activeScene === "poems";
  const isPoemsMounted = activeScene === "opening" || activeScene === "poems";
  const isAboutActive = activeScene === "about";

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <group position={[0, 1.31, -1.5]}>
      <PaperAndPen
        position={paperPosition}
        rotation={paperRotation}
        penPosition={penPosition}
        penRotation={penRotation}
        screenRef={paperScreenRef}
        photoScreenRef={photoScreenRef}
        photoActive={isAboutActive}
        onPhotoOpen={onPhotoOpen}
      />

      <Phone active={isPhoneActive} />

      {isPoemsMounted && (
        <PoemsPortfolio
          position={folderPosition}
          rotation={folderRotation}
          active={isPoemsActive}
          screenRef={poemsScreenRef}
        />
      )}

      <Coffee position={coffeePosition} active={isCoffeeActive} />

      <DeskLamp position={lampPosition} />
    </group>
  );
}

function PortfolioPhoto({
  materialRef,
}: {
  materialRef: RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const poemsState = useDestinationWorkingSet("poems");
  const photo = useOwnedTexture(
    withSceneBasePath("/pinscher.png"),
    "pinscher-photo",
    isResourceResidentState(poemsState.state),
  );
  if (!photo) return null;
  photo.anisotropy = 8;
  return (
    <mesh
      geometry={PORTFOLIO_PHOTO_GEOMETRY}
      position={[0, 0.0045, -0.022]}
      rotation-x={-Math.PI / 2}
    >
      <meshStandardMaterial
        ref={materialRef}
        map={photo}
        emissiveMap={photo}
        emissive="#ffffff"
        emissiveIntensity={0}
        color="#d2c9ba"
        roughness={0.86}
        metalness={0}
      />
    </mesh>
  );
}

function PortfolioPolaroid({ active }: { active: boolean }) {
  const pointerDemand = useRenderDemand("poems-polaroid-pointer");
  const [hovered, setHovered] = useState(false);
  const backingMaterialRef = useRef<THREE.MeshStandardMaterial>(null),
    photoMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const update = useCallback(
    ({ delta }: { delta: number }) => {
      const target = active && hovered;
      if (backingMaterialRef.current)
        backingMaterialRef.current.emissiveIntensity = THREE.MathUtils.damp(
          backingMaterialRef.current.emissiveIntensity,
          target ? 0.13 : 0,
          5.5,
          delta,
        );
      if (photoMaterialRef.current)
        photoMaterialRef.current.emissiveIntensity = THREE.MathUtils.damp(
          photoMaterialRef.current.emissiveIntensity,
          target ? 0.15 : 0,
          5.5,
          delta,
        );
    },
    [active, hovered],
  );
  useMeasuredRuntimeTask({
    id: "task:poems-polaroid",
    nodeId: "collection:poems",
    priority: 20,
    update,
  });
  useCursor(active && hovered);
  return (
    <group
      position={[-0.445, 0.045, 0.045]}
      rotation-y={0.09}
      onPointerOver={(event) => {
        if (!active) return;
        event.stopPropagation();
        setHovered(true);
        pointerDemand.invalidate("pointer-interaction");
      }}
      onPointerOut={() => {
        setHovered(false);
        pointerDemand.invalidate("pointer-interaction");
      }}
      onClick={(event) => {
        if (!active) return;
        event.stopPropagation();
        window.open("https://www.instagram.com/misterpinscher/", "_blank", "noopener,noreferrer");
      }}
    >
      <mesh geometry={PORTFOLIO_POLAROID_GEOMETRY} castShadow>
        <meshStandardMaterial
          ref={backingMaterialRef}
          color="#d8ceb9"
          roughness={0.92}
          metalness={0}
          emissive="#fff3df"
          emissiveIntensity={0}
        />
      </mesh>
      <Suspense
        fallback={
          <mesh
            geometry={PORTFOLIO_PHOTO_GEOMETRY}
            position={[0, 0.0045, -0.022]}
            rotation-x={-Math.PI / 2}
          >
            <meshStandardMaterial color="#272522" roughness={0.9} />
          </mesh>
        }
      >
        <PortfolioPhoto materialRef={photoMaterialRef} />
      </Suspense>
      <Suspense fallback={null}>
        <Text
          position={[0, 0.0052, 0.163]}
          rotation-x={-Math.PI / 2}
          fontSize={0.027}
          letterSpacing={0.012}
          font={withSceneBasePath("/fonts/PatrickHand-Regular.ttf")}
          anchorX="center"
          anchorY="middle"
        >
          @misterpinscher
          <meshBasicMaterial color="#000000" toneMapped={false} />
        </Text>
      </Suspense>
    </group>
  );
}

// The page's title, intro copy, and "read my poetry" cue are HTML (see
// PoemsOverlay, homography-projected via poemsScreenRef/PlanarProjection in
// Scene.tsx) rather than a baked CanvasTexture or drei <Text> mesh — same
// pixelation concern that moved the "About me" body text to HTML. This mesh
// is just the page's plain paper backdrop.
function PortfolioPoemPreview({ screenRef }: { screenRef?: MutableRefObject<THREE.Mesh | null> }) {
  return (
    <mesh
      ref={screenRef}
      geometry={PORTFOLIO_PAGE_SURFACE_GEOMETRY}
      position={[0.395, 0.071, 0]}
      rotation-x={-Math.PI / 2}
    >
      <meshBasicMaterial color="#eee4cf" toneMapped={false} />
    </mesh>
  );
}

function PoemsPortfolio({
  position,
  rotation,
  active,
  screenRef,
}: {
  position: [number, number];
  rotation: number;
  active: boolean;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}) {
  useFeatureSettleLease("poems-feature", active, "poems-preview");
  const coversRef = useRef<THREE.InstancedMesh>(null),
    liningsRef = useRef<THREE.InstancedMesh>(null),
    pagesRef = useRef<THREE.InstancedMesh>(null);
  const ringsRef = useRef<THREE.InstancedMesh>(null),
    eyeletsRef = useRef<THREE.InstancedMesh>(null),
    stitchesRef = useRef<THREE.InstancedMesh>(null);
  const readingLightRef = useRef<THREE.PointLight>(null);
  const updateReadingLight = useCallback(
    ({ delta }: { delta: number }) => {
      if (readingLightRef.current)
        readingLightRef.current.intensity = THREE.MathUtils.damp(
          readingLightRef.current.intensity,
          active ? 4.5 : 0,
          3.2,
          delta,
        );
    },
    [active],
  );
  useMeasuredRuntimeTask({
    id: "task:poems-reading-light",
    nodeId: "collection:poems",
    priority: 10,
    update: updateReadingLight,
  });
  useLayoutEffect(() => {
    const covers = coversRef.current,
      linings = liningsRef.current,
      pages = pagesRef.current,
      rings = ringsRef.current,
      eyelets = eyeletsRef.current,
      stitches = stitchesRef.current;
    if (!covers || !linings || !pages || !rings || !eyelets || !stitches) return;
    const dummy = new THREE.Object3D();
    [-0.43, 0.43].forEach((x, index) => {
      dummy.position.set(x, -0.015, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      covers.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, 0.013, 0);
      dummy.updateMatrix();
      linings.setMatrixAt(index, dummy.matrix);
    });
    for (let index = 0; index < 6; index++) {
      // Keep the reserve sheets as a tight physical stack instead of six
      // visibly separated cards; the active reading sheet still sits above it.
      dummy.position.set(0.4, 0.024 + index * 0.0072, (index - 2.5) * 0.0012);
      dummy.rotation.set(0, (index - 2.5) * 0.0012, 0);
      dummy.scale.set(1 - index * 0.004, 1, 1 - index * 0.003);
      dummy.updateMatrix();
      pages.setMatrixAt(index, dummy.matrix);
      // The page's binding edge is x=.04. Center each ring on that edge so it
      // visibly passes through the paper instead of floating in the cover gap.
      const bindingZ = -0.245 + index * 0.098;
      dummy.position.set(0.04, 0.057, bindingZ);
      dummy.rotation.set(0, 0, index % 2 ? 0.025 : -0.018);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rings.setMatrixAt(index, dummy.matrix);
      dummy.position.set(0.04, 0.071, bindingZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      eyelets.setMatrixAt(index, dummy.matrix);
    }
    let stitchIndex = 0;
    [-0.43, 0.43].forEach((center) => {
      for (let index = 0; index < 10; index++)
        for (const z of [-0.34, 0.34]) {
          dummy.position.set(center - 0.315 + index * 0.07, 0.015, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          stitches.setMatrixAt(stitchIndex++, dummy.matrix);
        }
      for (let index = 0; index < 6; index++) {
        const outer = center < 0 ? center - 0.36 : center + 0.36;
        dummy.position.set(outer, 0.015, -0.25 + index * 0.1);
        dummy.rotation.set(0, Math.PI / 2, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stitches.setMatrixAt(stitchIndex++, dummy.matrix);
      }
    });
    [covers, linings, pages, rings, eyelets, stitches].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, []);
  return (
    <group
      position={[position[0], -0.0325, position[1]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
      dispose={null}
    >
      <instancedMesh
        ref={coversRef}
        args={[PORTFOLIO_COVER_GEOMETRY, PORTFOLIO_LEATHER_MATERIAL, 2]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={liningsRef}
        args={[PORTFOLIO_LINING_GEOMETRY, PORTFOLIO_LINING_MATERIAL, 2]}
      />
      <mesh geometry={PORTFOLIO_POCKET_GEOMETRY} position={[-0.43, 0.027, 0.055]} castShadow>
        <primitive object={PORTFOLIO_LEATHER_MATERIAL} attach="material" />
      </mesh>
      <PortfolioPolaroid active={active} />
      <mesh geometry={PORTFOLIO_SLOT_GEOMETRY} position={[-0.48, 0.043, 0.13]}>
        <primitive object={PORTFOLIO_LEATHER_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={PORTFOLIO_PEN_LOOP_GEOMETRY}
        position={[-0.075, 0.06, 0.12]}
        rotation-x={Math.PI / 2}
      >
        <primitive object={PORTFOLIO_LEATHER_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={pagesRef}
        args={[PORTFOLIO_PAGE_GEOMETRY, PORTFOLIO_PAPER_MATERIAL, 6]}
        castShadow
      />
      <PortfolioPoemPreview screenRef={screenRef} />
      {active && (
        <pointLight
          ref={readingLightRef}
          position={[0.43, 0.62, 0.02]}
          color="#ffd39a"
          intensity={0}
          distance={1.4}
          decay={2}
        />
      )}
      <instancedMesh
        ref={ringsRef}
        args={[PORTFOLIO_RING_GEOMETRY, PORTFOLIO_METAL_MATERIAL, 6]}
        castShadow
      />
      <instancedMesh
        ref={eyeletsRef}
        args={[PORTFOLIO_EYELET_GEOMETRY, PORTFOLIO_METAL_MATERIAL, 6]}
        castShadow
      />
      <mesh geometry={PORTFOLIO_ZIPPER_GEOMETRY} castShadow>
        <primitive object={PORTFOLIO_METAL_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={stitchesRef}
        args={[PORTFOLIO_STITCH_GEOMETRY, PORTFOLIO_PAPER_MATERIAL, 52]}
      />
      <mesh
        geometry={PORTFOLIO_PULL_GEOMETRY}
        position={[0.81, 0.028, 0.36]}
        rotation-y={-0.3}
        castShadow
      >
        <primitive object={PORTFOLIO_METAL_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={PORTFOLIO_RING_GEOMETRY}
        position={[0.85, 0.042, 0.35]}
        rotation={[Math.PI / 2, 0, -0.3]}
        scale={0.58}
      >
        <primitive object={PORTFOLIO_METAL_MATERIAL} attach="material" />
      </mesh>
    </group>
  );
}

function PhoneScreen({ active }: { active: boolean }) {
  const pointerDemand = useRenderDemand("phone-pointer");
  const texture = useOwnedTexture(withSceneBasePath("/phone.jpeg"), "phone-screen");
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);
  if (texture) {
    texture.anisotropy = 8;
    texture.repeat.set(IPHONE_SCREEN_TEXTURE_REPEAT_X, 1);
    texture.offset.set((1 - IPHONE_SCREEN_TEXTURE_REPEAT_X) / 2, 0);
  }
  useCursor(active && hovered);
  useEffect(() => {
    if (!active) setHovered(false);
  }, [active]);
  useEffect(() => {
    // The phone collection can sleep as soon as focus leaves the scene. Set
    // the visual state here as well as in the runtime task so a sleeping node
    // cannot leave the last screen glow behind.
    if (materialRef.current) {
      const channel = active ? 1 : 0;
      materialRef.current.color.setRGB(channel, channel, channel);
    }
  }, [active]);
  const updateScreen = useCallback(
    ({ delta }: { delta: number }) => {
      const material = materialRef.current;
      const easing = 16;
      if (material) {
        let channel = THREE.MathUtils.damp(material.color.r, active ? 1 : 0, easing, delta);
        if (!active && channel < 0.001) channel = 0;
        material.color.setRGB(channel, channel, channel);
      }
    },
    [active],
  );
  useMeasuredRuntimeTask({
    id: "task:phone-screen",
    nodeId: "collection:phone",
    priority: 10,
    update: updateScreen,
  });
  return (
    <>
      <mesh
        geometry={IPHONE_SCREEN_IMAGE_GEOMETRY}
        position={[0, 0.0182, 0]}
        raycast={active ? undefined : () => null}
        onPointerOver={
          active
            ? (event) => {
                event.stopPropagation();
                setHovered(true);
                pointerDemand.invalidate("pointer-interaction");
              }
            : undefined
        }
        onPointerOut={
          active
            ? () => {
                setHovered(false);
                pointerDemand.invalidate("pointer-interaction");
              }
            : undefined
        }
        onClick={
          active
            ? (event) => {
                event.stopPropagation();
                window.open(PHONE_CONTACT_URL, "_blank", "noopener,noreferrer");
              }
            : undefined
        }
      >
        <meshBasicMaterial ref={materialRef} map={texture} color="#050505" toneMapped={false} />
      </mesh>
      {active && (
        <group
          position={[0, 0.022, 0.245]}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
            pointerDemand.invalidate("pointer-interaction");
          }}
          onPointerOut={() => {
            setHovered(false);
            pointerDemand.invalidate("pointer-interaction");
          }}
          onClick={(event) => {
            event.stopPropagation();
            window.open(PHONE_CONTACT_URL, "_blank", "noopener,noreferrer");
          }}
        >
          <mesh geometry={IPHONE_WHATSAPP_BUTTON_GEOMETRY}>
            <primitive object={IPHONE_WHATSAPP_BUTTON_MATERIAL} attach="material" />
          </mesh>
          <Suspense fallback={null}>
            <Text
              position={[0, 0.004, 0]}
              rotation-x={-Math.PI / 2}
              fontSize={0.015}
              anchorX="center"
              anchorY="middle"
            >
              Open WhatsApp
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </Text>
          </Suspense>
        </group>
      )}
    </>
  );
}

function Phone({ active }: { active: boolean }) {
  useFeatureSettleLease("phone-feature", active, "phone-screen");
  const workingSet = useDestinationWorkingSet("phone");
  const screenResident = isResourceResidentState(workingSet.state);
  return (
    <group
      position={PHONE_LAYOUT.localPosition}
      rotation-y={THREE.MathUtils.degToRad(PHONE_LAYOUT.rotationDegrees)}
      dispose={null}
    >
      <mesh geometry={IPHONE_BODY_GEOMETRY} castShadow receiveShadow>
        <primitive object={IPHONE_FRAME_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={IPHONE_SCREEN_GEOMETRY} position={[0, 0.0175, 0]}>
        <primitive object={IPHONE_BACK_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={IPHONE_DYNAMIC_ISLAND_GEOMETRY} position={[0, 0.0185, -0.255]}>
        <primitive object={IPHONE_GLASS_MATERIAL} attach="material" />
      </mesh>
      {screenResident && <PhoneScreen active={active} />}
      <mesh geometry={IPHONE_BACK_GEOMETRY} position={[0, -0.0172, 0]}>
        <primitive object={IPHONE_BACK_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={IPHONE_CAMERA_ISLAND_GEOMETRY} position={[-0.085, -0.0164, -0.23]} castShadow>
        <primitive object={IPHONE_BACK_MATERIAL} attach="material" />
      </mesh>
      {[
        [-0.112, -0.262],
        [-0.058, -0.262],
        [-0.085, -0.205],
      ].map(([x, z]) => (
        <mesh
          key={`${x}:${z}`}
          geometry={IPHONE_LENS_GEOMETRY}
          position={[x, -0.021, z]}
          castShadow
        >
          <primitive object={IPHONE_GLASS_MATERIAL} attach="material" />
        </mesh>
      ))}
      <mesh
        geometry={IPHONE_FLASH_GEOMETRY}
        position={[-0.045, -0.0231, -0.205]}
        rotation-x={Math.PI / 2}
      >
        <primitive object={IPHONE_FLASH_MATERIAL} attach="material" />
      </mesh>
    </group>
  );
}

// Source photo is 2653x3538 (portrait). Hardcoded like PosterImages' own
// sourceAspect values, so the photo plane isn't stretched.
const ME_PHOTO_ASPECT = 2653 / 3538;
const POLAROID_CARD_WIDTH = 0.26;
const POLAROID_CARD_HEIGHT = 0.37;
const POLAROID_PHOTO_MARGIN = 0.016;
const POLAROID_PHOTO_WIDTH = POLAROID_CARD_WIDTH - POLAROID_PHOTO_MARGIN * 2;
const POLAROID_PHOTO_HEIGHT = POLAROID_PHOTO_WIDTH / ME_PHOTO_ASPECT;
// Offsets the photo toward the top of the card, leaving the classic thicker
// polaroid strip below it.
const POLAROID_PHOTO_Z_OFFSET =
  POLAROID_CARD_HEIGHT / 2 - POLAROID_PHOTO_MARGIN - POLAROID_PHOTO_HEIGHT / 2;
const POLAROID_CLIP_WOOD_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#c9a876",
  roughness: 0.68,
});
const POLAROID_CLIP_METAL_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#b7bcc2",
  metalness: 0.7,
  roughness: 0.35,
});

// A plain wooden clothespin — an elongated capsule with a thin metal band
// around its middle — clipped across the top edge where the polaroid
// overlaps the paper. Simpler and more unmistakably "a clip" than a
// hand-modeled paperclip silhouette.
function PolaroidClip() {
  return (
    <group position={[-POLAROID_CARD_WIDTH / 2 + 0.04, 0.009, -POLAROID_CARD_HEIGHT / 2 - 0.004]}>
      <Capsule args={[0.0055, 0.05, 4, 8]} rotation-z={Math.PI / 2} castShadow>
        <primitive object={POLAROID_CLIP_WOOD_MATERIAL} attach="material" />
      </Capsule>
      <mesh rotation-y={Math.PI / 2} castShadow>
        <torusGeometry args={[0.0062, 0.0012, 8, 16]} />
        <primitive object={POLAROID_CLIP_METAL_MATERIAL} attach="material" />
      </mesh>
    </group>
  );
}

function PolaroidPhoto({
  active,
  onOpen,
  screenRef,
}: {
  active: boolean;
  onOpen?: () => void;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}) {
  // Cache-busted: rules out a stale/broken texture cached under the plain
  // "/me.jpeg" key from an earlier attempt this session.
  const texture = useTexture(withSceneBasePath("/me.jpeg") + "?polaroid=1");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const pointerDemand = useRenderDemand("polaroid-pointer");
  const [hovered, setHovered] = useState(false);
  const interactive = active;
  useCursor(hovered && interactive);
  return (
    <group
      position={[0.19, 0.008, -0.3]}
      rotation-y={THREE.MathUtils.degToRad(-10)}
      raycast={interactive ? undefined : () => null}
      onPointerOver={
        interactive
          ? () => {
              setHovered(true);
              pointerDemand.invalidate("pointer-interaction");
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              setHovered(false);
              pointerDemand.invalidate("pointer-interaction");
            }
          : undefined
      }
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onOpen?.();
              pointerDemand.invalidate("pointer-interaction");
            }
          : undefined
      }
    >
      <RoundedBox
        args={[POLAROID_CARD_WIDTH, 0.004, POLAROID_CARD_HEIGHT]}
        radius={0.004}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#f2ede2" roughness={0.82} />
      </RoundedBox>
      {/* Unlit on purpose: the photo should read the same regardless of
        this scene's dramatic, direction-heavy lighting, and this rules out
        any lighting/shadow interaction as a reason it wouldn't show. Y
        offset intentionally generous to rule out z-fighting against the
        card underneath it. */}
      <mesh position={[0, 0.02, -POLAROID_PHOTO_Z_OFFSET]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[POLAROID_PHOTO_WIDTH, POLAROID_PHOTO_HEIGHT]} />
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Invisible — exists purely so PlanarProjection (Scene.tsx) can track
        this card's screen-projected corners for the HTML caption overlay
        (PolaroidCaptionOverlay), the same technique used for the laptop
        screen and the paper. The caption is HTML, not 3D text, per the
        same pixelation concern that moved the "About me" body text to
        HTML. */}
      <mesh ref={screenRef} visible={false} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[POLAROID_CARD_WIDTH, POLAROID_CARD_HEIGHT]} />
        <meshBasicMaterial />
      </mesh>
      <PolaroidClip />
    </group>
  );
}

function PaperAndPen({
  position,
  rotation,
  penPosition,
  penRotation,
  screenRef,
  photoScreenRef,
  photoActive,
  onPhotoOpen,
}: {
  position: [number, number];
  rotation: number;
  penPosition: [number, number];
  penRotation: number;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
  photoScreenRef?: MutableRefObject<THREE.Mesh | null>;
  photoActive: boolean;
  onPhotoOpen?: () => void;
}) {
  return (
    <group
      position={[position[0], -0.064, position[1]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
    >
      <RoundedBox args={[0.72, 0.006, 1.02]} radius={0.006} castShadow receiveShadow>
        <meshStandardMaterial
          color="#d8d5ce"
          roughness={0.96}
          emissive="#25221e"
          emissiveIntensity={0.08}
        />
      </RoundedBox>
      <mesh ref={screenRef} position={[0, 0.004, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.708, 1.008]} />
        <meshBasicMaterial color="#d2cec5" toneMapped={false} />
      </mesh>
      <Suspense fallback={null}>
        <PolaroidPhoto active={photoActive} onOpen={onPhotoOpen} screenRef={photoScreenRef} />
      </Suspense>
      <Pen position={penPosition} rotation={penRotation} />
    </group>
  );
}

function Pen({ position, rotation }: { position: [number, number]; rotation: number }) {
  return (
    <group
      position={[position[0], 0.021, position[1]]}
      rotation-y={THREE.MathUtils.degToRad(rotation)}
    >
      <mesh position={[0.065, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.0165, 0.0185, 0.394, 24]} />
        <meshPhysicalMaterial
          color="#17191a"
          metalness={0.46}
          roughness={0.28}
          clearcoat={0.5}
          clearcoatRoughness={0.24}
        />
      </mesh>
      <mesh position={[-0.187, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.0155, 0.0168, 0.11, 22]} />
        <meshStandardMaterial color="#0d0f10" metalness={0.3} roughness={0.42} />
      </mesh>
      {[-0.222, -0.205, -0.188, -0.171, -0.154].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.0166, 0.00065, 5, 18]} />
          <meshStandardMaterial color="#34383a" metalness={0.66} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.273, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.0025, 0.0157, 0.062, 24]} />
        <meshStandardMaterial color="#8b8983" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[-0.306, 0, 0]} castShadow>
        <sphereGeometry args={[0.0032, 12, 8]} />
        <meshStandardMaterial color="#171717" metalness={0.82} roughness={0.16} />
      </mesh>
      <mesh position={[-0.13, 0, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.0176, 0.0015, 7, 22]} />
        <meshStandardMaterial color="#7d7b75" metalness={0.82} roughness={0.22} />
      </mesh>
      <mesh position={[0.282, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.015, 0.0185, 0.04, 22]} />
        <meshStandardMaterial color="#25282a" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0.304, 0, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.015, 0.012, 18]} />
        <meshStandardMaterial color="#77756f" metalness={0.78} roughness={0.23} />
      </mesh>
      <RoundedBox
        args={[0.17, 0.004, 0.008]}
        radius={0.002}
        position={[0.17, 0.0195, 0]}
        rotation-z={-0.025}
        castShadow
      >
        <meshStandardMaterial color="#77756f" metalness={0.84} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0.082, 0.0175, 0]} rotation-z={-0.08}>
        <boxGeometry args={[0.018, 0.004, 0.01]} />
        <meshStandardMaterial color="#77756f" metalness={0.84} roughness={0.2} />
      </mesh>
    </group>
  );
}

function DeskLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation-y={THREE.MathUtils.degToRad(6)} dispose={null}>
      <mesh geometry={DESK_LAMP_BASE_GEOMETRY} position={[0, 0.0325, 0]} castShadow receiveShadow>
        <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={DESK_LAMP_BASE_INSET_GEOMETRY} position={[0, 0.068, 0]} castShadow>
        <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={DESK_LAMP_JOINT_GEOMETRY}
        position={[-0.07, 0.12, 0]}
        rotation-x={Math.PI / 2}
        castShadow
      >
        <primitive object={DESK_LAMP_BRASS_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={DESK_LAMP_ARM_GEOMETRY}
        position={[-0.025, 0.42, 0]}
        rotation-z={-0.14}
        scale={[1, 0.64, 1]}
        castShadow
      >
        <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={DESK_LAMP_JOINT_GEOMETRY}
        position={[0.02, 0.73, 0]}
        rotation-x={Math.PI / 2}
        castShadow
      >
        <primitive object={DESK_LAMP_BRASS_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={DESK_LAMP_ARM_GEOMETRY}
        position={[0.13, 0.96, 0]}
        rotation-z={-0.39}
        scale={[1, 0.5, 1]}
        castShadow
      >
        <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material" />
      </mesh>
      <group position={[0.28, 1.18, 0]} rotation-z={0.28}>
        <mesh geometry={DESK_LAMP_COLLAR_GEOMETRY} position={[0, 0.13, 0]} castShadow>
          <primitive object={DESK_LAMP_BRASS_MATERIAL} attach="material" />
        </mesh>
        <mesh geometry={DESK_LAMP_HEAD_GEOMETRY} castShadow>
          <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material" />
        </mesh>
        <mesh
          geometry={DESK_LAMP_DIFFUSER_GEOMETRY}
          position={[0, -0.104, 0]}
          rotation-x={Math.PI / 2}
        >
          <primitive object={DESK_LAMP_DIFFUSER_MATERIAL} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

function CoffeeSteam({ active }: { active: boolean }) {
  const renderDemand = useRenderDemand("coffee-steam");
  const refs = useRef<THREE.Sprite[]>([]);
  const materials = useMemo(
    () =>
      Array.from(
        { length: 3 },
        () =>
          new THREE.SpriteMaterial({
            map: STEAM_TEXTURE,
            color: "#d7d0c7",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  );
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  useEffect(() => {
    if (active)
      return renderDemand.acquirePeriodic({
        reason: "coffee-steam",
        cadence: "15fps",
        priority: 0,
      });
  }, [active, renderDemand]);
  const update = useCallback(({ elapsed }: { elapsed: number }) => {
    refs.current.forEach((sprite, index) => {
      const speed = [0.135, 0.112, 0.096][index],
        phase = [0.08, 0.43, 0.71][index];
      const cycle = (elapsed * speed + phase) % 1,
        drift =
          Math.sin(
            elapsed * (0.43 + index * 0.07) + index * 1.9 + Math.sin(elapsed * 0.17 + index),
          ) * 0.027;
      sprite.position.set(
        (index - 1) * 0.025 + drift,
        0.105 + cycle * 0.34,
        Math.cos(elapsed * (0.31 + index * 0.05) + index) * 0.018,
      );
      sprite.scale.set(0.045 + cycle * 0.035, 0.14 + cycle * 0.1, 1);
      sprite.material.opacity = Math.pow(Math.sin(Math.PI * cycle), 1.4) * (0.045 + index * 0.006);
      sprite.material.rotation = Math.sin(elapsed * 0.29 + index * 2.1) * 0.16;
    });
  }, []);
  useMeasuredRuntimeTask({ id: "task:coffee-steam", nodeId: "world", priority: 30, update });
  return (
    <>
      {materials.map((material, index) => (
        <sprite
          key={index}
          ref={(sprite) => {
            if (sprite) refs.current[index] = sprite;
          }}
        >
          <primitive object={material} attach="material" />
        </sprite>
      ))}
    </>
  );
}

function Coffee({ position, active }: { position: [number, number, number]; active: boolean }) {
  return (
    <group position={position} rotation-y={Math.PI + THREE.MathUtils.degToRad(5)} dispose={null}>
      <mesh geometry={MUG_BODY_GEOMETRY} position={[0, -0.075, 0]} castShadow receiveShadow>
        <primitive object={MUG_CERAMIC_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={MUG_HANDLE_GEOMETRY} position={[0.135, -0.075, 0]} castShadow>
        <primitive object={MUG_CERAMIC_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={MUG_COFFEE_GEOMETRY} position={[0, 0.083, 0]} rotation-x={-Math.PI / 2}>
        <primitive object={MUG_COFFEE_MATERIAL} attach="material" />
      </mesh>
      <CoffeeSteam active={active} />
    </group>
  );
}

export function Chair() {
  const armSupportsRef = useRef<THREE.InstancedMesh>(null),
    armPadsRef = useRef<THREE.InstancedMesh>(null);
  const baseArmsRef = useRef<THREE.InstancedMesh>(null),
    casterForksRef = useRef<THREE.InstancedMesh>(null),
    castersRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const supports = armSupportsRef.current,
      pads = armPadsRef.current,
      baseArms = baseArmsRef.current,
      forks = casterForksRef.current,
      casters = castersRef.current;
    if (!supports || !pads || !baseArms || !forks || !casters) return;
    const dummy = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0),
      tangent = new THREE.Vector3();
    [-1, 1].forEach((side, index) => {
      dummy.position.set(side * 0.55, 0.43, 0.08);
      dummy.rotation.set(0, 0, side * -0.08);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      supports.setMatrixAt(index, dummy.matrix);
      dummy.position.set(side * 0.57, 0.7, -0.035);
      dummy.rotation.set(0, side * 0.035, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pads.setMatrixAt(index, dummy.matrix);
    });
    Array.from({ length: 5 }, (_, index) => (index * Math.PI * 2) / 5 + 0.18).forEach(
      (angle, index) => {
        dummy.position.set(Math.cos(angle) * 0.32, -0.405, Math.sin(angle) * 0.32);
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(0.64, 1, 1);
        dummy.updateMatrix();
        baseArms.setMatrixAt(index, dummy.matrix);
        dummy.position.set(Math.cos(angle) * 0.65, -0.455, Math.sin(angle) * 0.65);
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        forks.setMatrixAt(index, dummy.matrix);
        tangent.set(-Math.sin(angle), 0, Math.cos(angle));
        dummy.position.set(Math.cos(angle) * 0.68, -0.49, Math.sin(angle) * 0.68);
        dummy.quaternion.setFromUnitVectors(up, tangent);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        casters.setMatrixAt(index, dummy.matrix);
      },
    );
    [supports, pads, baseArms, forks, casters].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, []);
  return (
    <group
      position={[1.45, 0.55, 1.08]}
      rotation-y={Math.PI + THREE.MathUtils.degToRad(-135)}
      rotation-z={-0.018}
      dispose={null}
    >
      <mesh geometry={CHAIR_SEAT_GEOMETRY} position={[0, 0.12, 0]} castShadow receiveShadow>
        <primitive object={CHAIR_FABRIC_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.045, 0.03]} castShadow>
        <boxGeometry args={[1, 0.055, 0.78]} />
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <group position={[0, 1.02, 0.4]} rotation-x={-0.1}>
        <mesh geometry={CHAIR_BACK_FRAME_GEOMETRY} castShadow>
          <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
        </mesh>
        <mesh geometry={CHAIR_BACK_MESH_GEOMETRY} position={[0, 0, 0.03]} castShadow>
          <primitive object={CHAIR_FABRIC_MATERIAL} attach="material" />
        </mesh>
        <mesh geometry={CHAIR_BACK_PANEL_GEOMETRY} position={[0, 0, -0.045]} castShadow>
          <primitive object={CHAIR_BACKING_MATERIAL} attach="material" />
        </mesh>
      </group>
      <mesh geometry={CHAIR_SPINE_GEOMETRY} position={[0, 0.5, 0.37]} rotation-x={-0.12} castShadow>
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <mesh
        geometry={CHAIR_LUMBAR_GEOMETRY}
        position={[0, 0.76, 0.385]}
        rotation-z={Math.PI / 2}
        castShadow
      >
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={armSupportsRef}
        args={[CHAIR_ARM_SUPPORT_GEOMETRY, CHAIR_FRAME_MATERIAL, 2]}
        castShadow
      />
      <instancedMesh
        ref={armPadsRef}
        args={[CHAIR_ARM_PAD_GEOMETRY, CHAIR_FABRIC_MATERIAL, 2]}
        castShadow
      />
      <mesh geometry={CHAIR_GAS_LIFT_GEOMETRY} position={[0, -0.145, 0]} castShadow>
        <primitive object={CHAIR_METAL_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={CHAIR_GAS_COLLAR_GEOMETRY} position={[0, -0.235, 0]} castShadow>
        <primitive object={CHAIR_FRAME_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={CHAIR_HUB_GEOMETRY} position={[0, -0.405, 0]} castShadow>
        <primitive object={CHAIR_METAL_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={baseArmsRef}
        args={[CHAIR_BASE_ARM_GEOMETRY, CHAIR_METAL_MATERIAL, 5]}
        castShadow
      />
      <instancedMesh
        ref={casterForksRef}
        args={[CHAIR_CASTER_FORK_GEOMETRY, CHAIR_FRAME_MATERIAL, 5]}
        castShadow
      />
      <instancedMesh
        ref={castersRef}
        args={[CHAIR_CASTER_GEOMETRY, CHAIR_FRAME_MATERIAL, 5]}
        castShadow
      />
    </group>
  );
}

const CERTIFICATE_THUMBNAILS = CERTIFICATES.map(({ image }) =>
  withSceneBasePath(`/certificates/thumbs/${image.replace(/\.[^.]+$/, ".jpg")}`),
);
const ACTIVE_CERTIFICATE_COLOR = new THREE.Color().setRGB(1.46, 1.43, 1.38);
const AMBIENT_CERTIFICATE_COLOR = new THREE.Color("#756b5e");
const ACTIVE_CERTIFICATE_LABEL_COLOR = new THREE.Color("#9a7b4e");
const AMBIENT_CERTIFICATE_LABEL_COLOR = new THREE.Color("#0c0a08");
const CERTIFICATE_LIGHT_RISE = 0.44;
const CERTIFICATE_LIGHT_FALL = 1.1;
const FRAME_WOOD = ["#36241a", "#251c18", "#463022"] as const;
const CERTIFICATE_HINT_COLOR = new THREE.Color("#e6a06d");

// A pulsing ring + dot on the first certificate, hinting that cards are
// clickable. Stays visible for as long as the shelf is illuminated and no
// certificate has been opened yet; dismissed for the rest of the session
// the moment the visitor clicks any certificate.
function CertificateClickHint({
  illuminated,
  hovered,
  dismissed,
}: {
  illuminated: boolean;
  hovered: boolean;
  dismissed: boolean;
}) {
  // Runs for as long as the hint should be visible rather than a bounded
  // burst — Number.MAX_SAFE_INTEGER just avoids the lease's own expiry from
  // ever cutting it off first; the effect's cleanup (on illuminated/dismissed
  // flipping) still releases it immediately.
  useFeatureSettleLease(
    "certificate-click-hint",
    illuminated && !dismissed,
    "certificate-animation",
    Number.MAX_SAFE_INTEGER,
  );
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const dotMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const active = illuminated && !dismissed && !hovered;
  useMeasuredRuntimeTask({
    id: "task:certificate-click-hint",
    nodeId: "collection:certificates",
    priority: 20,
    update: ({ delta, elapsed }) => {
      if (!ringRef.current || !ringMaterialRef.current || !dotMaterialRef.current) return;
      const cycle = active ? Math.sin(elapsed * 2.6) * 0.5 + 0.5 : 0;
      ringRef.current.scale.setScalar(1 + cycle * 0.9);
      ringMaterialRef.current.opacity = THREE.MathUtils.damp(
        ringMaterialRef.current.opacity,
        active ? (1 - cycle) * 0.9 : 0,
        8,
        delta,
      );
      dotMaterialRef.current.opacity = THREE.MathUtils.damp(
        dotMaterialRef.current.opacity,
        active ? 0.95 : 0,
        8,
        delta,
      );
    },
  });
  return (
    <group position={[0.196, 0.148, 0.05]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.046, 0.066, 32]} />
        <meshBasicMaterial
          ref={ringMaterialRef}
          color={CERTIFICATE_HINT_COLOR}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[0.04, 28]} />
        <meshBasicMaterial
          ref={dotMaterialRef}
          color={CERTIFICATE_HINT_COLOR}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CertificateCard({
  record,
  texture,
  index,
  position,
  rotation,
  tiltY,
  baseScale,
  illuminated,
  runtimeUpdates,
  onSelect,
  hintDismissed,
}: {
  record: CertificateRecord;
  texture: THREE.Texture;
  index: number;
  position: [number, number, number];
  rotation: number;
  tiltY: number;
  baseScale: number;
  illuminated: boolean;
  runtimeUpdates: boolean;
  onSelect?: (slug: string) => void;
  hintDismissed: boolean;
}) {
  const pointerDemand = useRenderDemand(`certificate-pointer:${index}`);
  const ref = useRef<THREE.Group>(null);
  const imageMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const labelMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const frameColor = FRAME_WOOD[index % FRAME_WOOD.length];
  const activeLabelColor = useMemo(
    () =>
      ACTIVE_CERTIFICATE_LABEL_COLOR.clone().lerp(
        new THREE.Color(index < 9 ? "#b99a67" : "#7f6a4b"),
        0.45,
      ),
    [index],
  );
  const [initialImageColor] = useState(() =>
    (illuminated ? ACTIVE_CERTIFICATE_COLOR : AMBIENT_CERTIFICATE_COLOR).clone(),
  );
  const [initialImageEmission] = useState(() => (illuminated ? 0.32 : 0));
  const [initialLabelColor] = useState(() =>
    (illuminated ? activeLabelColor : AMBIENT_CERTIFICATE_LABEL_COLOR).clone(),
  );
  const [hovered, setHovered] = useState(false);
  const interactive = illuminated;
  useCursor(hovered && interactive);
  useMeasuredRuntimeTask({
    id: `task:certificate-card:${index}`,
    nodeId: "collection:certificates",
    priority: 30,
    update: ({ delta }) =>
      measurePerformanceTask("CertificateCard", () => {
        if (!runtimeUpdates && !hovered) return;
        if (!ref.current) return;
        const activeHover = hovered && interactive;
        const scale = THREE.MathUtils.damp(
          ref.current.scale.x,
          baseScale * (activeHover ? 1.065 : 1),
          6.5,
          delta,
        );
        ref.current.scale.setScalar(scale);
        ref.current.position.z = THREE.MathUtils.damp(
          ref.current.position.z,
          activeHover ? position[2] + 0.06 : position[2],
          6,
          delta,
        );
        if (imageMaterialRef.current) {
          const target = illuminated ? ACTIVE_CERTIFICATE_COLOR : AMBIENT_CERTIFICATE_COLOR;
          const easing = illuminated ? CERTIFICATE_LIGHT_RISE : CERTIFICATE_LIGHT_FALL;
          imageMaterialRef.current.color.r = THREE.MathUtils.damp(
            imageMaterialRef.current.color.r,
            target.r,
            easing,
            delta,
          );
          imageMaterialRef.current.color.g = THREE.MathUtils.damp(
            imageMaterialRef.current.color.g,
            target.g,
            easing,
            delta,
          );
          imageMaterialRef.current.color.b = THREE.MathUtils.damp(
            imageMaterialRef.current.color.b,
            target.b,
            easing,
            delta,
          );
          imageMaterialRef.current.emissiveIntensity = THREE.MathUtils.damp(
            imageMaterialRef.current.emissiveIntensity,
            illuminated ? 0.32 : 0,
            easing,
            delta,
          );
          if (labelMaterialRef.current) {
            const labelTarget = illuminated ? activeLabelColor : AMBIENT_CERTIFICATE_LABEL_COLOR;
            labelMaterialRef.current.color.r = THREE.MathUtils.damp(
              labelMaterialRef.current.color.r,
              labelTarget.r,
              easing,
              delta,
            );
            labelMaterialRef.current.color.g = THREE.MathUtils.damp(
              labelMaterialRef.current.color.g,
              labelTarget.g,
              easing,
              delta,
            );
            labelMaterialRef.current.color.b = THREE.MathUtils.damp(
              labelMaterialRef.current.color.b,
              labelTarget.b,
              easing,
              delta,
            );
          }
        }
      }),
  });
  return (
    <group
      ref={ref}
      position={position}
      rotation={[0, tiltY, rotation]}
      scale={baseScale}
      raycast={interactive ? undefined : () => null}
      onPointerOver={
        interactive
          ? () => {
              setHovered(true);
              pointerDemand.invalidate("pointer-interaction");
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              setHovered(false);
              pointerDemand.invalidate("pointer-interaction");
            }
          : undefined
      }
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onSelect?.(record.slug);
              pointerDemand.invalidate("pointer-interaction");
            }
          : undefined
      }
    >
      <RoundedBox args={[0.482, 0.354, 0.035]} radius={0.012} castShadow>
        <meshStandardMaterial
          color={frameColor}
          metalness={index % 3 === 1 ? 0.22 : 0.06}
          roughness={index % 3 === 1 ? 0.46 : 0.64}
        />
      </RoundedBox>
      <RoundedBox args={[0.456, 0.332, 0.014]} radius={0.005} position={[0, 0, 0.022]}>
        <meshStandardMaterial color="#b7ab96" roughness={0.91} />
      </RoundedBox>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={[0.428, 0.308]} />
        <meshStandardMaterial
          ref={imageMaterialRef}
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={initialImageEmission}
          color={initialImageColor}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      <mesh position={[-0.196, -0.169, 0.026]}>
        <boxGeometry args={[0.048, 0.009, 0.005]} />
        <meshStandardMaterial
          ref={labelMaterialRef}
          color={initialLabelColor}
          metalness={0.32}
          roughness={0.52}
        />
      </mesh>
      {index === 0 && (
        <CertificateClickHint
          illuminated={illuminated}
          hovered={hovered}
          dismissed={hintDismissed}
        />
      )}
    </group>
  );
}

function CertificateGallery({
  illuminated,
  onCertificateSelect,
  hintDismissed,
}: {
  illuminated: boolean;
  onCertificateSelect?: (slug: string) => void;
  hintDismissed: boolean;
}) {
  const textures = useOwnedTextures(CERTIFICATE_THUMBNAILS, "certificate-thumbnails");
  const runtimeUpdates = useRuntimeSnapshot(
    (snapshot) =>
      snapshot.nodes.find((node) => node.id === "collection:certificates")?.updates ?? true,
  );
  textures.forEach((texture) => {
    texture.anisotropy = 8;
  });
  if (textures.length !== CERTIFICATE_THUMBNAILS.length) return null;
  return (
    <>
      {CERTIFICATE_LAYOUT.map(({ index, x, y, rotation, tiltY, scale, depth }) => (
        <CertificateCard
          key={CERTIFICATES[index].image}
          record={CERTIFICATES[index]}
          texture={textures[index]}
          index={index}
          position={[x, y, depth]}
          rotation={rotation}
          tiltY={tiltY}
          baseScale={scale}
          illuminated={illuminated}
          runtimeUpdates={runtimeUpdates}
          onSelect={onCertificateSelect}
          hintDismissed={hintDismissed}
        />
      ))}
    </>
  );
}

const PLACEHOLDER_CERTIFICATE_SHADES = [
  "#8c8579",
  "#847e73",
  "#7c766c",
  "#928b7e",
  "#787268",
] as const;

// A skeleton-loader layout (one wider "title" bar, a few shorter "body"
// lines) hinting that a document with text is loading, without any font,
// texture, or per-line mesh — see CertificatePlaceholderLines below.
const PLACEHOLDER_LINE_LEFT_MARGIN = -0.19;
const PLACEHOLDER_LINES = [
  { y: 0.115, width: 0.24, height: 0.022 },
  { y: 0.05, width: 0.34, height: 0.013 },
  { y: 0.01, width: 0.3, height: 0.013 },
  { y: -0.03, width: 0.32, height: 0.013 },
  { y: -0.07, width: 0.2, height: 0.013 },
] as const;
const PLACEHOLDER_LINE_COUNT = CERTIFICATE_LAYOUT.length * PLACEHOLDER_LINES.length;
const PLACEHOLDER_LINE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const PLACEHOLDER_LINE_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#6d675d",
  roughness: 0.96,
});

// One shared InstancedMesh draws every simulated text line across every
// placeholder card in a single draw call, so the "loading" hint costs
// effectively nothing regardless of how many cards are still placeholders.
function CertificatePlaceholderLines() {
  const linesRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = linesRef.current;
    if (!mesh) return;
    const card = new THREE.Object3D();
    const line = new THREE.Object3D();
    let instance = 0;
    CERTIFICATE_LAYOUT.forEach(({ x, y, rotation, tiltY, scale, depth }) => {
      card.position.set(x, y, depth);
      card.rotation.set(0, tiltY, rotation);
      card.scale.setScalar(scale);
      card.updateMatrix();
      PLACEHOLDER_LINES.forEach((lineSpec) => {
        line.position.set(PLACEHOLDER_LINE_LEFT_MARGIN + lineSpec.width / 2, lineSpec.y, 0.021);
        line.scale.set(lineSpec.width, lineSpec.height, 0.006);
        line.updateMatrix();
        line.matrix.premultiply(card.matrix);
        mesh.setMatrixAt(instance, line.matrix);
        instance++;
      });
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  return (
    <instancedMesh
      ref={linesRef}
      args={[PLACEHOLDER_LINE_GEOMETRY, PLACEHOLDER_LINE_MATERIAL, PLACEHOLDER_LINE_COUNT]}
      raycast={() => null}
    />
  );
}

function CertificatePlaceholders() {
  return (
    <>
      {CERTIFICATE_LAYOUT.map(({ index, x, y, rotation, tiltY, scale, depth }) => (
        <RoundedBox
          key={CERTIFICATES[index].image}
          args={[0.482, 0.354, 0.035]}
          radius={0.012}
          position={[x, y, depth]}
          rotation={[0, tiltY, rotation]}
          scale={scale}
          raycast={() => null}
          castShadow
        >
          <meshStandardMaterial
            color={PLACEHOLDER_CERTIFICATE_SHADES[index % PLACEHOLDER_CERTIFICATE_SHADES.length]}
            roughness={0.94}
            metalness={0.02}
          />
        </RoundedBox>
      ))}
      <CertificatePlaceholderLines />
    </>
  );
}

function ShelfPracticalLighting({ illuminated }: { illuminated: boolean }) {
  const ledRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const [initialStripEmission] = useState(() => (illuminated ? 0.018 : 0));
  const updateShelfLighting = useCallback(
    ({ delta }: { delta: number }) => {
      const easing = illuminated ? 0.4 : 0.72;
      ledRefs.current.forEach((material) => {
        material.emissiveIntensity = THREE.MathUtils.damp(
          material.emissiveIntensity,
          illuminated ? 0.018 : 0,
          easing,
          delta,
        );
      });
    },
    [illuminated],
  );
  useMeasuredRuntimeTask({
    id: "task:certificates-shelf-lighting",
    nodeId: "collection:certificates",
    priority: 10,
    update: updateShelfLighting,
  });
  return (
    <>
      {[1.717, 0.827, -0.063, -0.953].map((y, rowIndex) => (
        <group key={y} position={[0, y, 0]}>
          <mesh position={[0, 0, 0.335]}>
            <boxGeometry args={[2.28, 0.004, 0.01]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) ledRefs.current[rowIndex] = material;
              }}
              color="#30221a"
              emissive="#d9874e"
              emissiveIntensity={initialStripEmission}
              roughness={0.76}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ShelfDecor() {
  return (
    <>
      <group position={[0.955, -0.546, 0.43]}>
        {[
          [0, 0.092, 0.54, -0.025],
          [0.105, 0.082, 0.47, 0.02],
          [0.205, 0.095, 0.58, 0.075],
        ].map(([x, width, height, tilt], index) => (
          <RoundedBox
            key={x}
            args={[width, height, 0.205]}
            radius={0.009}
            position={[x, (height - 0.58) / 2, 0]}
            rotation-z={tilt}
            castShadow
          >
            <meshStandardMaterial
              color={["#513326", "#293638", "#6b4b2f"][index]}
              roughness={0.82}
            />
          </RoundedBox>
        ))}
      </group>
      <group position={[-1.04, -1.697, 0.44]} rotation-y={-0.08}>
        {[0, 0.064, 0.128].map((y, index) => (
          <RoundedBox
            key={y}
            args={
              [
                [0.34, 0.058, 0.22],
                [0.31, 0.054, 0.2],
                [0.35, 0.058, 0.21],
              ][index] as [number, number, number]
            }
            radius={0.008}
            position={[0, y, 0]}
            rotation-y={index === 1 ? 0.08 : -0.035}
            castShadow
          >
            <meshStandardMaterial
              color={["#3c2b22", "#695039", "#28302d"][index]}
              roughness={0.84}
            />
          </RoundedBox>
        ))}
      </group>
      <group position={[0.98, -1.651, 0.43]} rotation-y={0.055}>
        <RoundedBox args={[0.46, 0.15, 0.28]} radius={0.02} castShadow>
          <meshStandardMaterial color="#4b3020" roughness={0.74} />
        </RoundedBox>
        <mesh position={[0, 0.08, 0.02]}>
          <boxGeometry args={[0.36, 0.012, 0.2]} />
          <meshStandardMaterial color="#715036" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.02, 0.15]}>
          <boxGeometry args={[0.12, 0.025, 0.012]} />
          <meshStandardMaterial color="#34261e" metalness={0.18} />
        </mesh>
      </group>
      <group position={[1.04, 1.034, 0.43]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.09, 0.18, 16]} />
          <meshStandardMaterial color="#6a4b35" roughness={0.86} />
        </mesh>
        {[0, 0.9, 1.8, 2.7].map((angle, index) => (
          <Capsule
            key={angle}
            args={[0.035, 0.25, 5, 8]}
            position={[Math.sin(angle) * 0.075, 0.18 + index * 0.025, Math.cos(angle) * 0.035]}
            rotation={[Math.sin(angle) * 0.52, angle, Math.cos(angle) * 0.32]}
            castShadow
          >
            <meshStandardMaterial color={index % 2 ? "#344332" : "#293a2d"} roughness={0.9} />
          </Capsule>
        ))}
      </group>
    </>
  );
}

export function Shelf({
  illuminated = false,
  onCertificateSelect,
}: {
  illuminated?: boolean;
  onCertificateSelect?: (slug: string) => void;
}) {
  useFeatureSettleLease("certificates-feature", illuminated, "certificate-animation", 1800);
  const workingSet = useDestinationWorkingSet("certificates");
  const thumbnailsResident = isResourceResidentState(workingSet.state);
  const localLightingRelevant = workingSet.state === "preparing" || workingSet.state === "active";
  // Lives here (not in CertificateGallery) so the click hint stays
  // dismissed even if the gallery itself unmounts/remounts as its
  // thumbnails resource is released and reloaded later in the session.
  const [hasSelectedCertificate, setHasSelectedCertificate] = useState(false);
  const handleCertificateSelect = useCallback(
    (slug: string) => {
      setHasSelectedCertificate(true);
      onCertificateSelect?.(slug);
    },
    [onCertificateSelect],
  );
  return (
    <group position={[-3.8, 2, -3.63]}>
      <group position={[0.07, 0, 0.08]} rotation-y={THREE.MathUtils.degToRad(6)}>
        {[1.29, 0.43, -0.43, -1.29].map((y, index) => (
          <RoundedBox
            key={y}
            args={[2.36, 0.69, 0.075]}
            radius={0.018}
            position={[0, y, -0.315]}
            receiveShadow
          >
            <meshStandardMaterial
              color={["#30231d", "#382820", "#2b211c", "#35261e"][index]}
              roughness={0.78 - index * 0.025}
            />
          </RoundedBox>
        ))}
        {[-1.78, -0.89, 0, 0.89, 1.78].map((y, index) => (
          <RoundedBox
            key={y}
            args={[2.62, 0.12, 0.74]}
            radius={0.025}
            position={[0, y, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={index % 2 ? "#3f291b" : "#493020"}
              roughness={0.66 + (index % 2) * 0.06}
            />
          </RoundedBox>
        ))}
        {[-1.27, 1.27].map((x, index) => (
          <RoundedBox
            key={x}
            args={[0.085, 3.62, 0.72]}
            radius={0.025}
            position={[x, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color={index ? "#2d2019" : "#3a281e"} roughness={0.7} />
          </RoundedBox>
        ))}
        {[-1.18, 1.18].map((x) => (
          <mesh key={x} position={[x, -1.91, 0.04]} castShadow>
            <boxGeometry args={[0.14, 0.28, 0.54]} />
            <meshStandardMaterial color="#271b15" roughness={0.76} />
          </mesh>
        ))}
        {[-1.78, -0.89, 0, 0.89, 1.78].map((y) => (
          <mesh key={y} position={[0, y, 0.382]}>
            <boxGeometry args={[2.46, 0.016, 0.018]} />
            <meshStandardMaterial color="#493023" roughness={0.72} />
          </mesh>
        ))}
        {localLightingRelevant && <ShelfPracticalLighting illuminated={illuminated} />}
        <ShelfDecor />
      </group>
      {/* Thumbnails are the ambient shelf artwork. Full-size certificate images
        are rendered by the HTML gallery, not as a second 3D card texture. */}
      {thumbnailsResident ? (
        <CertificateGallery
          illuminated={illuminated}
          onCertificateSelect={handleCertificateSelect}
          hintDismissed={hasSelectedCertificate}
        />
      ) : (
        <CertificatePlaceholders />
      )}
    </group>
  );
}

const WALL_IMAGES = ["arrival.jpg", "her.jpg", "interstellar.jpg", "matrix.jpg"].map((image) =>
  withSceneBasePath(`/wall/${image}`),
);

function PosterImages() {
  const textures = useTexture(WALL_IMAGES);
  textures.forEach((texture, index) => {
    const sourceAspect = index === 0 ? 1920 / 1200 : index === 3 ? 598 / 362 : 728 / 410;
    const frameAspect = 1.18 / 0.67;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (sourceAspect > frameAspect) {
      texture.repeat.set(frameAspect / sourceAspect, 1);
      texture.offset.set((1 - texture.repeat.x) / 2, 0);
    } else {
      texture.repeat.set(1, sourceAspect / frameAspect);
      texture.offset.set(0, (1 - texture.repeat.y) / 2);
    }
  });
  return (
    <>
      {[-2.13, -0.71, 0.71, 2.13].map((x, i) => (
        <mesh key={WALL_IMAGES[i]} position={[x, 0, 0.035]}>
          <planeGeometry args={[1.18, 0.67]} />
          <meshStandardMaterial map={textures[i]} roughness={0.82} toneMapped />
        </mesh>
      ))}
    </>
  );
}

export function Posters() {
  return (
    <group position={[1.7, 3, -3.84]}>
      <group position={[0, 0.67, 0.08]}>
        <RoundedBox args={[0.92, 0.075, 0.12]} radius={0.035} castShadow>
          <meshStandardMaterial color="#343231" metalness={0.28} roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, -0.03, -0.12]}>
          <boxGeometry args={[0.08, 0.08, 0.22]} />
          <meshStandardMaterial color="#292827" metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
      {[-2.13, -0.71, 0.71, 2.13].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.3, 0.79, 0.06]} />
            <meshStandardMaterial color="#151413" roughness={0.72} />
          </mesh>
        </group>
      ))}
      {/* Wall images are part of the room's persistent visual composition. */}
      <Suspense fallback={null}>
        <PosterImages />
      </Suspense>
    </group>
  );
}

export function Plant({
  position,
  rotationY,
}: {
  position: [number, number, number];
  rotationY: number;
}) {
  const stemsRef = useRef<THREE.InstancedMesh>(null);
  const darkLeavesRef = useRef<THREE.InstancedMesh>(null);
  const lightLeavesRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const stemMesh = stemsRef.current,
      darkMesh = darkLeavesRef.current,
      lightMesh = lightLeavesRef.current;
    if (!stemMesh || !darkMesh || !lightMesh) return;
    const dummy = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0),
      start = new THREE.Vector3(),
      bend = new THREE.Vector3(),
      end = new THREE.Vector3(),
      direction = new THREE.Vector3(),
      leafDirection = new THREE.Vector3();
    let stemIndex = 0,
      darkIndex = 0,
      lightIndex = 0;
    ZZ_STEMS.forEach((stem, plantIndex) => {
      start.set(stem.x, 0.325, stem.z);
      bend.set(stem.x + stem.leanX * 0.42, 0.325 + stem.height * 0.5, stem.z + stem.leanZ * 0.42);
      end.set(stem.x + stem.leanX, 0.325 + stem.height, stem.z + stem.leanZ);
      (
        [
          [start, bend],
          [bend, end],
        ] as const
      ).forEach(([from, to]) => {
        direction.subVectors(to, from);
        const length = direction.length();
        dummy.position.copy(from).addScaledVector(direction, 0.5);
        dummy.quaternion.setFromUnitVectors(up, direction.normalize());
        dummy.scale.set(1, length, 1);
        dummy.updateMatrix();
        stemMesh.setMatrixAt(stemIndex++, dummy.matrix);
      });
      [0.4, 0.57, 0.74, 0.91].forEach((t, level) => {
        const leafPosition = new THREE.Vector3().lerpVectors(start, end, t);
        leafPosition.x += Math.sin(Math.PI * t) * stem.leanX * 0.18;
        leafPosition.z += Math.sin(Math.PI * t) * stem.leanZ * 0.18;
        [0, Math.PI].forEach((opposite, side) => {
          const angle = stem.angle + opposite + (level % 2 ? 0.14 : -0.1);
          leafDirection.set(Math.cos(angle), 0.27 + level * 0.045, Math.sin(angle)).normalize();
          dummy.position.copy(leafPosition);
          dummy.quaternion.setFromUnitVectors(up, leafDirection);
          dummy.rotateY((plantIndex - level + side) * 0.055);
          const scale = 0.68 - level * 0.035 + ((plantIndex + side) % 3) * 0.018;
          dummy.scale.set(scale * (side ? 0.96 : 1.03), scale, scale);
          dummy.updateMatrix();
          const target = (plantIndex + level + side) % 2 ? lightMesh : darkMesh;
          if (target === lightMesh) target.setMatrixAt(lightIndex++, dummy.matrix);
          else target.setMatrixAt(darkIndex++, dummy.matrix);
        });
      });
    });
    [stemMesh, darkMesh, lightMesh].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, []);
  return (
    <group position={position} rotation-y={THREE.MathUtils.degToRad(rotationY)} dispose={null}>
      <mesh geometry={ZZ_POT_GEOMETRY} castShadow receiveShadow>
        <primitive object={ZZ_POT_MATERIAL} attach="material" />
      </mesh>
      <mesh position={[0, 0.303, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.205, 16]} />
        <primitive object={ZZ_SOIL_MATERIAL} attach="material" />
      </mesh>
      <instancedMesh
        ref={stemsRef}
        args={[ZZ_STEM_GEOMETRY, ZZ_LEAF_DARK_MATERIAL, 10]}
        castShadow
      />
      <instancedMesh
        ref={darkLeavesRef}
        args={[ZZ_LEAF_GEOMETRY, ZZ_LEAF_DARK_MATERIAL, 20]}
        castShadow
      />
      <instancedMesh
        ref={lightLeavesRef}
        args={[ZZ_LEAF_GEOMETRY, ZZ_LEAF_LIGHT_MATERIAL, 20]}
        castShadow
      />
    </group>
  );
}
