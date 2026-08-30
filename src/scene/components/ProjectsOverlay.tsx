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
      aria-labelledby="projects-overlay-title"
      aria-hidden={!visible}
    >
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
              <p className="projects-overlay-eyebrow">Denny K. Schuldt</p>
              <h1 id="projects-overlay-title">Selected Work</h1>
            </div>
          </header>
          <div className="projects-overlay-body">
            <section className="projects-overlay-selected-work" aria-label="Professional evolution">
              <ol className="projects-overlay-evolution">
                <li>
                  <section className="projects-overlay-chapter projects-overlay-chapter-now">
                    <time className="projects-overlay-chapter-years">2025—Now</time>
                    <p className="projects-overlay-chapter-label">Now</p>
                    <h2>Product, systems and AI</h2>
                    <p>
                      I work across product strategy, technology and user experience, currently
                      building AI-enabled products at Jelou.
                    </p>
                    <p>
                      My role is to connect complex systems with experiences people can actually
                      use.
                    </p>
                  </section>
                </li>

                <li>
                  <section className="projects-overlay-chapter projects-overlay-chapter-leadership">
                    <time className="projects-overlay-chapter-years">2017—2025</time>
                    <p className="projects-overlay-chapter-label">Product Leadership</p>
                    <h2>From products to ecosystems</h2>
                    <p>
                      At Shippify, my scope grew from individual product decisions to product
                      strategy, platforms and teams.
                    </p>
                    <p>
                      I worked across routing, fleet management, scheduling, automations,
                      operational tools and driver experiences.
                    </p>
                    <p>
                      Over time, the question became less <em>what should we build?</em> and more
                      <em> what problem is worth solving?</em>
                    </p>
                  </section>
                </li>

                <li>
                  <section className="projects-overlay-chapter projects-overlay-chapter-product">
                    <time className="projects-overlay-chapter-years">2017—2025</time>
                    <p className="projects-overlay-chapter-label">Product &amp; UX</p>
                    <h2>Making complexity usable</h2>
                    <p>I moved from building systems to shaping how people interact with them.</p>
                    <p>
                      That meant understanding workflows, simplifying complexity and questioning
                      what should exist before deciding how to build it.
                    </p>
                  </section>
                </li>

                <li>
                  <section className="projects-overlay-chapter projects-overlay-chapter-engineering">
                    <time className="projects-overlay-chapter-years">2015—2017</time>
                    <p className="projects-overlay-chapter-label">Engineering</p>
                    <h2>Understanding systems from the inside</h2>
                    <p>I started as a software engineer.</p>
                    <p>
                      That foundation still shapes how I think about products: through constraints,
                      dependencies and the systems beneath the interface.
                    </p>
                  </section>
                </li>

                <li>
                  <section className="projects-overlay-chapter projects-overlay-chapter-foundations">
                    <time className="projects-overlay-chapter-years">2013—2015</time>
                    <p className="projects-overlay-chapter-label">Foundations</p>
                    <h2>Where it started</h2>
                    <p>Computer Science, early technical roles and a lot of curiosity.</p>
                    <p>The tools changed.</p>
                    <p>The questions got bigger.</p>
                  </section>
                </li>
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
                <h2>Independent Experiments</h2>
                <p>A space to build without organizational constraints.</p>
                <p>Product, interaction, engineering and visual direction — all in one place.</p>
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
