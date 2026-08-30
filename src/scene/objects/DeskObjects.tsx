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

import { withSceneBasePath } from "../camera/sceneRoutes";
import { useRenderDemand } from "../runtime/render-scheduler";
import {
  isResourceResidentState,
  useDestinationWorkingSet,
  useOwnedTexture,
} from "../runtime/working-set";
import { PHONE_LAYOUT } from "../sceneLayout";
import { FadingGroup } from "./FadingGroup";
import { roundedRectangleShape } from "./geometry";
import { useFeatureSettleLease, useMeasuredRuntimeTask } from "./runtimeHooks";

import type { MutableRefObject, RefObject } from "react";
import type { SceneId } from "../camera/navigationTypes";

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
const IPHONE_BODY_GEOMETRY = new THREE.ExtrudeGeometry(roundedRectangleShape(0.325, 0.65, 0.07), {
  depth: 0.026,
  steps: 1,
  curveSegments: 16,
  bevelEnabled: true,
  bevelSegments: 1,
  bevelSize: 0.004,
  bevelThickness: 0.004,
});
IPHONE_BODY_GEOMETRY.center();
IPHONE_BODY_GEOMETRY.rotateX(-Math.PI / 2);
IPHONE_BODY_GEOMETRY.computeVertexNormals();
const IPHONE_SCREEN_CORNER_RADIUS = 0.06;
const IPHONE_SCREEN_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(0.299, 0.618, IPHONE_SCREEN_CORNER_RADIUS),
  16,
);
IPHONE_SCREEN_GEOMETRY.rotateX(-Math.PI / 2);
// Same rounded footprint as IPHONE_SCREEN_GEOMETRY above (not a plain
// rectangle) — the DOM overlay's clip-path (denkos-lockscreen-shell in
// globals.css) only rounds its own *content*, so if this backing mesh were a
// sharp-cornered rectangle, its exposed corners would show through as solid
// black wedges wherever the overlay's rounded clip cuts them away.
// PHONE_SCREEN_CORNERS/PlanarProjection (Scene.tsx) still use this shape's
// full bounding-box corners for the homography source quad — the rounding
// only removes area, it doesn't move the corners the transform is solved
// against.
// Rotation is applied via the mesh's own rotation-x prop below (not baked
// into the geometry, unlike IPHONE_SCREEN_GEOMETRY above) so its corners
// stay in the flat XY-plane — the convention PHONE_SCREEN_CORNERS in
// Scene.tsx expects, matching PortfolioPoemPreview's screenRef mesh.
const IPHONE_SCREEN_GLASS_GEOMETRY = new THREE.ShapeGeometry(
  roundedRectangleShape(0.299, 0.618, IPHONE_SCREEN_CORNER_RADIUS),
  16,
);
const IPHONE_BACK_GEOMETRY = new THREE.ShapeGeometry(roundedRectangleShape(0.305, 0.63, 0.062), 16);
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
    curveSegments: 20,
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
  20,
);
PORTFOLIO_LINING_GEOMETRY.rotateX(-Math.PI / 2);
const PORTFOLIO_POCKET_GEOMETRY = new THREE.ExtrudeGeometry(
  roundedRectangleShape(0.68, 0.5, 0.04),
  {
    depth: 0.014,
    steps: 1,
    curveSegments: 20,
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
  curveSegments: 20,
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
  phoneScreenRef?: MutableRefObject<THREE.Mesh | null>;
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
  phoneScreenRef,
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
  const isPoemsVisible = activeScene === "opening" || activeScene === "poems";
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

      <Phone active={isPhoneActive} screenRef={phoneScreenRef} />

      <FadingGroup id="poems-portfolio" visible={isPoemsVisible}>
        <PoemsPortfolio
          position={folderPosition}
          rotation={folderRotation}
          active={isPoemsActive}
          screenRef={poemsScreenRef}
        />
      </FadingGroup>

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

// The QR/WhatsApp screen image used to be a baked texture on this mesh. The
// denkOS lock screen is rendered entirely as DOM (see PhoneOverlay,
// homography-projected via screenRef/PlanarProjection in Scene.tsx) for
// crisp text — same reasoning as PortfolioPoemPreview above. This mesh is
// just the screen's inert glass backdrop underneath that overlay.
function PhoneScreen({ screenRef }: { screenRef?: MutableRefObject<THREE.Mesh | null> }) {
  return (
    <mesh
      ref={screenRef}
      geometry={IPHONE_SCREEN_GLASS_GEOMETRY}
      position={[0, 0.0182, 0]}
      rotation-x={-Math.PI / 2}
    >
      <primitive object={IPHONE_GLASS_MATERIAL} attach="material" />
    </mesh>
  );
}

function Phone({
  active,
  screenRef,
}: {
  active: boolean;
  screenRef?: MutableRefObject<THREE.Mesh | null>;
}) {
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
      {screenResident && <PhoneScreen screenRef={screenRef} />}
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
