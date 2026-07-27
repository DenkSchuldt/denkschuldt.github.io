"use client";

import { useEffect, useState } from "react";

import { FOCUS_COLLECTIONS, getAdjacentScene, getFocusItem, SCENE_REGISTRY } from "./sceneRegistry";

import type { FocusCollectionId, SceneId } from "./navigationTypes";

interface Props {
  selectedScene: SceneId;
  selectedFocusCollection: FocusCollectionId | null;
  selectedFocusItem: string | null;
  resumeScene: SceneId | null;
  visitedAutoScenes: readonly SceneId[];
  stateRef: React.MutableRefObject<{ introComplete: boolean }>;
  onNavigate: (scene: SceneId) => void;
  onNext: () => SceneId | null;
  onEnterFocus: (collection: FocusCollectionId, item: string) => unknown;
  onExitFocus: () => unknown;
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === "left" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} />
    </svg>
  );
}

function FadingSceneName({ label }: { label: string }) {
  const [displayed, setDisplayed] = useState(label);
  const [visible, setVisible] = useState(Boolean(label));
  useEffect(() => {
    let frame = 0;
    if (label === displayed) {
      frame = window.requestAnimationFrame(() => setVisible(Boolean(label)));
      return () => window.cancelAnimationFrame(frame);
    }
    frame = window.requestAnimationFrame(() => setVisible(false));
    const timer = window.setTimeout(() => {
      setDisplayed(label);
    }, 280);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [label, displayed]);
  return <span className={`scene-name${visible ? " is-visible" : ""}`}>{displayed}</span>;
}

export function SceneNavigation({
  selectedScene,
  selectedFocusCollection,
  selectedFocusItem,
  resumeScene,
  visitedAutoScenes,
  stateRef,
  onNavigate,
  onNext,
  onEnterFocus,
  onExitFocus,
}: Props) {
  const [introComplete, setIntroComplete] = useState(false);
  useEffect(() => {
    const update = () => setIntroComplete(stateRef.current.introComplete);
    update();
    if (stateRef.current.introComplete) return;
    let timer = 0;
    timer = window.setInterval(() => {
      update();
      if (stateRef.current.introComplete) window.clearInterval(timer);
    }, 120);
    return () => window.clearInterval(timer);
  }, [stateRef, selectedScene]);
  const current = introComplete ? selectedScene : "opening";
  const previous = getAdjacentScene(current, -1, visitedAutoScenes);
  const resumeTarget = introComplete && current === "opening" ? resumeScene : null;
  const next = resumeTarget ?? getAdjacentScene(current, 1, visitedAutoScenes);
  const currentLabel = current === "opening" ? "" : SCENE_REGISTRY[current].label;
  const collectionId = SCENE_REGISTRY[current].focusCollection ?? null;
  const collection = collectionId ? FOCUS_COLLECTIONS[collectionId] : null;

  const focusItem = (itemId: string) => {
    if (!collectionId) return;
    if (selectedFocusCollection === collectionId && selectedFocusItem === itemId) {
      const url = getFocusItem(collectionId, itemId)?.metadata?.url;
      if (typeof url === "string") window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    onEnterFocus(collectionId, itemId);
  };

  return (
    <>
      <nav className="scene-navigation" aria-label="Scene navigation">
        <button
          type="button"
          className="scene-navigation-target scene-navigation-previous"
          aria-label={
            previous ? `Previous scene: ${SCENE_REGISTRY[previous].label}` : "No previous scene"
          }
          disabled={!introComplete || !previous}
          onClick={() => previous && onNavigate(previous)}
        >
          <Arrow direction="left" />
          <FadingSceneName label={previous ? SCENE_REGISTRY[previous].label : ""} />
        </button>
        <div className="scene-navigation-current camera-location" aria-live="polite">
          <FadingSceneName label={currentLabel} />
        </div>
        <button
          type="button"
          className="scene-navigation-target scene-navigation-next"
          aria-label={next ? `Next scene: ${SCENE_REGISTRY[next].label}` : "No next scene"}
          disabled={!introComplete || !next}
          onClick={() => onNext()}
        >
          <FadingSceneName label={next ? SCENE_REGISTRY[next].label : ""} />
          <Arrow direction="right" />
        </button>
      </nav>
      {selectedFocusCollection && selectedFocusCollection !== "certificates" && (
        <button
          type="button"
          className="collection-close"
          aria-label={`Exit ${collection?.label ?? "collection"} collection`}
          aria-keyshortcuts="Escape"
          title={`Exit ${collection?.label ?? "collection"} collection (ESC)`}
          onClick={() => onExitFocus()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5m6-6-6 6 6 6" />
          </svg>
          <span className="collection-close-label">Exit {collection?.label ?? "collection"}</span>
          <span className="collection-close-key" aria-hidden="true">
            ESC
          </span>
        </button>
      )}
      {collection && collection.orderedItemIds.length > 0 && (
        <nav
          className="collection-tab-navigation"
          aria-label={`${SCENE_REGISTRY[current].label} collection`}
        >
          {collection.orderedItemIds.map((itemId) => {
            const item = getFocusItem(collection.id, itemId);
            if (!item) return null;
            const active =
              selectedFocusCollection === collection.id && selectedFocusItem === itemId;
            return (
              <button
                key={itemId}
                type="button"
                aria-current={active ? "true" : undefined}
                onFocus={() => {
                  if (!active) onEnterFocus(collection.id, itemId);
                }}
                onClick={() => focusItem(itemId)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
