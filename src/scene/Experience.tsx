"use client";

import { lazy, Profiler, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Canvas } from "@react-three/fiber";
import mixpanel from "mixpanel-browser";
import * as THREE from "three";

import {
  CinematicRuntimeProvider,
  RuntimeInspector,
  useCinematicRuntimeController,
} from "@denk/cinematic-navigation/react";

import { shouldSyncRouteShot } from "./camera/cameraNavigation";
import { CinematicFade } from "./camera/CinematicFade";
import { NavigationDebugPanel } from "./camera/NavigationDebugPanel";
import { SceneNavigation } from "./camera/SceneNavigation";
import { pathForFocus, pathForScene } from "./camera/sceneRoutes";
import {
  FOCUS_COLLECTIONS,
  getFocusItem,
  GUIDED_SCENE_IDS,
  locationForScene,
  SCENE_REGISTRY,
} from "./camera/sceneRegistry";
import {
  useAutoSceneNavigation,
  useCameraKeyboardNavigation,
  useCameraPinchNavigation,
  useCameraTapNavigation,
  useCinematicNavigation,
} from "./camera/useCinematicCamera";
import { useSceneRouter } from "./camera/useSceneRouter";
import { CertificateGalleryOverlay } from "./components/CertificateGalleryOverlay";
import { usePoems } from "./content/usePoems";
import {
  MeasuredRuntimeFrameBridge,
  PerformanceOverlay,
  PerformanceProbe,
} from "./diagnostics/performance/PerformanceDiagnostics";
import { performanceDiagnostics } from "./diagnostics/performance/performanceStore";
import {
  QualityPreferenceControl,
  QualityProvider,
  QualityRuntimeBridge,
  useRenderingQuality,
} from "./rendering/quality";
import { DEFAULT_RENDER_ISOLATION } from "./rendering/renderIsolation";
import { RENDERING_INTENT } from "./rendering/renderingIntent";
import {
  RenderSchedulerBridge,
  RenderSchedulerNavigationAdapter,
  RenderSchedulerProvider,
} from "./runtime/render-scheduler";
import {
  WorkingSetNavigationAdapter,
  WorkingSetProvider,
  useDestinationResources,
} from "./runtime/working-set";
import { Scene } from "./Scene";
import { POEMS_FOLDER_LAYOUT } from "./sceneLayout";

import type { RuntimeNodeRegistration } from "@denk/cinematic-navigation";
import type { NavigationLocation, SceneId } from "./camera/navigationTypes";
import type { CinematicNavigationSystem } from "./camera/useCinematicCamera";
import type { ScreenProjection } from "./screenProjection";
import type { SceneSettings } from "./Scene";

type PoemInteractionDetail = { slug?: string; title?: string; url?: string; comment?: string };
type FocusedSceneState = { sceneId: SceneId; cameraTargetId: string };

// Keep the reading experience (and its draggable dialog dependency) out of
// the main scene bundle. This still resolves for direct /poems/:slug entries
// because the reader is rendered as soon as the route's poem is available.
const PoemReader = lazy(() =>
  import("./components/PoemReader").then((module) => ({ default: module.PoemReader })),
);
const ProjectsOverlay = lazy(() =>
  import("./components/ProjectsOverlay").then((module) => ({ default: module.ProjectsOverlay })),
);
let mixpanelInitialized = false;
const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== "production") return;
  mixpanel.track(event, properties);
};
const RUNTIME_NODES: readonly RuntimeNodeRegistration[] = [
  { id: "world", scope: "world", mountPolicy: "persistent" },
  ...GUIDED_SCENE_IDS.map((sceneId) => ({
    id: `scene:${sceneId}`,
    scope: "scene" as const,
    sceneId,
    mountPolicy: "lazy" as const,
    retainOnSleep: false,
  })),
  ...Object.values(FOCUS_COLLECTIONS).map((collection) => ({
    id: `collection:${collection.id}`,
    scope: "collection" as const,
    sceneId: collection.sceneId,
    collectionId: collection.id,
    mountPolicy: "lazy" as const,
    retainOnSleep: false,
  })),
];

