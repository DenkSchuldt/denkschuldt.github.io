"use client";

import { useEffect, useState } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useRenderDemand } from "../render-scheduler";

import { useWorkingSetStore } from "./WorkingSetProvider";
import { loadOwnedTextureBatch } from "./ownedTextureBatch";

import type { ReleaseEvidence } from "./types";

export function useOwnedTexture(url: string, resourceId: string, enabled = true) {
  const store = useWorkingSetStore();
  const gl = useThree((state) => state.gl);
  const renderDemand = useRenderDemand(`texture:${resourceId}`);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!enabled) {
      setTexture(null);
      return;
    }
    let cancelled = false,
      owned: THREE.Texture | null = null;
    store.resourceEvent("prepare-start", resourceId, {
      status: "preparing",
      cache: "owned",
      detail: url,
    });
    new THREE.TextureLoader().load(
      url,
      (loaded) => {
        if (cancelled) {
          loaded.dispose();
          store.resourceEvent("prepare-cancel", resourceId, {
            cache: "owned",
            detail: "late completion disposed",
            evidence: [
              "references-released",
              "texture-disposed",
              "browser-memory-unverified",
              "gpu-memory-unverified",
            ],
          });
          return;
        }
        owned = loaded;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.needsUpdate = true;
        try {
          gl.initTexture(loaded);
        } catch (error) {
          loaded.dispose();
          owned = null;
          store.resourceEvent("error", resourceId, {
            status: "error",
            cache: "owned",
            detail: error instanceof Error ? error.message : String(error),
          });
          return;
        }
        setTexture(loaded);
        store.resourceEvent("prepare-end", resourceId, {
          status: "resident",
          cache: "owned",
          detail: `${url}; decode complete, texture constructed, initTexture requested; first visible sample unverified`,
        });
        renderDemand.invalidate("asset-ready");
      },
      undefined,
      (error) => {
        if (cancelled) return;
        store.resourceEvent("error", resourceId, {
          status: "error",
          cache: "owned",
          detail: error instanceof Error ? error.message : String(error),
        });
      },
    );
    return () => {
      cancelled = true;
      setTexture(null);
      if (!owned) return;
      owned.dispose();
      const evidence: readonly ReleaseEvidence[] = [
        "unmounted",
        "references-released",
        "texture-disposed",
        "browser-memory-unverified",
        "gpu-memory-unverified",
      ];
      store.resourceEvent("dispose", resourceId, {
        status: "released",
        cache: "owned",
        detail: "owned texture dispose() called; browser/GPU reclamation not observable",
        evidence,
      });
      owned = null;
    };
  }, [enabled, gl, renderDemand, resourceId, store, url]);
  return texture;
}

export function useOwnedTextures(urls: readonly string[], resourceId: string, enabled = true) {
  const store = useWorkingSetStore();
  const gl = useThree((state) => state.gl);
  const renderDemand = useRenderDemand(`textures:${resourceId}`);
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const key = urls.join("\u0000");
  useEffect(() => {
    if (!enabled) {
      setTextures([]);
      return;
    }
    let cancelled = false;
    store.resourceEvent("prepare-start", resourceId, {
      status: "preparing",
      cache: "owned",
      detail: "owned texture batch",
    });
    const loader = new THREE.TextureLoader();
    const batch = loadOwnedTextureBatch(key.split("\u0000").filter(Boolean), async (url) => {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    });
    batch.promise
      .then((loaded) => {
        if (cancelled) {
          store.resourceEvent("prepare-cancel", resourceId, {
            cache: "owned",
            detail: "late batch disposed",
            evidence: [
              "references-released",
              "texture-disposed",
              "browser-memory-unverified",
              "gpu-memory-unverified",
            ],
          });
          return;
        }
        loaded.forEach((texture) => gl.initTexture(texture));
        setTextures(loaded);
        store.resourceEvent("prepare-end", resourceId, {
          status: "resident",
          cache: "owned",
          detail: `${loaded.length} texture(s); decode complete, texture constructed, initTexture requested; first visible samples unverified`,
        });
        renderDemand.invalidate("asset-ready");
      })
      .catch((error) => {
        batch.dispose();
        if (!cancelled)
          store.resourceEvent("error", resourceId, {
            status: "error",
            cache: "owned",
            detail: error instanceof Error ? error.message : String(error),
          });
      });
    return () => {
      cancelled = true;
      setTextures([]);
      batch.dispose();
      store.resourceEvent("dispose", resourceId, {
        status: "released",
        cache: "owned",
        detail:
          "batch cancelled and owned textures disposed; actual GPU/browser release unobservable",
        evidence: [
          "unmounted",
          "references-released",
          "texture-disposed",
          "browser-memory-unverified",
          "gpu-memory-unverified",
        ],
      });
    };
  }, [enabled, gl, key, renderDemand, resourceId, store]);
  return textures;
}
