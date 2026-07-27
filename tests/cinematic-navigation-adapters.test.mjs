import test from "node:test";
import assert from "node:assert/strict";
import { Object3D } from "three";
import { createSubjectRegistry } from "../packages/cinematic-navigation/dist/r3f/index.js";
import { addBasename, removeBasename } from "../packages/cinematic-navigation/dist/router/index.js";
import { dispatchNavigationIntent } from "../packages/cinematic-navigation/dist/input/index.js";

test("R3F subjects resolve live handles and clean up safely", () => {
  const registry = createSubjectRegistry(),
    subject = new Object3D();
  const unregister = registry.register("artwork", subject);
  assert.equal(registry.require("artwork"), subject);
  assert.throws(() => registry.register("artwork", new Object3D()), /Duplicate subject ID/);
  unregister();
  assert.equal(registry.resolve("artwork"), null);
  assert.throws(() => registry.require("artwork"), /Missing subject registration/);
});

test("router basename helpers preserve root and nested paths", () => {
  assert.equal(addBasename("/", "/preview"), "/preview/");
  assert.equal(addBasename("/certificates/item", "/preview/"), "/preview/certificates/item");
  assert.equal(removeBasename("/preview/certificates/item", "/preview"), "/certificates/item");
  assert.equal(removeBasename("/about", "/preview"), "/about");
});

test("normalized input dispatches without owning event listeners", () => {
  const calls = [];
  const engine = {
    nextScene: () => calls.push("next"),
    previousScene: () => calls.push("previous"),
    enterFocus: (collection, item) => calls.push(`${collection}:${item}`),
    goToFocus: (item) => calls.push(item),
    exitFocus: () => calls.push("exit"),
    moveFocus: (direction) => calls.push(direction),
    interruptTransition: () => calls.push("interrupt"),
  };
  dispatchNavigationIntent(engine, { type: "NEXT_SCENE" });
  dispatchNavigationIntent(engine, { type: "MOVE_FOCUS", direction: "down" });
  dispatchNavigationIntent(engine, { type: "EXIT_FOCUS" });
  assert.deepEqual(calls, ["next", "down", "exit"]);
});