function PortfolioRuntimeDeclaration({
  cameraSystem,
  runtime,
}: {
  cameraSystem: CinematicNavigationSystem;
  runtime: ReturnType<typeof useCinematicRuntimeController>;
}) {
  const nodes = useMemo(() => {
    const focusCollection = cameraSystem.selectedFocusCollection,
      focusItem = cameraSystem.selectedFocusItem;
    return focusCollection && focusItem
      ? [
          ...RUNTIME_NODES,
          {
            id: `focus:${focusCollection}:${focusItem}`,
            scope: "focus-item" as const,
            sceneId: cameraSystem.selectedScene,
            collectionId: focusCollection,
            focusItemId: focusItem,
            mountPolicy: "lazy" as const,
            retainOnSleep: false,
          },
        ]
      : RUNTIME_NODES;
  }, [
    cameraSystem.selectedFocusCollection,
    cameraSystem.selectedFocusItem,
    cameraSystem.selectedScene,
  ]);
  useEffect(() => {
    const cleanups = nodes.map((node) => runtime.registerNode(node));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [runtime, nodes]);
  return null;
}
const SETTINGS: SceneSettings = {
  desk: 19,
  moon: 1.05,
  moonColor: "#91a8c2",
  bounce: 0.62,
  bloom: 0.08,
  fog: 16.5,
  exposure: RENDERING_INTENT.renderer.exposure,
  dof: 0.45,
  focusDistance: 0.02,
  helpers: false,
  laptopPosition: [-0.55, 0, -0.28],
  laptopRotation: -3,
  folderPosition: POEMS_FOLDER_LAYOUT.position,
  folderRotation: POEMS_FOLDER_LAYOUT.rotationDegrees,
  paperPosition: [-2, 0.518],
  paperRotation: 12,
  penPosition: [0.46, 0.05],
  penRotation: 78,
  coffeePosition: [1.18, 0.175, -0.58],
  plantPosition: [-2.48, 1.35, -2.34],
  plantRotationY: -12,
  lampPosition: [-1.9, -0.07, -0.45],
};

export default function Experience({ initialPath = "/" }: { initialPath?: string }) {
  return (
    <QualityProvider>
      <WorkingSetProvider>
        <RenderSchedulerProvider>
          <ExperienceContent initialPath={initialPath} />
        </RenderSchedulerProvider>
      </WorkingSetProvider>
    </QualityProvider>
  );
}

function ExperienceContent({ initialPath = "/" }: { initialPath?: string }) {
  useMemo(
    () =>
      performanceDiagnostics.configure(typeof window === "undefined" ? "" : window.location.search),
    [],
  );
  const qualityProfile = useRenderingQuality((state) => state.profile);
  const qualityFeatures = useRenderingQuality((state) => state.features);
  const currentDpr = useRenderingQuality((state) => state.adaptive.currentDpr);
  const [renderIsolation, setRenderIsolation] = useState(DEFAULT_RENDER_ISOLATION);
  const [sceneReady, setSceneReady] = useState(false);
  const [cinematicFadeReady, setCinematicFadeReady] = useState(false);
  const [projectsCameraFocused, setProjectsCameraFocused] = useState(false);
  const [projectsOverlayReady, setProjectsOverlayReady] = useState(false);
  const [poemReaderOpen, setPoemReaderOpen] = useState(false);
  const [readerPoemSlug, setReaderPoemSlug] = useState<string | null>(null);

  const directPoemEntry = useRef(/^\/poems\/[^/]+(?:\/)?$/.test(initialPath));
  const directPoemOpened = useRef(false);
  const previousProjectsScene = useRef<SceneId | null>(null);
  const lastCertificateVisit = useRef<string | null>(null);
  const lastPoemRead = useRef<string | null>(null);
  const sceneReadyRef = useRef(false);
  const pendingSceneFocus = useRef<FocusedSceneState | null>(null);
  const skippedSceneFocus = useRef(false);
  const lastSkipVersion = useRef(0);
  const laptopScreenRef = useRef<THREE.Mesh | null>(null);
  const screenProjectionRef = useRef<ScreenProjection | null>(null);

  useEffect(() => {
    if (mixpanelInitialized || process.env.NODE_ENV !== "production") return;
    mixpanel.init("ff576ce4c6538cde6328105772148efb", {
      autocapture: true,
      record_sessions_percent: 0,
    });
    mixpanelInitialized = true;
  }, []);

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onCinematicFadeComplete = useCallback(() => setCinematicFadeReady(true), []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const disabled = new Set((params.get("renderDisable") ?? "").split(",").filter(Boolean));
      if (disabled.size)
        setRenderIsolation((current) => ({
          ...current,
          postProcessing: !disabled.has("post"),
          ambientOcclusion: !disabled.has("ao"),
          vignette: !disabled.has("vignette"),
          bloom: !disabled.has("bloom"),
          shadows: !disabled.has("shadows"),
          environmentLighting: !disabled.has("environment"),
          fillLighting: !disabled.has("fill"),
          mobilePerformanceAdaptations: !disabled.has("mobile"),
        }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const route = useSceneRouter(initialPath);
  const {
    focusCollectionId: routeFocusCollection,
    sceneId: routeScene,
    navigate: routeNavigate,
    navigateWithinScene,
    replaceWithinScene,
  } = route;
  const commitNavigation = useCallback(
    (location: NavigationLocation) => {
      if (location.focusCollectionId && location.focusItemId) {
        const path = pathForFocus(location.focusCollectionId, location.focusItemId);
        if (routeFocusCollection === location.focusCollectionId) replaceWithinScene(path);
        else routeNavigate(path);
        return;
      }
      const path = pathForScene(location.sceneId);
      if (path === null) return;
      if (routeFocusCollection && routeScene === location.sceneId) replaceWithinScene(path);
      else if (location.sceneId === "opening" || location.sceneId === "about")
        navigateWithinScene(path);
      else routeNavigate(path);
    },
    [routeFocusCollection, routeScene, routeNavigate, navigateWithinScene, replaceWithinScene],
  );
  const cameraSystem = useCinematicNavigation(route, route.directEntry, {
    onNavigate: commitNavigation,
  });

  performanceDiagnostics.setLocation(
    cameraSystem.selectedScene,
    cameraSystem.selectedFocusCollection,
    cameraSystem.selectedFocusItem,
  );
  const runtime = useCinematicRuntimeController(cameraSystem.engine);

  const poemsSceneActive = cameraSystem.selectedScene === "poems";
  const poemsResourcesResident = useDestinationResources("poems");
  const projectsResourcesResident = useDestinationResources("projects");

  const poemsContent = usePoems(
    poemsSceneActive && routeFocusCollection === "poems" ? (route.slug ?? null) : null,
    poemsResourcesResident,
  );
  const workingSetOverlays = useMemo(
    () => [
      ...(poemReaderOpen ? ["poem-reader-chunk", "poem-markdown"] : []),
      ...(cameraSystem.selectedFocusCollection === "certificates" ? ["certificate-original"] : []),
      ...(projectsOverlayReady ? ["projects-overlay"] : []),
    ],
    [poemReaderOpen, cameraSystem.selectedFocusCollection, projectsOverlayReady],
  );
  const poemNavigationKey = poemsContent.poems
    .map(
      ({ slug, title, date, imageUrl }) =>
        `${slug}\u0000${title}\u0000${date}\u0000${imageUrl ?? ""}`,
    )
    .join("\u0001");
  const poemNavigationItems = useMemo(
    () =>
      poemsContent.poems.map(({ slug, title, date, imageUrl }) => ({
        slug,
        title,
        date,
        imageUrl,
      })),
    [poemNavigationKey],
  );
  const { syncRoute, goToScene, resumeFromStart } = cameraSystem;

  useEffect(() => {
    sceneReadyRef.current = sceneReady;
  }, [sceneReady]);

  useEffect(() => {
    if (cameraSystem.skipVersion === lastSkipVersion.current) return;
    lastSkipVersion.current = cameraSystem.skipVersion;
    skippedSceneFocus.current = true;
    pendingSceneFocus.current = null;
  }, [cameraSystem.skipVersion]);

  useEffect(() => {
    if (!sceneReady || !pendingSceneFocus.current || skippedSceneFocus.current) return;
    const state = pendingSceneFocus.current;
    pendingSceneFocus.current = null;
    trackEvent("scene_viewed", {
      scene_id: state.sceneId,
      scene_name: SCENE_REGISTRY[state.sceneId]?.label ?? state.sceneId,
      camera_target: state.cameraTargetId,
    });
  }, [sceneReady]);

  useEffect(() => {
    const unsubscribe = cameraSystem.engine.onSceneFocused((state) => {
      setProjectsCameraFocused(state.sceneId === "projects" && state.cameraTargetId === "projects");
      if (skippedSceneFocus.current) {
        skippedSceneFocus.current = false;
        pendingSceneFocus.current = null;
        return;
      }
      if (!sceneReadyRef.current) {
        pendingSceneFocus.current = state;
        return;
      }
      trackEvent("scene_viewed", {
        scene_id: state.sceneId,
        scene_name: SCENE_REGISTRY[state.sceneId]?.label ?? state.sceneId,
        camera_target: state.cameraTargetId,
      });
    });
    return unsubscribe;
  }, [cameraSystem.engine]);

  useEffect(() => {
    const onPoemLoved = (event: Event) => {
      const detail = (event as CustomEvent<PoemInteractionDetail>).detail ?? {};
      trackEvent("poem_loved", { slug: detail.slug, title: detail.title, url: detail.url });
    };
    const onPoemCommented = (event: Event) => {
      const detail = (event as CustomEvent<PoemInteractionDetail>).detail ?? {};
      trackEvent("poem_feedback", {
        slug: detail.slug,
        title: detail.title,
        comment: detail.comment,
        url: detail.url,
      });
    };
    window.addEventListener("poem:loved", onPoemLoved);
    window.addEventListener("poem:comment", onPoemCommented);
    return () => {
      window.removeEventListener("poem:loved", onPoemLoved);
      window.removeEventListener("poem:comment", onPoemCommented);
    };
  }, []);

  useEffect(() => {
    const isCertificateFocus =
      cameraSystem.selectedScene === "certificates" &&
      cameraSystem.selectedFocusCollection === "certificates" &&
      Boolean(cameraSystem.selectedFocusItem);
    if (!isCertificateFocus) {
      lastCertificateVisit.current = null;
      return;
    }
    const slug = cameraSystem.selectedFocusItem!;
    if (lastCertificateVisit.current === slug) return;
    const certificate = getFocusItem("certificates", slug);
    lastCertificateVisit.current = slug;
    trackEvent("certificate_viewed", {
      slug,
      title: certificate?.label ?? slug,
      url: certificate?.metadata?.url,
    });
  }, [
    cameraSystem.selectedScene,
    cameraSystem.selectedFocusCollection,
    cameraSystem.selectedFocusItem,
  ]);

  useEffect(() => {
    if (!poemReaderOpen || !readerPoemSlug) {
      if (!poemReaderOpen) lastPoemRead.current = null;
      return;
    }
    if (lastPoemRead.current === readerPoemSlug) return;
    const poem = poemsContent.poems.find(({ slug }) => slug === readerPoemSlug);
    if (!poem) return;
    lastPoemRead.current = readerPoemSlug;
    trackEvent("poem_read", {
      slug: poem.slug,
      title: poem.title,
      url: window.location.href,
    });
  }, [poemReaderOpen, readerPoemSlug, poemsContent.poems]);

  useEffect(() => {
    setProjectsOverlayReady(
      sceneReady &&
        cameraSystem.selectedScene === "projects" &&
        projectsCameraFocused &&
        cinematicFadeReady,
    );
  }, [cameraSystem.selectedScene, projectsCameraFocused, cinematicFadeReady, sceneReady]);

  useEffect(() => {
    const previous = previousProjectsScene.current;
    previousProjectsScene.current = cameraSystem.selectedScene;
    if (previous !== null && previous !== cameraSystem.selectedScene) {
      setProjectsCameraFocused(false);
      setProjectsOverlayReady(false);
    }
  }, [cameraSystem.selectedScene]);

  useEffect(() => {
    setCinematicFadeReady(false);
  }, [cameraSystem.introVersion, cameraSystem.skipVersion]);

  useEffect(() => {
    if (
      !directPoemEntry.current ||
      directPoemOpened.current ||
      route.focusCollectionId !== "poems" ||
      !route.slug ||
      poemsContent.loading
    )
      return;
    if (!poemsContent.poems.some((poem) => poem.slug === route.slug)) return;
    directPoemOpened.current = true;
    setReaderPoemSlug(route.slug);
    setPoemReaderOpen(true);
  }, [poemsContent.loading, poemsContent.poems, route.focusCollectionId, route.slug]);

  useEffect(() => {
    const collection = FOCUS_COLLECTIONS.poems;
    const unregister = poemNavigationItems.map((poem, index) =>
      cameraSystem.engine.registerFocusItem("poems", {
        id: poem.slug,
        subjectId: `poem:${poem.slug}`,
        cameraTargetId: "poem-detail",
        framing: collection.defaultFraming,
        transition: collection.transition,
        neighbors: {
          left: poemNavigationItems[index - 1]?.slug,
          right: poemNavigationItems[index + 1]?.slug,
        },
        spatial: { x: index, y: 0, column: index, row: 0 },
        metadata: {
          label: poem.title,
          route: `/poems/${poem.slug}`,
          date: poem.date,
          imageUrl: poem.imageUrl,
        },
      }),
    );
    return () => unregister.forEach((dispose) => dispose());
  }, [cameraSystem.engine, poemNavigationItems]);

  useEffect(() => {
    if (!shouldSyncRouteShot(route.path, route.directEntry)) return;
    syncRoute({
      sceneId: route.sceneId,
      focusCollectionId: route.focusCollectionId,
      focusItemId: route.focusItemId,
      cameraTarget: route.cameraTarget,
    });
  }, [
    route.path,
    route.sceneId,
    route.focusCollectionId,
    route.focusItemId,
    route.cameraTarget,
    route.directEntry,
    syncRoute,
  ]);

  const navigateScene = useCallback(
    (sceneId: SceneId) => {
      if (resumeFromStart(sceneId)) return;
      goToScene(sceneId);
    },
    [resumeFromStart, goToScene],
  );

  const openPoemReader = useCallback(() => {
    const slug =
      cameraSystem.selectedFocusCollection === "poems"
        ? cameraSystem.selectedFocusItem
        : poemsContent.poems[0]?.slug;
    if (!slug) return;
    setReaderPoemSlug(slug);
    // Reading mode is URL-addressable even when it was opened from the
    // collection preview, so the first poem gets a shareable slug immediately.
    if (routeScene === "poems") replaceWithinScene(pathForFocus("poems", slug));
    setPoemReaderOpen(true);
  }, [
    cameraSystem.selectedFocusCollection,
    cameraSystem.selectedFocusItem,
    poemsContent.poems,
    replaceWithinScene,
    routeScene,
  ]);

  const changeReaderPoem = useCallback(
    (slug: string) => {
      setReaderPoemSlug(slug);
      // Keep the shareable poem slug authoritative while the reader remains a
      // UI overlay. Poems deliberately keep the same camera framing, so this
      // route replacement does not trigger a camera refocus or notebook motion.
      if (routeScene === "poems") replaceWithinScene(pathForFocus("poems", slug));
    },
    [replaceWithinScene, routeScene],
  );

  const closePoemReader = useCallback(() => {
    setPoemReaderOpen(false);
    // Reading mode is an overlay, not a separate camera destination. Return
    // to the Poems parent location in-place so the reader closes without
    // invoking the collection's normal `exitBehavior: "start"` rule.
    if (
      cameraSystem.selectedScene === "poems" &&
      cameraSystem.selectedFocusCollection === "poems"
    ) {
      cameraSystem.syncRoute(locationForScene("poems"));
      replaceWithinScene(pathForScene("poems"));
    }
  }, [cameraSystem, replaceWithinScene]);

  useCameraKeyboardNavigation(cameraSystem, navigateScene);
  useCameraTapNavigation(cameraSystem, navigateScene);
  useAutoSceneNavigation(cameraSystem, navigateScene);

  const goToWorkspace = useCallback(() => {
    goToScene("opening", "workspace");
  }, [goToScene]);

  const selectCertificate = useCallback(
    (slug: string) => {
      cameraSystem.enterFocus("certificates", slug);
    },
    [cameraSystem],
  );

  const navigateToNextScene = useCallback(() => {
    cameraSystem.exitFocus();
    cameraSystem.nextScene();
  }, [cameraSystem]);

  useCameraPinchNavigation(cameraSystem, goToWorkspace);

  const settings = SETTINGS;
  const onProfile = useCallback(
    (
      id: string,
      phase: "mount" | "update" | "nested-update",
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
    ) =>
      performanceDiagnostics.reactCommit(
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      ),
    [],
  );
  return (
    <Profiler id="Experience" onRender={onProfile}>
      <CinematicRuntimeProvider runtime={runtime}>
        <PortfolioRuntimeDeclaration cameraSystem={cameraSystem} runtime={runtime} />
        <WorkingSetNavigationAdapter
          engine={cameraSystem.engine}
          profileId={qualityProfile.id}
          overlayResourceIds={workingSetOverlays}
        />
        <RenderSchedulerNavigationAdapter engine={cameraSystem.engine} />
        <div className={`canvas-stage${poemReaderOpen ? " poem-reader-open" : ""}`}>
          {/* Use the explicit PCF mode instead of Canvas' boolean default. The
        boolean form selects THREE.PCFSoftShadowMap, which is deprecated in
        the installed Three.js version and gets re-applied whenever the
        experience re-renders. */}
          <Canvas
            frameloop="demand"
            shadows={renderIsolation.shadows && qualityFeatures.allShadows ? "percentage" : false}
            dpr={currentDpr}
            camera={{ position: [-0.72, 1.9, 4.82], fov: 42, near: 0.1, far: 45 }}
            gl={{
              alpha: false,
              antialias: qualityFeatures.antialias,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: settings.exposure,
              powerPreference: qualityProfile.renderer.powerPreference,
            }}
          >
            <CinematicRuntimeProvider runtime={runtime}>
              <RenderSchedulerBridge />
              <MeasuredRuntimeFrameBridge runtime={runtime} paused={poemReaderOpen} />
              <PerformanceProbe />
              <QualityRuntimeBridge
                transitioning={cameraSystem.cameraState.current.isTransitioning}
                overlayChanging={
                  poemReaderOpen || cameraSystem.selectedFocusCollection === "certificates"
                }
              />
              <Profiler id="Scene" onRender={onProfile}>
                <Suspense fallback={null}>
                  <Scene
                    s={settings}
                    cameraSystem={cameraSystem}
                    certificateSlug={route.slug}
                    poemsContent={poemsContent}
                    onPoemRead={openPoemReader}
                    renderIsolation={renderIsolation}
                    qualityProfile={qualityProfile}
                    qualityFeatures={qualityFeatures}
                    onReady={onSceneReady}
                    laptopScreenRef={laptopScreenRef}
                    screenProjectionRef={screenProjectionRef}
                  />
                </Suspense>
              </Profiler>
            </CinematicRuntimeProvider>
          </Canvas>
          <div
            className={`experience-loading${sceneReady ? " is-ready" : ""}`}
            role="status"
            aria-live="polite"
          >
            <span>Entering workspace</span>
          </div>
          <p className="workspace-badge">Denny&rsquo;s Workspace</p>
          <NavigationDebugPanel
            visible={cameraSystem.navigationDebug}
            stateRef={cameraSystem.cameraState}
            boundsVisible={settings.helpers}
          />
          <RuntimeInspector visible={cameraSystem.navigationDebug} />
          <Profiler id="SceneNavigation" onRender={onProfile}>
            <SceneNavigation
              selectedScene={cameraSystem.selectedScene}
              selectedFocusCollection={cameraSystem.selectedFocusCollection}
              selectedFocusItem={cameraSystem.selectedFocusItem}
              resumeScene={cameraSystem.resumeScene}
              visitedAutoScenes={cameraSystem.visitedAutoScenes}
              stateRef={cameraSystem.cameraState}
              onNavigate={navigateScene}
              onNext={cameraSystem.nextScene}
              onEnterFocus={cameraSystem.enterFocus}
              onExitFocus={cameraSystem.exitFocus}
              poemReaderOpen={poemReaderOpen}
            />
          </Profiler>
          <CertificateGalleryOverlay
            open={cameraSystem.selectedFocusCollection === "certificates"}
            selectedSlug={cameraSystem.selectedFocusItem}
            onSelect={selectCertificate}
            onClose={cameraSystem.exitFocus}
            onNavigateNext={navigateToNextScene}
          />
          {projectsResourcesResident && (
            <Suspense fallback={null}>
              <ProjectsOverlay
                visible={cameraSystem.selectedScene === "projects" && projectsOverlayReady}
                projectionRef={screenProjectionRef}
              />
            </Suspense>
          )}
          {poemReaderOpen && (
            <Suspense fallback={null}>
              <PoemReader
                open
                poems={poemsContent.poems}
                slug={readerPoemSlug}
                onSlugChange={changeReaderPoem}
                onClose={closePoemReader}
              />
            </Suspense>
          )}
          <CinematicFade
            replayKey={cameraSystem.introVersion}
            skipKey={cameraSystem.skipVersion}
            hold={route.directEntry ? 0.18 : cameraSystem.openingHold * 0.55}
            duration={route.directEntry ? 1.65 : cameraSystem.fadeDuration}
            reducedMotion={cameraSystem.reducedMotion}
            onComplete={onCinematicFadeComplete}
          />
          <QualityPreferenceControl />
          <PerformanceOverlay />
        </div>
      </CinematicRuntimeProvider>
    </Profiler>
  );
}
