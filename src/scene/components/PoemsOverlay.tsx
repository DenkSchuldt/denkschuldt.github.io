"use client";

import { useEffect, useRef, useState } from "react";

import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

const SCREEN_LOGICAL_WIDTH = 1200;
const SCREEN_LOGICAL_HEIGHT = 770;

interface PoemsOverlayProps {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
  onRead: () => void;
  hasPoems: boolean;
}

export function PoemsOverlay({ visible, projectionRef, onRead, hasPoems }: PoemsOverlayProps) {
  const workingSet = useWorkingSetStore();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [present, setPresent] = useState(visible);
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
      { x: SCREEN_LOGICAL_WIDTH, y: 0 },
      { x: SCREEN_LOGICAL_WIDTH, y: SCREEN_LOGICAL_HEIGHT },
      { x: 0, y: SCREEN_LOGICAL_HEIGHT },
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
  }, [projectionRef, visible, present]);
  if (!present) return null;
  return (
    <section className={`poems-overlay${visible ? "" : " is-exiting"}`} aria-hidden={!visible}>
      <div
        ref={shellRef}
        className="poems-overlay-shell"
        style={{
          width: SCREEN_LOGICAL_WIDTH,
          height: SCREEN_LOGICAL_HEIGHT,
          visibility: "hidden",
        }}
      >
        <div className="poems-overlay-orbits" aria-hidden="true">
          <span className="poems-orbit poems-orbit-one" />
          <span className="poems-orbit poems-orbit-two" />
          <span className="poems-planet poems-planet-sand" />
          <span className="poems-planet poems-planet-dusk" />
          <span className="poems-planet poems-planet-cream" />
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
              <span className="poems-action-icon poems-action-book" aria-hidden="true">
                ◫
              </span>
              <span className="poems-action-text">
                <strong>Meet my latest poem</strong>
                <span>Read the newest piece.</span>
              </span>
              <span className="poems-action-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
