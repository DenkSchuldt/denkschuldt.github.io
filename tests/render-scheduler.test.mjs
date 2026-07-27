import assert from "node:assert/strict";
import test from "node:test";
import { RenderSchedulerStore } from "../src/scene/runtime/render-scheduler/renderSchedulerStore.ts";

test("one-shot invalidation is attributed and consumed by one frame", () => {
  const store = new RenderSchedulerStore();
  let requested = 0;
  store.setInvalidator(() => requested++);
  store.invalidate("texture:phone", "asset-ready");
  assert.equal(requested, 1);
  assert.equal(store.getSnapshot().lastInvalidationOwner, "texture:phone");
  assert.equal(store.getSnapshot().pendingInvalidations, 1);
  store.frame(10);
  assert.equal(store.getSnapshot().pendingInvalidations, 0);
  store.dispose();
});

test("first continuous lease activates rendering and final release returns idle", () => {
  const store = new RenderSchedulerStore();
  const release = store.acquireContinuous(
    { ownerId: "camera", reason: "navigation-transition" },
    0,
  );
  assert.equal(store.getSnapshot().mode, "continuous");
  release();
  assert.equal(store.getSnapshot().mode, "one-shot");
  store.frame(1);
  assert.equal(store.getSnapshot().mode, "idle");
  store.dispose();
});

test("duplicate owner and reason leases are deduplicated", () => {
  const store = new RenderSchedulerStore();
  const stale = store.acquireContinuous({ ownerId: "camera", reason: "camera-breathing" }, 0);
  const current = store.acquireContinuous({ ownerId: "camera", reason: "camera-breathing" }, 1);
  assert.equal(store.getSnapshot().continuousLeases.length, 1);
  stale();
  assert.equal(store.getSnapshot().continuousLeases.length, 1);
  current();
  assert.equal(store.getSnapshot().continuousLeases.length, 0);
  store.dispose();
});

test("stale expiry cannot release a renewed lease", () => {
  const store = new RenderSchedulerStore();
  store.acquireContinuous(
    { ownerId: "navigation", reason: "navigation-transition", expiresAt: 5 },
    0,
  );
  store.acquireContinuous(
    { ownerId: "navigation", reason: "navigation-transition", expiresAt: 50 },
    2,
  );
  store.expire(6);
  assert.equal(store.getSnapshot().continuousLeases.length, 1);
  store.expire(51);
  assert.equal(store.getSnapshot().continuousLeases.length, 0);
  store.dispose();
});

test("owner and lifecycle cleanup release leases idempotently", () => {
  const store = new RenderSchedulerStore();
  store.acquireContinuous(
    { ownerId: "phone", reason: "phone-screen", lifecycleId: "scene:phone" },
    0,
  );
  store.releaseLifecycle("scene:phone");
  store.releaseOwner("phone");
  assert.equal(store.getSnapshot().continuousLeases.length, 0);
  store.dispose();
});

test("hidden documents ignore invalidations and restore with one refresh", () => {
  const store = new RenderSchedulerStore();
  let requested = 0;
  store.setInvalidator(() => requested++);
  store.setVisible(false);
  store.invalidate("resize", "resize");
  assert.equal(requested, 0);
  store.setVisible(true);
  assert.equal(requested, 1);
  assert.equal(store.getSnapshot().lastInvalidationReason, "visibility-restored");
  store.dispose();
});

test("projection and DOF diagnostics count real executions", () => {
  const store = new RenderSchedulerStore();
  store.recordProjection();
  store.recordProjection();
  store.recordDof();
  assert.equal(store.getSnapshot().projectionUpdates, 2);
  assert.equal(store.getSnapshot().dofUpdates, 1);
  store.dispose();
});

test("bounded feature lease expires without releasing a renewal", () => {
  const store = new RenderSchedulerStore();
  store.acquireFor({ ownerId: "poems", reason: "poems-preview" }, 100, 0);
  store.expire(99);
  assert.equal(store.getSnapshot().continuousLeases.length, 1);
  store.acquireFor({ ownerId: "poems", reason: "poems-preview" }, 100, 90);
  store.expire(101);
  assert.equal(store.getSnapshot().continuousLeases.length, 1);
  store.expire(191);
  assert.equal(store.getSnapshot().continuousLeases.length, 0);
  store.dispose();
});

test("scheduler has no navigation mutation surface", () => {
  const store = new RenderSchedulerStore();
  assert.equal("goToScene" in store, false);
  assert.equal("enterFocus" in store, false);
  store.dispose();
});
