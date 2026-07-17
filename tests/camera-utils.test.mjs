import test from "node:test";
import assert from "node:assert/strict";
import { cinematicEase, applyReducedMotionDuration } from "../src/scene/camera/cameraEasing.ts";
import { resolveCameraTarget, getViewportKind } from "../src/scene/camera/cameraTargets.ts";
import { getAdjacentCameraTarget, getShotOvershoot, isDrawerOpeningReturn, isOpeningAboutJourney, isTrackpadPinchOut, shouldBeginShotTransition, shouldSyncRouteShot } from "../src/scene/camera/cameraNavigation.ts";
import { INTRO_DESTINATION, INTRO_PAN_SHOT, SHOT_REGISTRY, resolveShot } from "../src/scene/camera/shotRegistry.ts";
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
  assert.equal(getAdjacentCameraTarget("opening", 1), "about");
  assert.equal(getAdjacentCameraTarget("about", 1), "certificates");
  assert.equal(getAdjacentCameraTarget("certificates", 1), "projects");
  assert.equal(getAdjacentCameraTarget("projects", -1), "certificates");
  assert.equal(getAdjacentCameraTarget("about", -1), "opening");
  assert.equal(getAdjacentCameraTarget("drawer", 1), "opening");
  assert.equal(getAdjacentCameraTarget("opening", -1), null);
});

test("opening and About share the same reversible camera journey", () => {
  assert.equal(isOpeningAboutJourney("opening", "about"), true);
  assert.equal(isOpeningAboutJourney("about", "opening"), true);
  assert.equal(isOpeningAboutJourney("about", "projects"), false);
});

test("Drawer returns smoothly to Opening without landing overshoot", () => {
  assert.equal(isDrawerOpeningReturn("drawer", "opening"), true);
  assert.equal(isDrawerOpeningReturn("poems", "opening"), false);
  assert.equal(getShotOvershoot("opening", .018), 0);
});

test("the opening presents workspace from the left and lands on About", () => {
  assert.equal(INTRO_DESTINATION, "about");
  assert.equal(INTRO_PAN_SHOT, "workspace");
  assert.ok(resolveShot("opening", 1.8).framing.position[0] < resolveShot("workspace", 1.8).framing.position[0]);
  assert.ok(resolveShot("workspace", 1.8).framing.position[0] < resolveShot("about", 1.8).framing.position[0]);
  assert.equal(getShotOvershoot("about", .018), 0);
  assert.equal(getShotOvershoot("workspace", .018), .018);
});

test("shot registry owns routes and preserves the golden About framing", () => {
  assert.equal(SHOT_REGISTRY.drawer.route, null);
  assert.equal(pathForShot("drawer"), null);
  assert.equal(parseScenePath("/projects/atlas").shot, "project-detail");
  assert.equal(parseScenePath("/phone/qr").shot, "phone-qr");
  assert.deepEqual(resolveShot("about", 1.8).framing.position, [-1.8, 3, -.772]);
  assert.equal(resolveShot("about", 1.8).framing.roll, -25);
  assert.equal(resolveShot("about", 1.8).transition.breathing, undefined);
  assert.deepEqual(resolveShot("about", .6).framing.position, [-1.897, 3.16, -.578]);
  assert.equal(resolveShot("about", .6).framing.roll, 0);
});

test("trackpad pinch-out requires deliberate accumulated movement", () => {
  assert.equal(isTrackpadPinchOut(47), false);
  assert.equal(isTrackpadPinchOut(48), true);
});

test("a new shot request interrupts an active camera journey", () => {
  assert.equal(shouldBeginShotTransition(true, false, "workspace", "about"), true);
  assert.equal(shouldBeginShotTransition(true, false, "about", "about"), false);
  assert.equal(shouldBeginShotTransition(false, false, "workspace", "about"), false);
});

test("the root route does not overwrite the intro destination", () => {
  assert.equal(shouldSyncRouteShot("/", false), false);
  assert.equal(shouldSyncRouteShot("/about", false), true);
  assert.equal(shouldSyncRouteShot("/", true), true);
});
