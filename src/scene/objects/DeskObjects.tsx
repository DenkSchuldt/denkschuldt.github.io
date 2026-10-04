"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Capsule, RoundedBox, useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";

import { withSceneBasePath } from "../camera/sceneRoutes";
import { RENDERING_INTENT } from "../rendering/renderingIntent";
import { useRenderDemand } from "../runtime/render-scheduler";
import {
  isResourceResidentState,
  useDestinationWorkingSet,
  useWorkingSetStore,
} from "../runtime/working-set";
import { PHONE_LAYOUT } from "../sceneLayout";
import { FadingGroup } from "./FadingGroup";
import { PoemsTablet } from "./PoemsTablet";
import { roundedRectangleShape } from "./geometry";
import { useFeatureSettleLease, useMeasuredRuntimeTask } from "./runtimeHooks";

import type { MutableRefObject } from "react";
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
const MUG_CONTACT_LENGTH = 0.72;
const MUG_CONTACT_WIDTH = 0.36;
const MUG_CONTACT_BEHIND_BASE = 0.18;
const MUG_CONTACT_TAIL = 0.3;
const MUG_CONTACT_INNER_RADIUS = 0.12;
const MUG_CONTACT_OUTER_RADIUS = 0.18;
const MUG_CONTACT_COLUMNS = 64;
const MUG_CONTACT_ROWS = 32;
const MUG_CONTACT_YAW = Math.atan2(
  RENDERING_INTENT.lighting.sunPosition[2],
  -RENDERING_INTENT.lighting.sunPosition[0],
);
const MUG_CONTACT_DATA = new Uint8Array(MUG_CONTACT_COLUMNS * MUG_CONTACT_ROWS * 4);
for (let row = 0; row < MUG_CONTACT_ROWS; row++)
  for (let column = 0; column < MUG_CONTACT_COLUMNS; column++) {
    const along =
        ((column + 0.5) / MUG_CONTACT_COLUMNS) * MUG_CONTACT_LENGTH - MUG_CONTACT_BEHIND_BASE,
      across = ((row + 0.5) / MUG_CONTACT_ROWS - 0.5) * MUG_CONTACT_WIDTH,
      nearestOnTail = THREE.MathUtils.clamp(along, 0, MUG_CONTACT_TAIL),
      distance = Math.hypot(along - nearestOnTail, across),
      edge = THREE.MathUtils.smoothstep(
        MUG_CONTACT_OUTER_RADIUS - distance,
        0,
        MUG_CONTACT_OUTER_RADIUS - MUG_CONTACT_INNER_RADIUS,
      ),
      strength = 1 - 0.65 * THREE.MathUtils.clamp(along / MUG_CONTACT_TAIL, 0, 1);
    MUG_CONTACT_DATA.fill(
      Math.round(255 * edge * strength),
      (row * MUG_CONTACT_COLUMNS + column) * 4,
      (row * MUG_CONTACT_COLUMNS + column + 1) * 4,
    );
  }
const MUG_CONTACT_TEXTURE = new THREE.DataTexture(
  MUG_CONTACT_DATA,
  MUG_CONTACT_COLUMNS,
  MUG_CONTACT_ROWS,
  THREE.RGBAFormat,
);
MUG_CONTACT_TEXTURE.minFilter = THREE.LinearFilter;
MUG_CONTACT_TEXTURE.magFilter = THREE.LinearFilter;
MUG_CONTACT_TEXTURE.generateMipmaps = false;
MUG_CONTACT_TEXTURE.needsUpdate = true;
const MUG_CONTACT_GEOMETRY = new THREE.PlaneGeometry(MUG_CONTACT_LENGTH, MUG_CONTACT_WIDTH);
const MUG_CONTACT_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#000000",
  alphaMap: MUG_CONTACT_TEXTURE,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  toneMapped: false,
});
interface DeskObjectsProps {
  coffeePosition: [number, number, number];
  lampPosition: [number, number, number];
  tabletPosition: [number, number];
  tabletRotation: number;
  portraitTablet: boolean;
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
  tabletPosition,
  tabletRotation,
  portraitTablet,
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
  const isCoffeeActive =
    activeScene === "opening" || activeScene === "about" || activeScene === "projects";
  const isPhoneActive = activeScene === "phone";
  const isPoemsActive = activeScene === "poems";
  const isPoemsVisible = activeScene === "opening" || activeScene === "poems";
  const isAboutActive = activeScene === "about";

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

      <FadingGroup id="poems-tablet" visible={isPoemsVisible}>
        <PoemsTablet
          position={tabletPosition}
          rotation={tabletRotation}
          active={isPoemsActive}
          portrait={portraitTablet}
          screenRef={poemsScreenRef}
        />
      </FadingGroup>

      <Coffee position={coffeePosition} active={isCoffeeActive} />

      <DeskLamp position={lampPosition} />
    </group>
  );
}

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

const ME_PHOTO_ASPECT = 2653 / 3538;
const POLAROID_CARD_WIDTH = 0.26;
const POLAROID_CARD_HEIGHT = 0.37;
const POLAROID_PHOTO_MARGIN = 0.016;
const POLAROID_PHOTO_WIDTH = POLAROID_CARD_WIDTH - POLAROID_PHOTO_MARGIN * 2;
const POLAROID_PHOTO_HEIGHT = POLAROID_PHOTO_WIDTH / ME_PHOTO_ASPECT;
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
  const texture = useTexture(withSceneBasePath("/me-polaroid.jpg"));
  const workingSet = useWorkingSetStore();
  useEffect(() => {
    workingSet.resourceEvent("prepare-end", "polaroid-photo", {
      status: "resident",
      cache: "shared-loader",
      detail: "768x1024 shared polaroid texture; original reserved for lightbox",
    });
  }, [texture, workingSet]);
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
      <mesh position={[0, 0.02, -POLAROID_PHOTO_Z_OFFSET]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[POLAROID_PHOTO_WIDTH, POLAROID_PHOTO_HEIGHT]} />
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
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

const MUG_ROTATION_Y = Math.PI + THREE.MathUtils.degToRad(5);

function Coffee({ position, active }: { position: [number, number, number]; active: boolean }) {
  return (
    <group position={position} rotation-y={MUG_ROTATION_Y} dispose={null}>
      <mesh geometry={MUG_BODY_GEOMETRY} position={[0, -0.075, 0]} castShadow receiveShadow>
        <primitive object={MUG_CERAMIC_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={MUG_HANDLE_GEOMETRY} position={[0.135, -0.075, 0]} castShadow>
        <primitive object={MUG_CERAMIC_MATERIAL} attach="material" />
      </mesh>
      <mesh geometry={MUG_COFFEE_GEOMETRY} position={[0, 0.083, 0]} rotation-x={-Math.PI / 2}>
        <primitive object={MUG_COFFEE_MATERIAL} attach="material" />
      </mesh>
      <group position={[0, -0.243, 0]} rotation-y={MUG_CONTACT_YAW - MUG_ROTATION_Y}>
        <mesh
          geometry={MUG_CONTACT_GEOMETRY}
          position-x={MUG_CONTACT_LENGTH / 2 - MUG_CONTACT_BEHIND_BASE}
          rotation-x={-Math.PI / 2}
          renderOrder={1}
        >
          <primitive object={MUG_CONTACT_MATERIAL} attach="material" />
        </mesh>
      </group>
      <CoffeeSteam active={active} />
    </group>
  );
}
