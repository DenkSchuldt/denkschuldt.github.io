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

const engine=createCinematicEngine({
  scenes:[
    {id:"lobby",subjectId:"lobby-model",cameraTargetId:"lobby-wide",framing:{distance:5},transition:{duration:2}},
    {id:"gallery",subjectId:"gallery-model",cameraTargetId:"gallery-wide",framing:{distance:4},transition:{duration:2}},
  ],
  focusCollections:[{
    id:"artworks",sceneId:"gallery",cameraTargetId:"artwork-detail",framing:{distance:1},transition:{duration:1},
    items:[
      {id:"one",subjectId:"artwork-one",cameraTargetId:"artwork-detail",framing:{distance:1},transition:{duration:1},spatial:{x:0,y:0}},
      {id:"two",subjectId:"artwork-two",cameraTargetId:"artwork-detail",framing:{distance:1},transition:{duration:1},spatial:{x:1,y:0}},
    ],
  }],
  guidedSequence:["lobby","gallery"],
});

engine.goToScene("gallery");
engine.enterFocus("artworks","one");
engine.moveFocus("right");
```

The engine emits intent and state; an injected camera driver owns interpolation. Call `updateTransition()` and `completeTransition()` as the driver advances. Redirection is explicit when a new request arrives during an active transition.

## Subject binding

Use `createSubjectRegistry()` from the R3F entry point and register current `Object3D` handles when mounted. Resolve them at navigation time so moving objects or swapping primitives for GLBs does not change navigation code.

## Routing and persistence

Routing is application-owned. Implement `NavigationRouterAdapter` to translate URLs into generic locations and choose push/replace behavior. Basename helpers support subpath deployments. Persistence is injected; explicit route synchronization should occur before calling `restoreLastVisitedScene()` so deep links retain priority.

## Responsive framing and reduced motion

Framing, transition, and responsive types are application-defined generic parameters. The camera driver selects variants and implements reduced-motion interpolation without forcing a renderer or animation library on the core.

## Development

From the repository root, run `npx tsc -p packages/cinematic-navigation/tsconfig.build.json` to generate declaration files. Package consumers should use only documented entry points.
