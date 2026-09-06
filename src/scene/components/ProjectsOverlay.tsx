"use client";

import { useEffect, useRef, useState } from "react";

import { CAREER_CHAPTERS, EXPERIENCE } from "../../content/experience";
import { PROJECTS, SELECTED_WORK } from "../../content/projects";
import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

import type { Project } from "../../content/projects";
import type { ScreenProjectionRef } from "../screenProjection";

const SCREEN_LOGICAL_WIDTH = 1000;
const SCREEN_LOGICAL_HEIGHT = 548;
const MOBILE_PROJECTION_LOGICAL_HEIGHT = 1600;
const TITLE_CARD_HOLD_MS = 2800;
const TITLE_CARD_TRANSITION_MS = 900;
const AUTO_SCROLL_DELAY_MS = 1400;
const AUTO_SCROLL_PIXELS_PER_SECOND = 18;
const MANUAL_SCROLL_PAUSE_MS = 8000;

type ProjectionPhase = "title" | "transition" | "content";
const ASSET_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function ProjectLink({ project }: { project: Project }) {
  return (
    <a
      className="projects-overlay-project"
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className="projects-overlay-project-preview"
        src={`${ASSET_BASE_PATH}${project.previewImage}`}
        alt={project.previewAlt}
      />
      <div className="projects-overlay-project-heading">
        <h3>{project.title}</h3>
        <span aria-hidden="true">↗</span>
      </div>
      <p>{project.description}</p>
      <time>{project.dates}</time>
      <span className="projects-overlay-project-action">
        View project <span aria-hidden="true">↗</span>
      </span>
    </a>
  );
}

