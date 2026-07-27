"use client";

import { useEffect, useRef, useState } from "react";

import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

const SCREEN_LOGICAL_WIDTH = 1000;
const SCREEN_LOGICAL_HEIGHT = 548;
const ASSET_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function solveHomography(
  source: readonly { x: number; y: number }[],
  destination: readonly { x: number; y: number }[],
) {
  const matrix: number[][] = [],
    values: number[] = [];
  source.forEach(({ x, y }, index) => {
    const { x: X, y: Y } = destination[index];
    matrix.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    values.push(X);
    matrix.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    values.push(Y);
  });
  for (let pivot = 0; pivot < 8; pivot++) {
    let row = pivot;
    for (let candidate = pivot + 1; candidate < 8; candidate++)
      if (Math.abs(matrix[candidate][pivot]) > Math.abs(matrix[row][pivot])) row = candidate;
    [matrix[pivot], matrix[row]] = [matrix[row], matrix[pivot]];
    [values[pivot], values[row]] = [values[row], values[pivot]];
    const divisor = matrix[pivot][pivot];
    if (Math.abs(divisor) < 1e-8) return null;
    for (let column = pivot; column < 8; column++) matrix[pivot][column] /= divisor;
    values[pivot] /= divisor;
    for (let candidate = 0; candidate < 8; candidate++) {
      if (candidate === pivot) continue;
      const factor = matrix[candidate][pivot];
      for (let column = pivot; column < 8; column++)
        matrix[candidate][column] -= factor * matrix[pivot][column];
      values[candidate] -= factor * values[pivot];
    }
  }
  const [a, b, c, d, e, f, g, h] = values;
  // CSS matrix3d is column-major. The fourth column carries the projective
  // denominator so the rectangle follows the screen's perspective exactly.
  // The solved coefficients are ordered as x' = (a*x + b*y + c) / w and
  // y' = (d*x + e*y + f) / w; CSS stores the x/y terms in column-major order.
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}

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
  const [present, setPresent] = useState(visible);
  const [mobileTab, setMobileTab] = useState<"experience" | "projects">("experience");
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
      className={`projects-overlay${visible ? "" : " is-exiting"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Experience and projects"
    >
      <div
        ref={shellRef}
        className="projects-overlay-shell"
        style={{
          width: SCREEN_LOGICAL_WIDTH,
          height: SCREEN_LOGICAL_HEIGHT,
          maxHeight: "none",
          visibility: "hidden",
        }}
      >
        <header className="projects-overlay-header">
          <div>
            <p className="projects-overlay-eyebrow">Denny K. Schuldt</p>
            <h1>Experience & projects</h1>
          </div>
        </header>
        <div className="projects-overlay-tabs" role="tablist" aria-label="Portfolio sections">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "experience"}
            aria-controls="projects-experience-panel"
            onClick={() => setMobileTab("experience")}
          >
            Experience
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "projects"}
            aria-controls="projects-projects-panel"
            onClick={() => setMobileTab("projects")}
          >
            Projects
          </button>
        </div>
        <div className="projects-overlay-columns">
          <article
            id="projects-experience-panel"
            role="tabpanel"
            className={`projects-overlay-column projects-overlay-experience${mobileTab === "experience" ? " is-mobile-active" : ""}`}
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
            role="tabpanel"
            className={`projects-overlay-column projects-overlay-projects${mobileTab === "projects" ? " is-mobile-active" : ""}`}
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
      </div>
    </section>
  );
}
