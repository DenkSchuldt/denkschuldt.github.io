"use client";

import { useEffect, useRef, useState } from "react";

import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

const SCREEN_LOGICAL_WIDTH = 1200;
const SCREEN_LOGICAL_HEIGHT = 770;

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
          </div>
        </div>
      </div>
    </section>
  );
}
