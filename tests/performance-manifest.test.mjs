import assert from "node:assert/strict";
import test from "node:test";

import { performanceManifest } from "../scripts/performance-manifest.ts";

test("3D budget follows static dependencies, deduplicates cycles and includes deferred effects", () => {
  const chunk = (fileName, facadeModuleId, imports = [], dynamicImports = []) => ({
    type: "chunk",
    fileName,
    facadeModuleId,
    imports,
    dynamicImports,
  });
  const bundle = {
    "shell.js": chunk("shell.js", "/repo/app/SceneShell.tsx", ["framework.js"], ["experience.js"]),
    "experience.js": chunk(
      "experience.js",
      "/repo/src/scene/Experience.tsx",
      ["three.js", "framework.js"],
      ["analytics.js"],
    ),
    "effects.js": chunk("effects.js", "/repo/src/scene/effects/CinematicEffects.tsx", ["three.js"]),
    "three.js": chunk("three.js", null, ["framework.js"]),
    "framework.js": chunk("framework.js", null, ["three.js"]),
    "analytics.js": chunk("analytics.js", null),
  };
  const output = [];
  const context = {
    environment: { name: "client" },
    emitFile: (asset) => output.push(asset),
    error: (message) => {
      throw new Error(message);
    },
  };
  performanceManifest().generateBundle.call(context, {}, bundle);
  assert.deepEqual(JSON.parse(output[0].source).sceneJavaScript, [
    "effects.js",
    "experience.js",
    "framework.js",
    "shell.js",
    "three.js",
  ]);
  delete bundle["effects.js"];
  assert.throws(
    () => performanceManifest().generateBundle.call(context, {}, bundle),
    /Missing 3D performance entry/,
  );
});
