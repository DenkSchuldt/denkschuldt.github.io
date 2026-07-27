# Phase 4 — Validation results

## Environment

- 2026-07-24, Chromium/macOS Apple M4, local development server.
- Balanced diagnostic profile, 1280×720 CSS, DPR 1.25.
- Production export: 56 routes.
- Performance budget: 267.9 KiB initial JS; 483.2 KiB certificate thumbnails.
- 92 deterministic tests passed, including 9 scheduler tests.

## Short scheduler windows

These 3.5-second direct-entry windows include initial publication and bounded
settle work. They are not 30-second true-idle samples.

| Destination  | Frames | Continuous / periodic leases at capture | Unexplained idle frames | Projection / DOF updates |
| ------------ | -----: | --------------------------------------: | ----------------------: | -----------------------: |
| About        |     76 |                    0 / 1 (steam 15 fps) |                       3 |                    1 / 0 |
| Certificates |    186 |                0 / 1 (breathing 30 fps) |                       2 |                  132 / 0 |
| Phone        |    189 |                0 / 1 (breathing 30 fps) |                       2 |                   96 / 0 |
| Poems        |    186 |                0 / 1 (breathing 30 fps) |                       2 |                   50 / 0 |

The previous `always` About observation executed about 543 projection/steam
updates in an exploratory window. The new short About window performed one
projection calculation and 76 rendered frames including startup. The largest
demonstrated idle-work reduction is projection 543 exploratory executions to
one in this short stable direct entry; differing window lengths prevent a
percentage claim.

Navigation, Phone texture, Poems preview and Safari poem text were visually
checked. Existing tests preserve Opening, Wall pass-through, Escape, Resume,
focus URLs and fixed Poems framing. Continuous settle leases were released at
capture; only declared periodic ambient motion remained.

Texture preparation now records decode/construction and `initTexture` request.
Actual upload completion, shader timing, warm-up hits/misses/waste and
first-arrival longest-frame improvements were not established by three
controlled runs.

Five-minute idle, three journeys, fifteen-minute stress, resize/orientation
cycles, Spector, process CPU/GPU, forced GC and physical iPad were unavailable.
No long-run absence-of-growth claim is made.
