import assert from "node:assert/strict";
import test from "node:test";

import { loadOwnedTextureBatch } from "../src/scene/runtime/working-set/ownedTextureBatch.ts";

function deferred() {
  return Promise.withResolvers();
}

function texture() {
  return {
    disposed: 0,
    dispose() {
      this.disposed++;
    },
  };
}

test("failed batch disposes completed textures and late successes exactly once", async () => {
  const requests = [deferred(), deferred(), deferred()];
  const first = texture();
  const late = texture();
  const batch = loadOwnedTextureBatch(["0", "1", "2"], (url) => requests[Number(url)].promise);
  requests[0].resolve(first);
  await Promise.resolve();
  requests[1].reject(new Error("missing image"));
  await assert.rejects(batch.promise, /missing image/);
  assert.equal(first.disposed, 1);
  requests[2].resolve(late);
  await Promise.resolve();
  assert.equal(late.disposed, 1);
  batch.dispose();
  assert.equal(first.disposed, 1);
  assert.equal(late.disposed, 1);
});

test("unmount cancels ownership before remaining textures finish", async () => {
  const request = deferred();
  const late = texture();
  const batch = loadOwnedTextureBatch(["image"], () => request.promise);
  batch.dispose();
  request.resolve(late);
  await batch.promise;
  assert.equal(late.disposed, 1);
  batch.dispose();
  assert.equal(late.disposed, 1);
});

test("successful textures remain usable until their owner releases them", async () => {
  const resources = [texture(), texture()];
  const batch = loadOwnedTextureBatch(["0", "1"], async (url) => resources[Number(url)]);
  assert.deepEqual(await batch.promise, resources);
  assert.deepEqual(
    resources.map((entry) => entry.disposed),
    [0, 0],
  );
  batch.dispose();
  batch.dispose();
  assert.deepEqual(
    resources.map((entry) => entry.disposed),
    [1, 1],
  );
});
