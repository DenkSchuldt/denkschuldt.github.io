# Cinematic Navigation

Headless scene and focus navigation for cinematic React Three Fiber experiences. The package is internal today, but its entry points and dependency boundaries are designed for eventual publication.

## Entry points

- `@denk/cinematic-navigation` or `/core` — framework-free engine and contracts.
- `@denk/cinematic-navigation/react` — provider and selector subscriptions.
- `@denk/cinematic-navigation/r3f` — live `Object3D` subject registration.
- `@denk/cinematic-navigation/router` — optional routing contract and basename helpers.
- `@denk/cinematic-navigation/persistence` — optional storage adapters.
- `@denk/cinematic-navigation/testing` — small state/test helpers.

Only the R3F entry point imports Three.js. Only the React entry point imports React. The core imports neither browser globals nor application code.

## Generic example

```ts
import { createCinematicEngine } from "@denk/cinematic-navigation";

const engine = createCinematicEngine({
  scenes: [
    {
      id: "lobby",
      subjectId: "lobby-model",
      cameraTargetId: "lobby-wide",
      framing: { distance: 5 },
      transition: { duration: 2 },
    },
    {
      id: "gallery",
      subjectId: "gallery-model",
      cameraTargetId: "gallery-wide",
      framing: { distance: 4 },
      transition: { duration: 2 },
    },
  ],
  focusCollections: [
    {
      id: "artworks",
      sceneId: "gallery",
      cameraTargetId: "artwork-detail",
      framing: { distance: 1 },
      transition: { duration: 1 },
      items: [
        {
          id: "one",
          subjectId: "artwork-one",
          cameraTargetId: "artwork-detail",
          framing: { distance: 1 },
          transition: { duration: 1 },
          spatial: { x: 0, y: 0 },
        },
        {
          id: "two",
          subjectId: "artwork-two",
          cameraTargetId: "artwork-detail",
          framing: { distance: 1 },
          transition: { duration: 1 },
          spatial: { x: 1, y: 0 },
        },
      ],
    },
  ],
  guidedSequence: ["lobby", "gallery"],
});

engine.goToScene("gallery");
engine.enterFocus("artworks", "one");
engine.moveFocus("right");
```

Collections can set `reframeOnFocus:false` when their items are content states
inside one stable shot (for example, pages in an overhead notebook). Entering
or moving between those items updates the route and focus state without asking
the camera driver to reframe. The default remains `true`, which is appropriate
for collections such as certificates where each item is a separate inspection
shot.

Collection close/ESC behavior is configured with `exitBehavior`. The default
`"parent"` exits to the collection's parent Scene; use `"start"` when closing
the collection should return to the first Scene in `guidedSequence`. The latter
is useful for collections that should take the visitor completely out of their
focused experience.

The engine emits intent and state; an injected camera driver owns interpolation. Call `updateTransition()` and `completeTransition()` as the driver advances. Redirection is explicit when a new request arrives during an active transition.

Presentation layers that must wait for the physical camera can subscribe with `engine.onSceneFocused(listener)`. The callback runs after `completeTransition()` commits the settled location and replays the latest settled location when a subscriber registers after the camera has initialized.

## Runtime lifecycle

`createCinematicRuntime(engine)` consumes the engine's state and derives lifecycle phases for persistent world nodes, Scenes, Focus Collections, and Focus Items. It does not create a second navigation model. Register update work with the runtime scheduler so sleeping nodes stop receiving frame callbacks:

```ts
const runtime = createCinematicRuntime(engine);
runtime.registerNode({
  id: "collection:art",
  scope: "collection",
  sceneId: "gallery",
  collectionId: "art",
});
runtime.registerTask({
  id: "art-light",
  nodeId: "collection:art",
  update: ({ delta }) => updateLight(delta),
});
runtime.subscribeNode("collection:art", (next, previous) => {
  // The consumer owns resource loading/releasing; the engine only reports lifecycle.
  if (next?.phase !== previous?.phase) console.debug(next?.phase);
});
```

The React entry point provides `CinematicRuntimeProvider`, `useRuntimeNode`,
`useRuntimeNodeLifecycle`, `useRuntimeTask`, and `RuntimeBoundary`. The R3F
entry point provides `RuntimeFrameBridge`, which is the single render-loop
bridge for scheduler work. Persistent nodes remain mounted; lazy nodes can be
disposed while sleeping and remounted when their Scene or Focus becomes
relevant. Runtime subscribers are notified when lifecycle state changes, not
for every camera interpolation sample.

Scenes may declare `revisitTransition` for a different revisit cadence and `returnTransition` for an explicit return from that Scene. The engine tracks completed Scene visits in memory, while `resolveSceneTransition(sceneId)` resolves the base, revisit, or return variant. Visit history intentionally resets when the engine is recreated.

## Subject binding

Use `createSubjectRegistry()` from the R3F entry point and register current `Object3D` handles when mounted. Resolve them at navigation time so moving objects or swapping primitives for GLBs does not change navigation code.

## Routing and persistence

Routing is application-owned. Implement `NavigationRouterAdapter` to translate URLs into generic locations and choose push/replace behavior. Basename helpers support subpath deployments. Persistence is injected; explicit route synchronization should occur before calling `restoreLastVisitedScene()` so deep links retain priority.

## Responsive framing and reduced motion

Framing, transition, and responsive types are application-defined generic parameters. The camera driver selects variants and implements reduced-motion interpolation without forcing a renderer or animation library on the core.

## Development

From the repository root, run `npx tsc -p packages/cinematic-navigation/tsconfig.build.json` to generate declaration files. Package consumers should use only documented entry points.
