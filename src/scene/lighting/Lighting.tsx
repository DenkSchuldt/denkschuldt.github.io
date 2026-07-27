"use client";

import { ContactShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

import { RENDERING_INTENT, resolveHemisphereIntensity } from "../rendering/renderingIntent";

import type { RenderingQualityProfile, ResolvedQualityFeatures } from "../rendering/quality";

export function Lighting({
  desk,
  moon,
  moonColor,
  bounce,
  fillEnabled = true,
  shadowsEnabled = true,
  profile,
  features,
}: {
  desk: number;
  moon: number;
  moonColor: string;
  bounce: number;
  fillEnabled?: boolean;
  shadowsEnabled?: boolean;
  profile: RenderingQualityProfile;
  features: ResolvedQualityFeatures;
}) {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const directionalShadows = shadowsEnabled && features.allShadows && features.directionalShadow;
  const deskShadows = shadowsEnabled && features.allShadows && features.deskShadow;
  return (
    <>
      {fillEnabled && (
        <hemisphereLight
          name="hemisphere-fill"
          args={["#536173", "#160f0b", resolveHemisphereIntensity(bounce, aspect)]}
        />
      )}
      <directionalLight
        key={`moon-key:${profile.shadows.directionalMapSize}`}
        name="moon-key"
        position={[-5.7, 4.8, 1.2]}
        color={moonColor}
        intensity={moon}
        castShadow={directionalShadows}
        shadow-mapSize={[profile.shadows.directionalMapSize, profile.shadows.directionalMapSize]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-bias={-0.00018}
      />
      <spotLight
        key={`desk-key:${profile.shadows.deskSpotMapSize}`}
        name="desk-key"
        position={[-1.65, 2.95, -0.82]}
        color="#ffad62"
        intensity={desk}
        angle={0.48}
        penumbra={0.92}
        distance={7}
        decay={2}
        castShadow={deskShadows}
        shadow-mapSize={[profile.shadows.deskSpotMapSize, profile.shadows.deskSpotMapSize]}
        shadow-bias={-0.00012}
      />
      {fillEnabled && (
        <pointLight
          name="desk-fill"
          position={[-1.55, 1.72, -1.05]}
          color="#ff9b50"
          intensity={desk * 0.2}
          distance={2.7}
          decay={2}
        />
      )}
      {fillEnabled && (
        <rectAreaLight
          name="wall-bounce"
          position={[0.3, 1.55, -3.55]}
          rotation={[0, 0, 0]}
          color="#b56d3e"
          intensity={bounce}
          width={4.4}
          height={1.6}
        />
      )}
      {fillEnabled && (
        <pointLight
          name="drawer-rim"
          position={[2.3, 0.65, -1.3]}
          color="#9d542f"
          intensity={bounce * RENDERING_INTENT.lighting.drawerRimFactor}
          distance={3.2}
          decay={2}
        />
      )}
      {fillEnabled && (
        <rectAreaLight
          name="upper-warm-fill"
          position={[2.55, 3.7, -3.28]}
          rotation={[0, 0, 0]}
          color="#ffad62"
          intensity={1.35}
          width={5.2}
          height={1.35}
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
