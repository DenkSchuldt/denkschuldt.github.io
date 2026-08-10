"use client";

import { useEffect, useRef, useState } from "react";

import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

// Matches the notebook page's planeGeometry (0.704 x 0.682 scene units) at a
// uniform 1000 logical px per scene unit, so the overlay maps onto it
// without distortion.
const SHEET_LOGICAL_WIDTH = 704;
const SHEET_LOGICAL_HEIGHT = 682;

export function PoemsOverlay({
  visible,
  projectionRef,
  onRead,
}: {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
  onRead: () => void;
}) {
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
      { x: SHEET_LOGICAL_WIDTH, y: 0 },
      { x: SHEET_LOGICAL_WIDTH, y: SHEET_LOGICAL_HEIGHT },
      { x: 0, y: SHEET_LOGICAL_HEIGHT },
    ];
    let frame = 0;
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
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [projectionRef, visible]);
  if (!present) return null;
  return (
    <section className={`poems-overlay${visible ? "" : " is-exiting"}`} aria-label="Poems">
      <div
        ref={shellRef}
        className="poems-overlay-shell"
        style={{
          width: SHEET_LOGICAL_WIDTH,
          height: SHEET_LOGICAL_HEIGHT,
          visibility: "hidden",
        }}
      >
        <h1>Poems</h1>
        <p>
          Poetry is how I make sense of what I feel, what I lose, and what I still hope to find.
        </p>
        <p>
          I write about love, absence, identity, time, and the strange experience of being alive.
        </p>
        <button type="button" className="poems-overlay-read-button" onClick={onRead}>
          Read my poetry
        </button>
      </div>
    </section>
  );
}
