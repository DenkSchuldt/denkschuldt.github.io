"use client";

import { useEffect, useRef, useState } from "react";

import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

// Matches the paper plane geometry (0.708 x 1.008 scene units) at a uniform
// 1000 logical px per scene unit, so the overlay maps onto it without
// distortion.
const SHEET_LOGICAL_WIDTH = 708;
const SHEET_LOGICAL_HEIGHT = 1008;

const DESKTOP_ABOUT_PARAGRAPHS: readonly string[] = [
  "I build products that think clearly and experiences that move with purpose.",
  "For over a decade, I’ve worked at the intersection of software engineering, UX, and product strategy, turning complex systems into experiences that feel intuitive, scalable, and human. My background spans hands-on development, real-time systems, and leading product strategy for technology used in complex operations.",
  "I’ve also taught UX/UI at Coding Bootcamps ESPOL, sharing what I’ve learned about usability, analytics, and the creative possibilities of generative AI.",
  "Curiosity and precision guide what I build. I care about understanding how things work, why people use them, and how technology can serve them better.",
];
const MOBILE_ABOUT_PARAGRAPHS: readonly string[] = [
  "I build products that think clearly and experiences that feel human.",
  "For over a decade, I’ve worked at the intersection of software engineering, UX, and product strategy—turning complex systems into intuitive, scalable experiences that create real impact.",
  "I care about understanding how things work, why people use them, and how technology can serve them better.",
  "I’ve also taught UX/UI, shared what I’ve learned in bootcamps, and explored the creative possibilities of generative AI.",
];
const INSTAGRAM_HANDLE_URL = "https://www.instagram.com/denkschuldt/";

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
    <section
      className={`about-overlay${visible ? "" : " is-exiting"}`}
      aria-label="About Denny K. Schuldt"
    >
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
        <h1>About me</h1>
        <div className="about-overlay-copy about-overlay-copy-desktop">
          {DESKTOP_ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="about-overlay-copy about-overlay-copy-mobile">
          {MOBILE_ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="about-overlay-languages">
          <svg className="about-overlay-globe" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="20" />
            <path d="M4 24h40M24 4c6 5.4 9 12.1 9 20s-3 14.6-9 20M24 4c-6 5.4-9 12.1-9 20s3 14.6 9 20M7.5 14.5h33M7.5 33.5h33" />
          </svg>
          <span>
            Hablante nativo de Español, fluent in English, and conversational in Brazilian
            Portuguese. Você pode me encontrar online como{" "}
            <a href={INSTAGRAM_HANDLE_URL} target="_blank" rel="noopener noreferrer">
              @DenkSchuldt
            </a>
            .
          </span>
        </p>
      </div>
    </section>
  );
}
