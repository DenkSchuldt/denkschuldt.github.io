# Runtime architecture and resource policy

This document records the boundary between the reusable cinematic navigation
engine and the portfolio application. It is intentionally written before the
runtime changes so future scene work has a clear ownership rule.

## Boundary

```text
Portfolio application
  ├─ scene/content registry (poems, certificates, phone, wall, models)
  ├─ R3F resource boundaries (mount/unmount, textures, materials, particles)
  ├─ camera driver and renderer policy
  └─ lifecycle consumers (lights, previews, steam, screen updates)
              │ generic registrations, state and lifecycle events
              ▼
Reusable cinematic-navigation engine
  ├─ Scene → Focus Collection → Focus Item graph
  ├─ navigation requests and transition state
  ├─ lifecycle phases and mount policy
  ├─ generic update scheduler
  └─ subscriptions for runtime/node changes
              │
              ├─ React provider/selectors
              └─ R3F frame bridge/subject registry
```

The engine answers only which generic runtime nodes are preparing,
transitioning, active, sleeping or disposed. It does not know what a node
contains. The portfolio decides whether a node contains a texture, model,
particle system, light, markdown document or other resource.

## Ownership audit

| Resource                                            | Owner                   | Current policy              | Target policy                                               | Cost rationale                                                                                                        |
| --------------------------------------------------- | ----------------------- | --------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Room, desk, chair and shared architectural geometry | Portfolio               | Persistent                  | Persistent                                                  | Always visible; shared geometry is cheaper than repeated mount work.                                                  |
| Wall poster frames                                  | Portfolio               | Persistent                  | Persistent shell                                            | Frames remain present in every scene.                                                                                 |
| Wall poster textures                                | Portfolio               | Eager                       | Persistent ambient resource                                 | The wall is part of the room composition; removing the images creates empty frames. The set is small (about 208 KiB). |
| Certificate shelf geometry/decor                    | Portfolio               | Persistent                  | Persistent shell                                            | The shelf is part of the room composition.                                                                            |
| Certificate thumbnails                              | Portfolio               | Eager                       | Persistent ambient resource                                 | Thumbnails keep the shelf visually populated; the complete set is small (about 508 KiB).                              |
| Full certificate texture                            | Portfolio               | Focus-gated                 | Focus-gated and disposed on unmount                         | Only the selected item needs the full-resolution image.                                                               |
| Phone screen texture/light                          | Portfolio               | Screen state gated          | Collection-mounted and task-gated                           | The screen is useful only in the phone scene.                                                                         |
| Poems markdown/preview texture                      | Portfolio               | Content already scene-gated | Keep lazy and replace on active slug                        | Markdown and canvas textures are content resources, never engine concerns.                                            |
| Coffee steam                                        | Portfolio               | World task                  | Persistent, low-cost task                                   | Three sprites are negligible and provide continuity between scenes.                                                   |
| Post-processing composer                            | Portfolio               | Renderer-owned              | Persistent while renderer is stable; dispose on replacement | Composer targets are renderer resources and are already explicitly disposed.                                          |
| Camera interpolation                                | Portfolio camera driver | Frame-driven                | Persistent                                                  | It is presentation policy, not navigation state.                                                                      |

CPU/GPU/memory estimates are relative: geometry and steam are low; the
certificate and poster texture sets are the dominant memory consumers; the
composer and shadow targets are renderer-wide and therefore remain outside
individual content boundaries.

## Findings and violations

The core package is already free of portfolio IDs, URLs, images, materials,
lights and Three.js imports. Its `Scene`, `FocusCollection`, `FocusItem`,
transition and scheduler contracts are reusable.

The main violations were in the portfolio consumer rather than the engine:

1. Every declared portfolio node used `persistent`, so lifecycle state did not
   prevent expensive collection textures from mounting.
2. `RuntimeBoundary` was available but not used around the truly ephemeral
   resources; the scene rendered phone screen and inspection work together
   with the ambient room composition.
3. Inline task objects caused register/unregister churn whenever a component
   rendered. The React adapter now keeps task identity stable while accepting
   the latest callback.
4. Runtime subscribers were notified for every camera interpolation sample,
   even when no lifecycle state changed. Runtime notifications are now
   lifecycle-aware; the scheduler still runs every frame for active tasks.

These are application integration issues. Adding certificate or poem names to
the engine would violate the reusable boundary and is deliberately avoided.

## Migration plan

1. Keep the existing navigation hierarchy and camera behavior unchanged.
2. Make runtime registration support shared declarations and add generic
   per-node lifecycle subscriptions.
3. Make React task registration stable and keep hidden diagnostics unsubscribed.
4. Mark portfolio Scene/Collection declarations lazy where a boundary consumes
   them, while preserving persistent room shells.
5. Keep ambient thumbnails and wall images mounted because they contribute to
   the room composition; mount only the phone screen and full-resolution
   certificate inspection resource through portfolio `RuntimeBoundary`
   components.
6. Keep application-specific cleanup in the application. The engine only
   reports lifecycle and schedules callbacks.
7. Run package type-checking, the site build and the complete regression suite.

The result preserves the existing routes, focus behavior, camera framing and
visual composition while reducing the active resource working set.
