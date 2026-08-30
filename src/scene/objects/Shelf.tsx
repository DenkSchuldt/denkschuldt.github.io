"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Capsule, RoundedBox, useCursor } from "@react-three/drei";
import * as THREE from "three";

import { useRuntimeSnapshot } from "@denk/cinematic-navigation/react";

import { withSceneBasePath } from "../camera/sceneRoutes";
import { measurePerformanceTask } from "../diagnostics/performance/performanceStore";
import { useRenderDemand } from "../runtime/render-scheduler";
import {
  isResourceResidentState,
  useDestinationWorkingSet,
  useOwnedTextures,
} from "../runtime/working-set";
import { CERTIFICATES, CERTIFICATE_LAYOUT } from "./certificates";
import { useFeatureSettleLease, useMeasuredRuntimeTask } from "./runtimeHooks";

import type { CertificateRecord } from "./certificates";

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
