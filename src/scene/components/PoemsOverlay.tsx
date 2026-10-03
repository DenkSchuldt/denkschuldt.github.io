"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { solveHomography } from "../homography";
import { POEM_STAR_IMAGE_URL } from "../poemverse/poemStarAsset";
import { isMobileRenderingViewport } from "../rendering/renderingIntent";
import { useWorkingSetStore } from "../runtime/working-set";

import type { PoemverseScreenPoint } from "../poemverse/poemverseStore";
import type { ScreenProjectionRef } from "../screenProjection";

const SCREEN_LONG_SIDE = 1200;
const SCREEN_SHORT_SIDE = 770;
const STAR_GLYPH_STYLE = { backgroundImage: `url("${POEM_STAR_IMAGE_URL}")` };

function FeatherIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="36"
      height="36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

interface PoemsOverlayProps {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
  onRead: () => void;
  onConnect: (origin: PoemverseScreenPoint) => void;
  hasPoems: boolean;
  starLaunched: boolean;
}

export function PoemsOverlay({
  visible,
  projectionRef,
  onRead,
  onConnect,
  hasPoems,
  starLaunched,
}: PoemsOverlayProps) {
  const workingSet = useWorkingSetStore();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const starGlyphRef = useRef<HTMLSpanElement | null>(null);
  const [present, setPresent] = useState(visible);
  const isPortrait = useProjectionPortrait(projectionRef);
  const logicalWidth = isPortrait ? SCREEN_SHORT_SIDE : SCREEN_LONG_SIDE;
  const logicalHeight = isPortrait ? SCREEN_LONG_SIDE : SCREEN_SHORT_SIDE;
  useEffect(() => {
    workingSet.resourceEvent("prepare-end", "poems-overlay", {
      status: "resident",
      cache: "browser",
      detail: "lazy module/component mounted",
    });
    return () =>
      workingSet.resourceEvent("release", "poems-overlay", {
        status: "released",
        cache: "browser",
        detail: "component unmounted; JavaScript module remains in browser module cache",
        evidence: ["unmounted", "references-released", "browser-memory-unverified"],
      });
  }, [workingSet]);
  useEffect(() => {
    if (visible) {
      setPresent(true);
      return;
    }
    const timer = window.setTimeout(() => setPresent(false), 480);
    return () => window.clearTimeout(timer);
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const source = [
      { x: 0, y: 0 },
      { x: logicalWidth, y: 0 },
      { x: logicalWidth, y: logicalHeight },
      { x: 0, y: logicalHeight },
    ];
    const update = () => {
      const shell = shellRef.current,
        projection = projectionRef.current;
      if (shell && projection) {
        const transform = solveHomography(source, projection.points);
        if (transform) {
          shell.style.transform = transform;
          shell.style.visibility = "visible";
        }
      }
    };
    update();
    return projectionRef.subscribe(update);
  }, [projectionRef, visible, present, logicalWidth, logicalHeight]);
  const handleConnect = () => {
    const glyph = starGlyphRef.current;
    if (!glyph || starLaunched) return;
    const bounds = glyph.getBoundingClientRect();
    onConnect({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
      size: Math.max(bounds.width, bounds.height),
    });
  };
  if (!present) return null;
  return (
    <section className={`poems-overlay${visible ? "" : " is-exiting"}`} aria-hidden={!visible}>
      <div
        ref={shellRef}
        className={`poems-overlay-shell${isPortrait ? " is-portrait" : ""}`}
        style={{
          width: logicalWidth,
          height: logicalHeight,
          visibility: "hidden",
        }}
      >
        <div className="poems-overlay-orbits" aria-hidden="true">
          <div className="poems-system">
            <span className="poems-orbit poems-orbit-inner" />
            <span className="poems-orbit poems-orbit-outer" />
            <span className="poems-sun" />
            <div className="poems-track poems-track-inner">
              <div className="poems-arm">
                <span className="poems-planet poems-planet-sand" />
              </div>
            </div>
            <div className="poems-track poems-track-outer">
              <div className="poems-arm">
                <span className="poems-planet poems-planet-cream" />
              </div>
            </div>
          </div>
        </div>
        <div className="poems-overlay-content">
          <h1>Poems</h1>
          <p className="poems-overlay-subtitle">
            Fragments, reflections,
            <br />
            and other orbiting thoughts.
          </p>
          <span className="poems-overlay-star" aria-hidden="true">
            ✳
          </span>
          <div className="poems-overlay-actions">
            <button
              type="button"
              className="poems-overlay-action"
              onClick={onRead}
              disabled={!hasPoems}
            >
              <span className="poems-action-icon" aria-hidden="true">
                <FeatherIcon />
              </span>
              <span className="poems-action-text">
                <strong>Meet my latest poem</strong>
                <span>Read the newest piece.</span>
              </span>
              <span className="poems-action-arrow" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>
            <button type="button" className="poems-overlay-action" onClick={handleConnect}>
              <span className="poems-action-icon poems-action-icon-star" aria-hidden="true">
                <span
                  ref={starGlyphRef}
                  className={`poems-star-glyph${starLaunched ? " is-launched" : ""}`}
                  style={STAR_GLYPH_STYLE}
                />
              </span>
              <span className="poems-action-text">
                <strong>See how they connect</strong>
                <span>Follow the light upward.</span>
              </span>
              <span className="poems-action-arrow" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function useProjectionPortrait(projection: ScreenProjectionRef) {
  return useSyncExternalStore(
    projection.subscribe,
    () => {
      const viewport = projection.current?.viewport;
      return viewport ? isMobileRenderingViewport(viewport.width / viewport.height) : false;
    },
    () => false,
  );
}
