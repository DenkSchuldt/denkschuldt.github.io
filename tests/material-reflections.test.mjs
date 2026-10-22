import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createRoomReflectionPixels,
  MATERIAL_REFLECTIONS,
  materialReflectionsEnabled,
} from "../src/scene/lighting/materialReflectionPolicy.ts";
import { withReflectionRendererState } from "../src/scene/lighting/withReflectionRendererState.ts";
import { WORKING_SET_DEFINITIONS } from "../src/scene/runtime/working-set/definitions.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("selected material reflections remain desktop-only and respect reality/isolation", () => {
  for (const profile of ["ultra", "high", "balanced"]) {
    assert.equal(materialReflectionsEnabled(profile, false, true), true);
    assert.equal(materialReflectionsEnabled(profile, true, true), false);
    assert.equal(materialReflectionsEnabled(profile, false, false), false);
  }
  for (const profile of ["mobile", "fallback"]) {
    assert.equal(materialReflectionsEnabled(profile, false, true), false);
  }
});

test("the deterministic linear room source and retained atlas have bounded memory", () => {
  const pixels = createRoomReflectionPixels();
  assert.deepEqual(pixels, createRoomReflectionPixels());
  assert.equal(pixels.byteLength, 512 * 1024);
  assert.equal(MATERIAL_REFLECTIONS.width, 256);
  assert.equal(MATERIAL_REFLECTIONS.height, 128);
  assert.equal(MATERIAL_REFLECTIONS.estimatedAtlasBytes, 688128);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    for (let channel = 0; channel < 3; channel++) {
      assert.ok(Number.isFinite(pixels[offset + channel]));
      assert.ok(pixels[offset + channel] >= 0 && pixels[offset + channel] < 3);
    }
    assert.equal(pixels[offset + 3], 1);
  }
  const resource = WORKING_SET_DEFINITIONS.opening.resources.find(
    ({ id }) => id === MATERIAL_REFLECTIONS.resourceId,
  );
  assert.ok(resource);
  assert.equal(resource.estimatedDecodedBytes, MATERIAL_REFLECTIONS.estimatedAtlasBytes);
});

test("reflection capture is one-shot, local to selected materials, and explicitly disposed", () => {
  const provider = source("src/scene/lighting/MaterialReflections.tsx");
  assert.doesNotMatch(
    provider,
    /scene\.environment\s*=|useFrame|requestAnimationFrame|setInterval/,
  );
  assert.match(provider, /source\.dispose\(\)/);
  assert.match(provider, /generator\?\.dispose\(\)/);
  assert.match(provider, /target\?\.dispose\(\)/);
  assert.match(provider, /demand\.invalidate\("asset-ready"\)/);
  assert.match(provider, /requestIdleCallback\(prepare, \{ timeout: 300 \}\)/);
  assert.match(provider, /cancelPreparation\(\)/);
  assert.match(provider, /if \(cancelled\) return/);
  assert.match(provider, /EXT_color_buffer_float/);
  assert.match(provider, /original\.clone\(\)/);
  const laptop = source("src/scene/objects/Laptop.tsx");
  assert.match(laptop, /object=\{materials\.keyboard\}/);
  assert.match(laptop, /object=\{materials\.screen\}/);
  assert.match(laptop, /material\.envMap = null/);
  assert.match(laptop, /material\.dispose\(\)/);
});

test("restored WebGL contexts rebuild only the owned atlas and clean up their listener", () => {
  const provider = source("src/scene/lighting/MaterialReflections.tsx");
  assert.match(
    provider,
    /canvas\.addEventListener\("webglcontextrestored", handleContextRestored\)/,
  );
  assert.match(
    provider,
    /canvas\.removeEventListener\("webglcontextrestored", handleContextRestored\)/,
  );
  assert.match(provider, /setTexture\(null\);\s*setContextVersion\(\(version\) => version \+ 1\)/);
  assert.match(provider, /\[active, contextVersion, demand, gl, workingSet\]/);
  assert.match(provider, /if \(gl\.getContext\(\)\.isContextLost\(\)\) return/);
  assert.doesNotMatch(provider, /preventDefault|forceContextLoss|forceContextRestore/);
});

for (const shouldThrow of [false, true]) {
  test(`PMREM restores the renderer before resource disposal after ${shouldThrow ? "failure" : "success"}`, () => {
    const originalTarget = { name: "main-scene-target" };
    let target = originalTarget;
    let cubeFace = 3;
    let mipmapLevel = 2;
    const order = [];
    const originalXrEnabled = !shouldThrow;
    const originalAutoClear = shouldThrow;
    const renderer = {
      xr: { enabled: originalXrEnabled },
      autoClear: originalAutoClear,
      getRenderTarget: () => target,
      getActiveCubeFace: () => cubeFace,
      getActiveMipmapLevel: () => mipmapLevel,
      setRenderTarget: (nextTarget, nextCubeFace, nextMipmapLevel) => {
        target = nextTarget;
        cubeFace = nextCubeFace;
        mipmapLevel = nextMipmapLevel;
        order.push("restore-target");
      },
    };
    const failure = new Error("Simulated PMREM capture failure");
    const prepare = () => {
      target = { name: "temporary-pmrem-target" };
      cubeFace = 0;
      mipmapLevel = 0;
      renderer.xr.enabled = !originalXrEnabled;
      renderer.autoClear = !originalAutoClear;
      if (shouldThrow) throw failure;
      return "prepared-atlas";
    };
    const captureAndDispose = () => {
      try {
        return withReflectionRendererState(renderer, prepare);
      } finally {
        assert.equal(target, originalTarget);
        assert.equal(cubeFace, 3);
        assert.equal(mipmapLevel, 2);
        assert.equal(renderer.xr.enabled, originalXrEnabled);
        assert.equal(renderer.autoClear, originalAutoClear);
        order.push("dispose-resources");
      }
    };
    if (shouldThrow) assert.throws(captureAndDispose, (error) => error === failure);
    else assert.equal(captureAndDispose(), "prepared-atlas");
    assert.deepEqual(order, ["restore-target", "dispose-resources"]);
    assert.match(
      source("src/scene/lighting/MaterialReflections.tsx"),
      /return withReflectionRendererState\(gl, \(\) => \{/,
    );
  });
}
