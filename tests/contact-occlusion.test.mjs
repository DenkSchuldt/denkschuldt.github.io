import assert from "node:assert/strict";
import test from "node:test";

import {
  createContactOcclusionData,
  DESK_CONTACT_EXTENT,
  DESK_CONTACT_MAP_SIZE,
} from "../src/scene/objects/contactOcclusion.ts";
import { resolveSunShadowRadius } from "../src/scene/rendering/renderingIntent.ts";

const sample = (data, x, z) => {
  const column = Math.floor((x / DESK_CONTACT_EXTENT[0] + 0.5) * DESK_CONTACT_MAP_SIZE[0]);
  const row = Math.floor((z / DESK_CONTACT_EXTENT[1] + 0.5) * DESK_CONTACT_MAP_SIZE[1]);
  return data[row * DESK_CONTACT_MAP_SIZE[0] + column];
};
const footprint = {
  x: 0,
  z: 0,
  width: 0.3,
  depth: 0.7,
  rotation: 0,
  radius: 0.04,
  softness: 0.02,
  strength: 0.7,
};

test("contact mask is a bounded single-channel 32 KiB map with neutral uncovered receiver", () => {
  const data = createContactOcclusionData([]);
  assert.equal(data.byteLength, 32768);
  assert.ok(data.every((value) => value === 255));
});

test("contact attenuation has a narrow core and returns to neutral away from an object", () => {
  const data = createContactOcclusionData([footprint]);
  assert.ok(sample(data, 0, 0) < 100);
  assert.ok(sample(data, 0.18, 0) > sample(data, 0.13, 0));
  assert.ok(sample(data, 0.3, 0) >= 254);
  assert.equal(sample(data, 2, 0.9), 255);
});

test("receiver-space contact follows the existing footprint translation and rotation", () => {
  const data = createContactOcclusionData([{ ...footprint, x: 1, rotation: 90 }]);
  assert.ok(sample(data, 1.25, 0) < 100);
  assert.ok(sample(data, 1, 0.25) > 250);
  assert.equal(sample(data, 0, 0), 255);
});

test("PCF footprint retains world-space scale across existing quality map sizes", () => {
  assert.equal(resolveSunShadowRadius(2048), 4);
  assert.equal(resolveSunShadowRadius(1536), 3);
  assert.equal(resolveSunShadowRadius(1024), 2);
  assert.equal(resolveSunShadowRadius(512), 1);
});
