import assert from "node:assert/strict";
import test from "node:test";

import { createScreenProjection } from "../src/scene/screenProjection.ts";

test("projected overlays can read the last projection and subscribe only while visible", () => {
  const projection = createScreenProjection();
  const value = {
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 200 },
      { x: 0, y: 200 },
    ],
    viewport: { width: 390, height: 844 },
  };
  projection.publish(value);
  assert.equal(projection.current, value);
  let updates = 0;
  const unsubscribe = projection.subscribe(() => {
    updates++;
  });
  projection.publish({ ...value, viewport: { width: 844, height: 390 } });
  assert.equal(updates, 1);
  unsubscribe();
  projection.publish(value);
  assert.equal(updates, 1);
});
