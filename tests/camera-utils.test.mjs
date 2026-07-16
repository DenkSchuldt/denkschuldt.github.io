import test from "node:test";
import assert from "node:assert/strict";
import { cinematicEase, applyReducedMotionDuration } from "../src/scene/camera/cameraEasing.ts";
import { resolveCameraTarget, getViewportKind } from "../src/scene/camera/cameraTargets.ts";
import { getAdjacentCameraTarget } from "../src/scene/camera/cameraNavigation.ts";

test("cinematic easing preserves exact endpoints", () => {
  assert.equal(cinematicEase(0), 0);
  assert.equal(cinematicEase(1), 1);
  assert.ok(cinematicEase(.25) < .25);
  assert.ok(cinematicEase(.75) > .75);
});

test("responsive target resolution selects mobile framing", () => {
  assert.equal(getViewportKind(.6), "mobile");
  assert.equal(getViewportKind(1.1), "tablet");
  assert.equal(getViewportKind(1.8), "desktop");
  assert.equal(resolveCameraTarget("projects", .6).fov, 45);
});

test("reduced motion shortens long transitions", () => {
  assert.equal(applyReducedMotionDuration(6, true), .45);
  assert.equal(applyReducedMotionDuration(6, false), 6);
});

test("camera navigation resolves adjacent swipe targets", () => {
  assert.equal(getAdjacentCameraTarget("projects", 1), "about");
  assert.equal(getAdjacentCameraTarget("projects", -1), "opening");
  assert.equal(getAdjacentCameraTarget("drawer", 1), null);
  assert.equal(getAdjacentCameraTarget("opening", -1), null);
});
