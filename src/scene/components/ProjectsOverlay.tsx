"use client";

import { useEffect, useRef, useState } from "react";

import { solveHomography } from "../homography";
import { useWorkingSetStore } from "../runtime/working-set";

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

interface ExperienceEntry {
  role: string;
  company: string;
  dates: string;
  location: string;
  bullets?: readonly string[];
}

interface ProjectEntry {
  title: string;
  dates: string;
  description: string;
  href: string;
  previewSrc: string;
  previewAlt: string;
}

const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    role: "Product Manager for Brain Studio & Connect",
    company: "Jelou",
    dates: "December 2025 – Present",
    location: "Guayaquil, Ecuador",
  },
  {
    role: "VP of Product (previously Software Developer → UX Director → VP of Product)",
    company: "Shippify",
    dates: "June 2017 – November 2025",
    location: "Ecuador, Brazil",
    bullets: [
      "Scaled Shippify’s product ecosystem from a single logistics dashboard into a multi-module platform spanning routing, fleet management, reporting, analytics, and delivery tracking.",
      "Evolved from hands-on developer to product leader, overseeing all web experiences across multiple operational regions.",
      "Defined and deployed a unified design system and dark mode across the entire product suite, improving interface consistency and usability for 24/7 logistics operations.",
      "Launched Fleet, a driver onboarding and validation module built and deployed in record time, reducing manual verification efforts.",
      "Re-engineered the Routing Tool to handle high-volume orders through optimized algorithms and an intuitive map-based workflow.",
      "Built and scaled Dashboards to deliver fully customizable KPI visualization with different data sources and filters.",
      "Led UX strategy for the Tracking Page, enhancing real-time delivery transparency and increasing customer satisfaction metrics.",
      "Managed and mentored a cross-functional team of developers and interns, fostering ownership, experimentation, and user empathy.",
      "Partnered directly with C-level executives to align product roadmap with growth goals, improving delivery accuracy and operational productivity.",
      "Championed accessibility, data-driven decisions, and design excellence across every stage of the product lifecycle.",
    ],
  },
  {
    role: "UX/UI Instructor",
    company: "Coding Bootcamps, Escuela Superior Politécnica del Litoral",
    dates: "March 2023 – Present",
    location: "Guayaquil",
    bullets: [
      "Taught UX/UI fundamentals, information visualization, accessibility, and Figma.",
      "Designed and led hands-on workshops integrating Google Analytics into UX decision-making.",
    ],
  },
  {
    role: "Software Engineer",
    company: "Pacificsoft S.A.",
    dates: "May 2017 – June 2017",
    location: "Guayaquil",
    bullets: ["Used Angular and .NET to develop a module for an airline reservation system."],
  },
  {
    role: "Software Engineer",
    company: "Datilmedia S.A.",
    dates: "March 2015 – March 2017",
    location: "Guayaquil",
    bullets: [
      "Developed Android point-of-sale (POS) app for tablets: sales process, product management, client administration, and portable printer integration.",
      "Designed and implemented Dátil Market v1.0 using React and Redux.",
      "Built core web features in Django and React including client registration, account receivables reports, and invoice visualization.",
    ],
  },
  {
    role: "Academic Assistant – HCI Course",
    company: "Escuela Superior Politécnica del Litoral",
    dates: "November 2014 – March 2015",
    location: "Guayaquil",
    bullets: [
      "Assisted in Android development labs covering UI layouts, SQLite, Google Maps API v2, and activity transitions.",
    ],
  },
  {
    role: "Technical Support Assistant",
    company: "Centro de Emprendedores, Escuela Superior Politécnica del Litoral",
    dates: "June 2014 – March 2015",
    location: "Guayaquil",
    bullets: [
      "Implemented multi-site WordPress platform for Student Clubs and Professional Associations.",
    ],
  },
  {
    role: "Intern",
    company: "Blindside Networks",
    dates: "March 2014 – May 2014",
    location: "Guayaquil",
    bullets: [
      "Built prototypes for real-time chat and video-streaming tests using Node.js, Socket.io, and Kurento Media Framework.",
    ],
  },
  {
    role: "Intern",
    company: "Blindside Networks",
    dates: "March 2013 – May 2013",
    location: "Guayaquil",
    bullets: [
      "Enhanced platform usability by updating user interface components and refining front-end interactions based on user feedback and platform standards.",
    ],
  },
];

const PROJECTS: readonly ProjectEntry[] = [
  {
    title: "Aventuras en 360°",
    dates: "2016 – Present",
    description:
      "A collection of interactive spherical photography from touristic places, captured and shared through React.",
    href: "https://denkschuldt.github.io/360",
    previewSrc: `${ASSET_BASE_PATH}/projects/360.png`,
    previewAlt: "Aventuras en 360° project preview",
  },
  {
    title: "@denkschuldt/react-dialog",
    dates: "2021 – Present",
    description: "A simple to use and customizable React dialog implementation.",
    href: "https://www.npmjs.com/package/@denkschuldt/react-dialog",
    previewSrc: `${ASSET_BASE_PATH}/projects/react-dialog.png`,
    previewAlt: "@denkschuldt/react-dialog project preview",
  },
];

function ProjectLink({ project }: { project: ProjectEntry }) {
  return (
    <a
      className="projects-overlay-project"
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className="projects-overlay-project-preview"
        src={project.previewSrc}
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
    <section
      className={`projects-overlay${visible ? "" : " is-exiting"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Experience and projects"
    >
      <div
        ref={shellRef}
        className={`projects-overlay-shell${isMobileProjection ? " is-projected" : ""}${isMobileProjection && projectionPhase === "title" ? " is-starting" : ""}`}
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
              <p className="projects-overlay-eyebrow">Denny K. Schuldt</p>
              <h1>Experience & projects</h1>
            </div>
          </header>
          <div className="projects-overlay-columns">
            <article
              id="projects-experience-panel"
              className="projects-overlay-column projects-overlay-experience"
            >
              <div className="projects-overlay-column-heading">
                <h2>Experience</h2>
              </div>
              <div className="projects-overlay-timeline">
                {EXPERIENCE.map((entry) => (
                  <section
                    className="projects-overlay-entry"
                    key={`${entry.role}-${entry.company}-${entry.dates}`}
                  >
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
                  </section>
                ))}
              </div>
            </article>
            <article
              id="projects-projects-panel"
              className="projects-overlay-column projects-overlay-projects"
            >
              <div className="projects-overlay-column-heading">
                <h2>Projects</h2>
              </div>
              <div className="projects-overlay-project-list">
                {PROJECTS.map((project) => (
                  <ProjectLink key={project.title} project={project} />
                ))}
              </div>
            </article>
          </div>
          <footer className="projects-overlay-ending">The End</footer>
        </div>
      </div>
    </section>
  );
}