export function ProjectsOverlay({
  visible,
  projectionRef,
}: {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
}) {
  const workingSet = useWorkingSetStore();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const initialMobileProjection =
    typeof window !== "undefined" && window.innerWidth / window.innerHeight < 0.82;
  const isMobileProjectionRef = useRef(initialMobileProjection);
  const [present, setPresent] = useState(visible);
  const [isMobileProjection, setIsMobileProjection] = useState(initialMobileProjection);
  const [projectionPhase, setProjectionPhase] = useState<ProjectionPhase>(
    initialMobileProjection ? "title" : "content",
  );
  useEffect(() => {
    workingSet.resourceEvent("prepare-end", "projects-overlay", {
      status: "resident",
      cache: "browser",
      detail: "lazy module/component mounted",
    });
    return () =>
      workingSet.resourceEvent("release", "projects-overlay", {
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
    let frame = 0;
    const update = () => {
      const shell = shellRef.current,
        projection = projectionRef.current;
      if (shell && projection) {
        const isMobile = projection.viewport.width / projection.viewport.height < 0.82;
        const logicalHeight = isMobile ? MOBILE_PROJECTION_LOGICAL_HEIGHT : SCREEN_LOGICAL_HEIGHT;
        if (isMobileProjectionRef.current !== isMobile) {
          isMobileProjectionRef.current = isMobile;
          setIsMobileProjection(isMobile);
        }
        source[2].y = logicalHeight;
        source[3].y = logicalHeight;
        shell.style.height = `${logicalHeight}px`;
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
  useEffect(() => {
    if (!visible || !isMobileProjection) {
      setProjectionPhase("content");
      return;
    }

    setProjectionPhase("title");
    if (shellRef.current) shellRef.current.scrollTop = 0;
    const transitionTimer = window.setTimeout(
      () => setProjectionPhase("transition"),
      TITLE_CARD_HOLD_MS,
    );
    const contentTimer = window.setTimeout(
      () => setProjectionPhase("content"),
      TITLE_CARD_HOLD_MS + TITLE_CARD_TRANSITION_MS,
    );
    return () => {
      window.clearTimeout(transitionTimer);
      window.clearTimeout(contentTimer);
    };
  }, [isMobileProjection, visible]);
  useEffect(() => {
    const shell = shellRef.current;
    if (!visible || !isMobileProjection || projectionPhase !== "content" || !shell) return;

    let frame = 0;
    let previousTime: number | null = null;
    let scrollPosition = shell.scrollTop;
    let resumeAutoScrollAt = 0;
    const handleScroll = () => {
      scrollPosition = shell.scrollTop;
    };
    const handleManualScroll = () => {
      scrollPosition = shell.scrollTop;
      resumeAutoScrollAt = performance.now() + MANUAL_SCROLL_PAUSE_MS;
    };
    shell.addEventListener("scroll", handleScroll, { passive: true });
    shell.addEventListener("wheel", handleManualScroll, { passive: true });
    shell.addEventListener("touchstart", handleManualScroll, { passive: true });
    const updateScroll = (time: number) => {
      if (previousTime !== null && time >= resumeAutoScrollAt) {
        const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.1);
        scrollPosition += elapsedSeconds * AUTO_SCROLL_PIXELS_PER_SECOND;
        shell.scrollTop = scrollPosition;
      }
      previousTime = time;
      if (shell.scrollTop + shell.clientHeight < shell.scrollHeight - 1) {
        frame = window.requestAnimationFrame(updateScroll);
      }
    };
    const delayTimer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(updateScroll);
    }, AUTO_SCROLL_DELAY_MS);
    return () => {
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(frame);
      shell.removeEventListener("scroll", handleScroll);
      shell.removeEventListener("wheel", handleManualScroll);
      shell.removeEventListener("touchstart", handleManualScroll);
    };
  }, [isMobileProjection, projectionPhase, visible]);
  if (!present) return null;
  return (
    <section className={`projects-overlay${visible ? "" : " is-exiting"}`} aria-hidden="true">
      <div
        ref={shellRef}
        className={`projects-overlay-shell${isMobileProjection ? " is-projected" : ""}`}
        style={{
          width: SCREEN_LOGICAL_WIDTH,
          height: SCREEN_LOGICAL_HEIGHT,
          maxHeight: "none",
          visibility: "hidden",
        }}
      >
        {isMobileProjection && projectionPhase !== "content" && (
          <div
            className={`projects-overlay-title-card${projectionPhase === "transition" ? " is-leaving" : ""}`}
          >
            <p>Directed by Denny K. Schuldt</p>
          </div>
        )}
        <div
          className={`projects-overlay-content${isMobileProjection && projectionPhase !== "content" ? " is-waiting" : ""}`}
        >
          <header className="projects-overlay-header">
            <div>
              <p className="projects-overlay-eyebrow">{SELECTED_WORK.eyebrow}</p>
              <h1 id="projects-overlay-title">{SELECTED_WORK.title}</h1>
            </div>
          </header>
          <div className="projects-overlay-body">
            <section className="projects-overlay-selected-work" aria-label="Professional evolution">
              <ol className="projects-overlay-evolution">
                {CAREER_CHAPTERS.map((chapter) => (
                  <li key={chapter.id}>
                    <section
                      className={`projects-overlay-chapter projects-overlay-chapter-${chapter.id}`}
                    >
                      <time className="projects-overlay-chapter-years">{chapter.years}</time>
                      <p className="projects-overlay-chapter-label">{chapter.label}</p>
                      <h2>{chapter.heading}</h2>
                      {chapter.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </section>
                  </li>
                ))}
              </ol>

              <details className="projects-overlay-career">
                <summary>Career timeline</summary>
                <ol className="projects-overlay-career-list">
                  {EXPERIENCE.map((entry) => (
                    <li key={`${entry.role}-${entry.company}-${entry.dates}`}>
                      <article className="projects-overlay-career-entry">
                        <div className="projects-overlay-entry-meta">
                          <time>{entry.dates}</time>
                          <span className="projects-overlay-entry-separator" aria-hidden="true">
                            •
                          </span>
                          <span>{entry.location}</span>
                        </div>
                        <h3>{entry.role}</h3>
                        <p className="projects-overlay-company">{entry.company}</p>
                        {entry.bullets && (
                          <ul>
                            {entry.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </article>
                    </li>
                  ))}
                </ol>
              </details>
            </section>

            <article className="projects-overlay-independent">
              <header className="projects-overlay-independent-header">
                <h2>{SELECTED_WORK.independentExperiments.heading}</h2>
                {SELECTED_WORK.independentExperiments.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </header>
              <ul className="projects-overlay-project-list">
                {PROJECTS.map((project) => (
                  <li key={project.title}>
                    <ProjectLink project={project} />
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <footer className="projects-overlay-ending">The End</footer>
        </div>
      </div>
    </section>
  );
}
