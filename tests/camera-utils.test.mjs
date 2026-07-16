import test from "node:test";
import assert from "node:assert/strict";
import { cinematicEase, applyReducedMotionDuration } from "../src/scene/camera/cameraEasing.ts";
import { resolveCameraTarget, getViewportKind } from "../src/scene/camera/cameraTargets.ts";
import { getAdjacentCameraTarget } from "../src/scene/camera/cameraNavigation.ts";
import { SHOT_REGISTRY, resolveShot } from "../src/scene/camera/shotRegistry.ts";
import { parseScenePath, pathForShot } from "../src/scene/camera/sceneRoutes.ts";

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
  assert.deepEqual(resolveCameraTarget("about", .6).position, [-1.897, 3.16, -.578]);
  assert.equal(resolveCameraTarget("about", .6).fov, 46);
  assert.equal(resolveCameraTarget("about", .6).roll, 0);
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

test("shot registry owns routes and preserves the golden About framing", () => {
  assert.equal(SHOT_REGISTRY.drawer.route, null);
  assert.equal(pathForShot("drawer"), null);
  assert.equal(parseScenePath("/projects/atlas").shot, "project-detail");
  assert.equal(parseScenePath("/phone/qr").shot, "phone-qr");
  assert.deepEqual(resolveShot("about", 1.8).framing.position, [-1.8, 3, -.772]);
  assert.equal(resolveShot("about", 1.8).framing.roll, -25);
  assert.deepEqual(resolveShot("about", .6).framing.position, [-1.897, 3.16, -.578]);
  assert.equal(resolveShot("about", .6).framing.roll, 0);
});
