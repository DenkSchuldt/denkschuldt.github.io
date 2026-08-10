"use client";

import { ContactShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

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
  const directionalShadows = shadowsEnabled && features.allShadows && features.directionalShadow;
  return (
    <>
      {fillEnabled && (
        <hemisphereLight
          name="hemisphere-fill"
          args={["#dde4e6", "#4a3c30", resolveHemisphereIntensity(bounce, aspect)]}
        />
      )}
      <directionalLight
        key={`sun-key:${profile.shadows.directionalMapSize}`}
        name="sun-key"
        position={[-5.7, 6.4, 1.6]}
        color={sunColor}
        intensity={sun}
        castShadow={directionalShadows}
        shadow-mapSize={[profile.shadows.directionalMapSize, profile.shadows.directionalMapSize]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-bias={-0.00018}
        shadow-radius={RENDERING_INTENT.lighting.sunShadowRadius}
      />
      {fillEnabled && (
        <pointLight
          name="desk-fill"
          position={[-1.55, 1.72, -1.05]}
          color="#ff9b50"
          intensity={desk * 0.24}
          distance={2.7}
          decay={2}
        />
      )}
      {shadowsEnabled && features.allShadows && features.contactShadows && (
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
