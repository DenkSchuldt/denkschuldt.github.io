"use client";

import { useEffect, useRef } from "react";

import { solveHomography } from "../homography";

import type { ScreenProjectionRef } from "../screenProjection";

const CARD_LOGICAL_WIDTH = 260;
const CARD_LOGICAL_HEIGHT = 370;
const CAPTION_TOP = 318;
const CAPTION_HEIGHT = 44;

export function PolaroidCaptionOverlay({
  visible,
  projectionRef,
}: {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const source = [
      { x: 0, y: 0 },
      { x: CARD_LOGICAL_WIDTH, y: 0 },
      { x: CARD_LOGICAL_WIDTH, y: CARD_LOGICAL_HEIGHT },
      { x: 0, y: CARD_LOGICAL_HEIGHT },
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

  if (!visible) return null;

  return (
    <div
      ref={shellRef}
      className="polaroid-caption-shell"
      style={{ width: CARD_LOGICAL_WIDTH, height: CARD_LOGICAL_HEIGHT, visibility: "hidden" }}
      aria-hidden="true"
    >
      <p className="polaroid-caption-text" style={{ top: CAPTION_TOP, height: CAPTION_HEIGHT }}>
        Pinscher and me
      </p>
    </div>
  );
}
