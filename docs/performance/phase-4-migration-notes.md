# Phase 4 — Migration notes

## Added

- `src/scene/runtime/render-scheduler/{types,renderSchedulerStore,RenderSchedulerProvider,RenderSchedulerBridge,index}.ts(x)`
- `tests/render-scheduler.test.mjs`
- five Phase 4 documents.

## Changed

- `Experience`: scheduler provider/adapter/bridge and demand Canvas.
- `CameraRig`: target-aware 30 fps breathing lease; navigation remains owned by
  the engine/camera settle contract.
- `Scene`: matrix-gated laptop projection, explicit initial/effect
  invalidations and projection metrics.
- `QualityRuntimeBridge`: resize, initial DPR and adaptive DPR invalidations;
  sample reset after DPR change.
- `CinematicEffects`: bounded settle lease and change-only DOF writes.
- `Primitives`: bounded Certificates/Phone/Poems animation leases; destination
  visibility-gated 15 fps steam; CanvasTexture publication invalidation.
- `OwnedTexture`: active publication invalidation and destination-aware
  `initTexture()` request.
- diagnostics: mode, leases, invalidation owner/reason, idle frames,
  projection/DOF counts and JSON export.

No second Canvas/world was added. No navigation package code changed. Phase 3
ownership/disposal evidence is unchanged: `initTexture` does not alter the
distinction between unmount, reference release, dispose and physical memory.

Wall/Phone variants were not generated: current evidence did not establish a
screen-space quality/transfer benefit sufficient to add an asset pipeline.
Unresolved Phase 5 inputs are long-run leak evidence, physical iPad validation,
browser-level upload/shader attribution and destination-aware shader warm-up
that does not compile the persistent world wholesale.
