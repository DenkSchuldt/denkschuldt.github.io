"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { readablePoemDate } from "../content/poems";
import { CONSTELLATION_SUMMARIES } from "../poemverse/constellationLayout";
import { POEM_STAR_IMAGE_URL } from "../poemverse/poemStarAsset";
import { usePoemverse, usePoemverseHover } from "../poemverse/poemverseStore";

import type { CSSProperties } from "react";
import type {
  PoemverseHover,
  PoemverseScreenPoint,
  PoemverseStore,
} from "../poemverse/poemverseStore";

type CloneStage = "lifting" | "handoff" | "done";

interface PoemverseLaunchProps {
  store: PoemverseStore;
  origin: PoemverseScreenPoint;
  reducedMotion: boolean;
  poems: readonly { slug: string; date: string }[];
  onSelectPoem: (slug: string) => void;
}

interface StarPopoverProps {
  hover: PoemverseHover;
  date: string | null;
  onRead: () => void;
}

const POPOVER_HALF_WIDTH_PX = 150;
const POPOVER_EDGE_PX = 14;
const POPOVER_FLIP_BELOW_PX = 260;
const LIFT_DISTANCE_PX = 22;
const LIFT_SCALE = 1.32;
const LIFT_DURATION_MS = 560;
const HANDOFF_DURATION_MS = 320;

export function PoemverseLaunch({
  store,
  origin,
  reducedMotion,
  poems,
  onSelectPoem,
}: PoemverseLaunchProps) {
  const { phase } = usePoemverse(store);
  const hover = usePoemverseHover(store);
  const [stage, setStage] = useState<CloneStage>("lifting");
  const returnButtonRef = useRef<HTMLButtonElement | null>(null);
  const isLanded = phase === "landed";
  const poemDates = useMemo(
    () => new Map(poems.map(({ slug, date }) => [slug, readablePoemDate(date)])),
    [poems],
  );

  useEffect(() => {
    if (stage !== "lifting") return;
    let unsubscribe: (() => void) | null = null;
    const handOff = () => {
      if (!store.sceneReady || store.phase !== "launching") return false;
      store.beginRise({
        x: origin.x,
        y: origin.y - LIFT_DISTANCE_PX,
        size: origin.size * LIFT_SCALE,
      });
      setStage("handoff");
      return true;
    };
    const timer = window.setTimeout(
      () => {
        if (handOff()) return;
        unsubscribe = store.subscribe(() => {
          if (handOff()) unsubscribe?.();
        });
      },
      reducedMotion ? 80 : LIFT_DURATION_MS,
    );
    return () => {
      window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, [origin, reducedMotion, stage, store]);

  useEffect(() => {
    if (stage !== "handoff") return;
    const timer = window.setTimeout(
      () => setStage("done"),
      reducedMotion ? 60 : HANDOFF_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, stage]);

  useEffect(() => {
    if (!isLanded) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") store.leave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLanded, store]);

  useEffect(() => {
    if (!isLanded) return;
    const timer = window.setTimeout(
      () => returnButtonRef.current?.focus({ preventScroll: true }),
      1600,
    );
    return () => window.clearTimeout(timer);
  }, [isLanded]);

  const handleReadHovered = () => {
    const slug = store.getHover()?.slug;
    store.setHover(null);
    if (slug) onSelectPoem(slug);
  };

  const isCloneVisible = stage !== "done" && phase !== "returning" && phase !== "idle";
  const cloneStyle: CSSProperties & Record<"--lift-distance" | "--lift-scale", string> = {
    left: origin.x,
    top: origin.y,
    width: origin.size,
    height: origin.size,
    backgroundImage: `url("${POEM_STAR_IMAGE_URL}")`,
    "--lift-distance": `${-LIFT_DISTANCE_PX}px`,
    "--lift-scale": `${LIFT_SCALE}`,
  };

  return (
    <>
      {isCloneVisible && (
        <span
          className={`poemverse-launch-star is-${stage}`}
          style={cloneStyle}
          aria-hidden="true"
        />
      )}

      <header
        className={`poemverse-appbar${isLanded ? " is-visible" : ""}`}
        aria-hidden={!isLanded}
      >
        <h2 className="poemverse-appbar-title" role="status">
          {isLanded ? "Poemverse" : ""}
        </h2>
        <button
          ref={returnButtonRef}
          type="button"
          className="certificate-gallery-close poemverse-close"
          onClick={store.leave}
          aria-label="Close Poemverse"
          aria-keyshortcuts="Escape"
          title="Close Poemverse (ESC)"
          tabIndex={isLanded ? 0 : -1}
        >
          <span aria-hidden="true">ESC</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {isLanded && (
          <nav className="sr-only" aria-label="Poem constellations">
            {CONSTELLATION_SUMMARIES.map((constellation) => (
              <section key={constellation.id} aria-label={constellation.name}>
                <h2>{constellation.name}</h2>
                <p>{constellation.theme}</p>
                <ul>
                  {constellation.poems.map((poem) => (
                    <li key={poem.slug}>
                      <button type="button" onClick={() => onSelectPoem(poem.slug)}>
                        {poem.title}
                      </button>
                      {poem.connections.map((reason) => (
                        <p key={reason}>{reason}</p>
                      ))}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        )}
      </header>

      {isLanded && hover && (
        <StarPopover
          key={hover.slug}
          hover={hover}
          date={poemDates.get(hover.slug) ?? null}
          onRead={handleReadHovered}
        />
      )}
    </>
  );
}

function StarPopover({ hover, date, onRead }: StarPopoverProps) {
  const viewportWidth = window.innerWidth;
  const halfWidth = Math.min(POPOVER_HALF_WIDTH_PX, viewportWidth / 2 - POPOVER_EDGE_PX);
  const left = Math.min(
    Math.max(hover.x, halfWidth + POPOVER_EDGE_PX),
    viewportWidth - halfWidth - POPOVER_EDGE_PX,
  );
  const isBelow = hover.y < POPOVER_FLIP_BELOW_PX;
  const className = [
    "poemverse-star-label",
    isBelow ? "is-below" : "",
    hover.isPinned ? "is-pinned" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={{ left, top: hover.y }}
      role={hover.isPinned ? "dialog" : undefined}
      aria-label={hover.isPinned ? hover.title : undefined}
      aria-hidden={!hover.isPinned}
    >
      <span className="poemverse-star-label-constellation">{hover.constellation}</span>
      <span className="poemverse-star-label-title">{hover.title}</span>
      {date && <span className="poemverse-star-label-date">{date}</span>}
      {hover.isPinned && (
        <button type="button" className="poemverse-star-label-read" onClick={onRead}>
          Read poem
        </button>
      )}
    </div>
  );
}
