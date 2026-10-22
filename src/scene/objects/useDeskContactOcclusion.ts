"use client";

import { useEffect, useState } from "react";

import * as THREE from "three";

import { useActiveReality } from "../reality";
import { useRenderingQuality } from "../rendering/quality";
import { useRenderDemand } from "../runtime/render-scheduler";
import { useWorkingSetStore } from "../runtime/working-set";
import { PHONE_LAYOUT } from "../sceneLayout";

import { createContactOcclusionData, DESK_CONTACT_MAP_SIZE } from "./contactOcclusion";

export function useDeskContactOcclusion(
  paperPosition: [number, number],
  paperRotation: number,
  enabled = true,
) {
  const supported = useRenderingQuality(({ profile }) => profile.id !== "fallback");
  const blueprint = useActiveReality((reality) => reality.id === "blueprint");
  const demand = useRenderDemand("desk-contact-occlusion");
  const store = useWorkingSetStore();
  const [texture, setTexture] = useState<THREE.DataTexture | null>(null);
  const [paperX, paperZ] = paperPosition;
  useEffect(() => {
    if (!supported || blueprint || !enabled) return;
    const data = createContactOcclusionData([
      {
        x: paperX,
        z: paperZ,
        width: 0.72,
        depth: 1.02,
        rotation: paperRotation,
        radius: 0.006,
        softness: 0.018,
        strength: 0.72,
      },
      {
        x: PHONE_LAYOUT.localPosition[0],
        z: PHONE_LAYOUT.localPosition[2],
        width: 0.325,
        depth: 0.65,
        rotation: PHONE_LAYOUT.rotationDegrees,
        radius: 0.07,
        softness: 0.025,
        strength: 0.68,
      },
    ]);
    const owned = new THREE.DataTexture(data, ...DESK_CONTACT_MAP_SIZE, THREE.RedFormat);
    owned.name = "desk-contact-occlusion";
    owned.channel = 1;
    owned.colorSpace = THREE.NoColorSpace;
    owned.minFilter = owned.magFilter = THREE.LinearFilter;
    owned.generateMipmaps = false;
    owned.needsUpdate = true;
    // This effect owns one texture; publishing it never retriggers allocation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTexture(owned);
    store.resourceEvent("prepare-end", "surface:desk:contact", {
      status: "resident",
      cache: "owned",
      detail: "256x128 R8 receiver-space contact AO; no render target",
    });
    demand.invalidate("asset-ready");
    return () => {
      setTexture(null);
      owned.dispose();
      store.resourceEvent("dispose", "surface:desk:contact", {
        status: "released",
        cache: "owned",
        evidence: ["texture-disposed", "references-released", "gpu-memory-unverified"],
      });
    };
  }, [supported, blueprint, enabled, paperX, paperZ, paperRotation, demand, store]);
  return supported && !blueprint && enabled ? texture : null;
}
