import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  DARK_REGION_LUMINANCE_FLOOR,
  RENDERING_INTENT,
  preservesDarkRegionSeparation,
  resolveHemisphereIntensity,
} from "../src/scene/rendering/renderingIntent.ts";

const luminanceReference = JSON.parse(
  fs.readFileSync(new URL("./fixtures/mobile-dark-region-luminance.json", import.meta.url), "utf8"),
);

test("desktop and mobile preserve the intended renderer and post-processing limits", () => {
  assert.deepEqual(RENDERING_INTENT.renderer, {
    toneMapping: "ACESFilmicToneMapping",
    exposure: 0.82,
    outputColorSpace: "srgb",
    powerPreference: "high-performance",
    antialias: true,
    dpr: [1, 1.6],
  });
  assert.deepEqual(RENDERING_INTENT.shadows, { enabled: true, type: "PCFShadowMap" });
  assert.equal(RENDERING_INTENT.environment.intensity, 0);
  assert.ok(
    RENDERING_INTENT.postProcessing.ambientOcclusionIntensity <=
      RENDERING_INTENT.postProcessing.ambientOcclusionLimit,
  );
  assert.ok(
    RENDERING_INTENT.postProcessing.vignetteDarkness <=
      RENDERING_INTENT.postProcessing.vignetteLimit,
  );
  assert.deepEqual(RENDERING_INTENT.lighting.essentialLights, [
    "sun-key",
    "desk-key",
    "hemisphere-fill",
    "drawer-rim",
  ]);
});

test("responsive fill preserves desktop and lifts mobile dark-surface separation", () => {
  assert.equal(resolveHemisphereIntensity(0.62, 16 / 9), 0.31);
  assert.equal(resolveHemisphereIntensity(0.62, 390 / 720), 1.085);
  assert.ok(resolveHemisphereIntensity(0.62, 390 / 720) > resolveHemisphereIntensity(0.62, 16 / 9));
});

test("representative mobile dark-region luminance no longer falls below the crushed-black floor", () => {
  assert.deepEqual(DARK_REGION_LUMINANCE_FLOOR, { mean: 3.6, maxCrushedRatio: 0.97 });
  assert.equal(preservesDarkRegionSeparation(luminanceReference.before), false);
  assert.equal(preservesDarkRegionSeparation(luminanceReference.after), true);
});
