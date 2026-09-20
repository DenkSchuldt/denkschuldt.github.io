"use client";

import { useEffect } from "react";

import { ContactShadows } from "@react-three/drei";

import { useRenderDemand, useRenderScheduler } from "../runtime/render-scheduler";

import type { RenderingQualityProfile } from "../rendering/quality";

interface CachedContactShadowsProps {
  profile: RenderingQualityProfile;
}

export function CachedContactShadows({ profile }: CachedContactShadowsProps) {
  const isChanging = useRenderScheduler((state) => state.continuousLeases.length > 0);
  const revision = useRenderScheduler((state) => state.shadowRevision);
  const demand = useRenderDemand("contact-shadows");

  useEffect(() => {
    demand.invalidate("projection-sync");
  }, [demand, isChanging, revision]);

  // Drei resets its frame count on render. Resource revisions refresh the cache;
  // continuous leases keep it live through fades and object animations.
  return (
    <ContactShadows
      frames={isChanging ? Infinity : 1}
      position={[0, 0.012, -0.8]}
      opacity={profile.shadows.contactOpacity}
      resolution={profile.shadows.contactResolution}
      scale={12}
      blur={profile.shadows.contactBlur}
      far={4.5}
    />
  );
}
