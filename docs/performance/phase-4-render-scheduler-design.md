# Phase 4 — Render scheduler design

Scheduling policy is portfolio-owned under
`src/scene/runtime/render-scheduler/`. It does not mutate navigation and the
generic package remains renderer-agnostic.

```mermaid
flowchart TD
  N["Navigation transitions"] --> S["Render Scheduler"]
  W["Working-set lifecycle"] --> S
  F["Visible feature animations"] --> S
  A["Async resource publication"] --> S
  E["Pointer / resize / quality"] --> S
  S --> O["Invalidate once"]
  S --> C["Continuous lease"]
  S --> P["Periodic lease"]
  O --> R["R3F demand frames"]
  C --> R
  P --> R
```

The Canvas uses `frameloop="demand"`. A bridge installs R3F's `invalidate`,
consumes pending invalidations at the frame boundary, and requests the next
frame only while a display-cadence lease exists. Periodic producers share a
coalesced timer; hidden tabs cancel it.

Leases are keyed by `ownerId + typed reason`. Renewing a duplicate increments a
generation; a stale release cannot remove the renewed lease. Owners and
working-set lifecycle IDs can be released idempotently. Bounded leases expire.
Navigation has an additional 15-second safety timeout and development warning.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> OneShot: invalidate(reason)
  OneShot --> Render
  Render --> Idle: no leases
  Idle --> Continuous: acquire display lease
  Continuous --> Render
  Render --> Continuous: lease active
  Continuous --> Idle: final release / expiry
  Idle --> Periodic: acquire cadence
  Periodic --> Render: coalesced timer
  Render --> Periodic: wait
  Periodic --> Idle: release / hidden / unmount
```

Component hooks clean all owned releases on unmount. Visibility restoration,
resize, DPR, effects remount, working-set state and active texture publication
are attributed one-shots. Cancelled texture loads dispose their result and do
not publish an `asset-ready` invalidation.

Idle means no display lease and no pending one-shot. A periodic ambient lease
is reported as periodic, not idle. `framesWhileIdle` identifies frames without
a scheduler reason. Adaptive DPR receives only rendered samples; absence of
idle frames cannot produce an upgrade, and a DPR change clears its sample
window and invalidates once.
