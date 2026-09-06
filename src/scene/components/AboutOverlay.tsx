"use client";

import { useEffect, useRef, useState } from "react";

import { PROFILE } from "../../content/profile";
import { publicLink } from "../../content/links";
import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

const SHEET_LOGICAL_WIDTH = 708;
const SHEET_LOGICAL_HEIGHT = 1008;

const INSTAGRAM_HANDLE_URL = publicLink("Instagram").href;

export function AboutOverlay({
  visible,
  projectionRef,
}: {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
}) {
  const workingSet = useWorkingSetStore();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [present, setPresent] = useState(visible);
  useEffect(() => {
    workingSet.resourceEvent("prepare-end", "about-overlay", {
      status: "resident",
      cache: "browser",
      detail: "lazy module/component mounted",
    });
    return () =>
      workingSet.resourceEvent("release", "about-overlay", {
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
    <section className={`about-overlay${visible ? "" : " is-exiting"}`} aria-hidden="true">
      <div
        ref={shellRef}
        className="about-overlay-shell"
        style={{
          width: SHEET_LOGICAL_WIDTH,
          height: SHEET_LOGICAL_HEIGHT,
          maxHeight: "none",
          visibility: "hidden",
        }}
      >
        <div className="about-overlay-photo-spacer" aria-hidden="true" />
        <h1>{PROFILE.headline}</h1>
        <div className="about-overlay-copy about-overlay-copy-desktop">
          {PROFILE.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="about-overlay-copy about-overlay-copy-mobile">
          {PROFILE.bioShort.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="about-overlay-languages">
          <svg className="about-overlay-globe" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="20" />
            <path d="M4 24h40M24 4c6 5.4 9 12.1 9 20s-3 14.6-9 20M24 4c-6 5.4-9 12.1-9 20s3 14.6 9 20M7.5 14.5h33M7.5 33.5h33" />
          </svg>
          <span>
            {PROFILE.languages} Você pode me encontrar online como{" "}
            <a href={INSTAGRAM_HANDLE_URL} target="_blank" rel="noopener noreferrer">
              {PROFILE.onlineHandle}
            </a>
            .
          </span>
        </p>
      </div>
    </section>
  );
}
