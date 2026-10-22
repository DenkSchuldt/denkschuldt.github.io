import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

import { WORKING_SET_DEFINITIONS } from "../src/scene/runtime/working-set/definitions.ts";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const textures = ["walnut", "floor"];

test("original surface textures stay within small desktop and mobile transfer budgets", () => {
  let colorBytes = 0;
  let totalBytes = 0;
  for (const name of textures) {
    for (const channel of ["color", "surface"]) {
      const path = new URL(`../public/materials/${name}-${channel}.webp`, import.meta.url);
      const header = readFileSync(path);
      assert.equal(header.toString("ascii", 0, 4), "RIFF");
      assert.equal(header.toString("ascii", 8, 12), "WEBP");
      const bytes = statSync(path).size;
      totalBytes += bytes;
      if (channel === "color") colorBytes += bytes;
    }
  }
  assert.ok(colorBytes < 24 * 1024, `Mobile color maps: ${colorBytes} bytes`);
  assert.ok(totalBytes < 128 * 1024, `All surface maps: ${totalBytes} bytes`);
});

test("surface textures have persistent world inventory and mipmapped memory estimates", () => {
  for (const name of textures) {
    for (const channel of ["color", "detail"]) {
      const resource = WORKING_SET_DEFINITIONS.opening.resources.find(
        ({ id }) => id === `surface:${name}:${channel}`,
      );
      assert.ok(resource);
      assert.equal(resource.shared, true);
      assert.equal(resource.estimatedDecodedBytes, Math.round((512 * 512 * 4 * 4) / 3));
    }
  }
});

test("async texture arrivals and quality downgrades recreate material shader variants", () => {
  assert.match(
    source("src/scene/objects/Desk.tsx"),
    /key=\{`walnut:\$\{Boolean\(map\)\}:\$\{Boolean\(surface\)\}:\$\{Boolean\(contact\)\}`\}/,
  );
  assert.match(
    source("src/scene/objects/Room.tsx"),
    /key=\{`floor:\$\{Boolean\(floorMap\)\}:\$\{Boolean\(floorSurface\)\}`\}/,
  );
  const hooks = source("src/scene/objects/surfaceTextures.ts");
  assert.match(hooks, /profile\.id !== "mobile" && profile\.id !== "fallback"/);
  assert.match(hooks, /THREE\.SRGBColorSpace : THREE\.NoColorSpace/);
  assert.doesNotMatch(hooks, /useFrame|requestAnimationFrame|setInterval/);
});
