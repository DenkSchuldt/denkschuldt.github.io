"use client";

import { ContactShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

import { useActiveReality } from "../reality";
import { RENDERING_INTENT, resolveHemisphereIntensity } from "../rendering/renderingIntent";

import type { RenderingQualityProfile, ResolvedQualityFeatures } from "../rendering/quality";

export function Lighting({
  desk,
  sun,
  sunColor,
  bounce,
  fillEnabled = true,
  shadowsEnabled = true,
  profile,
  features,
}: {
  desk: number;
  sun: number;
  sunColor: string;
  bounce: number;
  fillEnabled?: boolean;
  shadowsEnabled?: boolean;
  profile: RenderingQualityProfile;
  features: ResolvedQualityFeatures;
}) {
  const aspect = useThree((state) => state.size.width / state.size.height);
  // Blueprint suppresses the warm practical-light appearance and reduces
  // realistic cast-shadow/AO cues in place here, rather than migrating
  // lighting into a theme system — everything below is byte-identical to
  // the Cinematic values when blueprint is false. Depth is meant to read
  // from the technical edge lines first and this softened lighting second.
  const blueprint = useActiveReality((reality) => reality.id === "blueprint");
  const directionalShadows =
    shadowsEnabled && features.allShadows && features.directionalShadow && !blueprint;
  return (
    <>
      {fillEnabled && (
        <hemisphereLight
          name="hemisphere-fill"
          args={
            blueprint
              ? ["#b8c6db", "#16223a", resolveHemisphereIntensity(bounce, aspect) * 1.6]
              : ["#dde4e6", "#4a3c30", resolveHemisphereIntensity(bounce, aspect)]
          }
        />
      )}
      <directionalLight
        key={`sun-key:${profile.shadows.directionalMapSize}`}
        name="sun-key"
        position={[-5.7, 6.4, 1.6]}
        color={blueprint ? "#cfe0f5" : sunColor}
        intensity={blueprint ? sun * 0.2 : sun}
        castShadow={directionalShadows}
        shadow-mapSize={[profile.shadows.directionalMapSize, profile.shadows.directionalMapSize]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-bias={-0.00018}
        shadow-radius={RENDERING_INTENT.lighting.sunShadowRadius}
      />
      {fillEnabled && !blueprint && (
        <pointLight
          name="desk-fill"
          position={[-1.55, 1.72, -1.05]}
          color="#ff9b50"
          intensity={desk * 0.24}
          distance={2.7}
          decay={2}
        />
      )}
      {shadowsEnabled && features.allShadows && features.contactShadows && !blueprint && (
        <ContactShadows
          key={`${profile.id}:${profile.shadows.contactResolution}`}
          position={[0, 0.012, -0.8]}
          opacity={profile.shadows.contactOpacity}
          resolution={profile.shadows.contactResolution}
          scale={12}
          blur={profile.shadows.contactBlur}
          far={4.5}
        />
      )}
    </>
  );
}
