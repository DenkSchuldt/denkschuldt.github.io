# Cinematic navigation architecture

The navigation engine treats the room as the interface and keeps five responsibilities separate:

1. **Scene** — a place in the guided room journey. Scenes own base framing, responsive composition, transition intent, route, and an optional Focus Collection.
2. **Focus Collection** — the inspectable subjects that belong to one Scene.
3. **Focus Item** — a registered subject, its framing, route, metadata, and spatial neighbors. A Focus Item never enters the global guided sequence.
4. **Route** — a serialized Scene/Focus location. Route parsing restores deep links and browser history; navigation commands commit their corresponding route.
5. **Camera** — a presentation adapter. It receives resolved targets from the navigation engine and owns animation only.

## Package and application boundaries

The framework-free state engine lives in `packages/cinematic-navigation`. The portfolio consumes it through `portfolioEngine.ts`; all concrete IDs, URLs, framing values and content remain in this directory. The package exposes separate `react`, `r3f`, `input`, `router`, `persistence`, and `testing` entry points so consumers only load the integration they need.

## Sources of truth

- `sceneRegistry.ts` registers Scenes, Focus Collections, Focus Items, and guided order.
- `navigationTypes.ts` defines the domain model and runtime snapshot.
- `sceneRoutes.ts` translates between URLs and navigation locations.
- `portfolioEngine.ts` registers portfolio content with the reusable engine.
- `useCinematicCamera.ts` is the application compatibility hook exposing `goToScene`, `enterFocus`, `exitFocus`, `nextScene`, `previousScene`, `nextFocus`, `previousFocus`, `focusNeighbor`, and `resumeLastVisitedScene`.
- `shotRegistry.ts` is a compatibility adapter for the camera animation layer. Application code should use Scene/Focus commands instead of Shot IDs.

## Runtime lifecycle

The reusable package also exposes `createCinematicRuntime`. It subscribes to the navigation engine and derives lifecycle state for the persistent world, Scenes, Focus Collections, and Focus Items without introducing a second navigation model. `RuntimeFrameBridge` owns the single scheduler tick in R3F; scene-specific work registers tasks against a runtime node and therefore stops when that node sleeps. The portfolio declares its world, scene, collection, and focused-item nodes in `Experience.tsx` and keeps navigation, routes, camera transitions, and persistence in the existing engine.

## Adding content

1. Register a Scene in `SCENE_REGISTRY`.
2. Optionally register its Focus Collection in `FOCUS_COLLECTIONS`.
3. Register Focus Items with stable subject IDs, routes, framing, and spatial neighbors.

Scene objects emit subject IDs or Focus slugs. They do not send camera coordinates or mutate camera transforms.
