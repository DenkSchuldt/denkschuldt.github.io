"use client";

import { useEffect, useState } from "react";

const OPENING_VISIT_KEY = "cinematic-room:opening-seen";
const OPENING_CREDITS_DURATION_MS = 10500;
// Keep the visit validation ready while the opening timing is being polished.
const ALWAYS_PLAY_OPENING_CREDITS = true;

// The credits belong to the initial arrival on the site, not to navigating back
// to the opening scene later. This component unmounts/remounts as the route
// changes (see the `!route.directEntry` gate in Experience), so the "already
// handled" flag lives at module scope: it survives in-app navigation and only
// resets on a full page load — which is exactly what "entering" means.
let openingArrivalConsumed = false;

export const OPENING_COPY = {
  name: "Denny K. Schuldt",
  dimensions: "Product. Technology. Experiences. Words.",
  thesis: "I turn complex things into experiences people can feel.",
} as const;

interface OpeningCreditsProps {
  isOpening: boolean;
  reducedMotion: boolean;
  replayKey: number;
  onReturningVisit: () => void;
}

export function OpeningCredits({
  isOpening,
  reducedMotion,
  replayKey,
  onReturningVisit,
}: OpeningCreditsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOpening) {
      const frame = window.requestAnimationFrame(() => setIsVisible(false));
      return () => window.cancelAnimationFrame(frame);
    }

    const isReplay = replayKey > 0;

    // Navigating back to the opening scene mid-session: the arrival moment is
    // already spent, so don't replay the credits (and there's no intro
    // cinematic to skip — regular scene navigation handled the transition).
    if (openingArrivalConsumed && !isReplay) return;

    const hasSeenOpening = window.localStorage.getItem(OPENING_VISIT_KEY) === "true";
    if (hasSeenOpening && !isReplay && !ALWAYS_PLAY_OPENING_CREDITS) {
      openingArrivalConsumed = true;
      onReturningVisit();
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      openingArrivalConsumed = true;
      setIsVisible(true);
    });
    const duration = reducedMotion ? 1400 : OPENING_CREDITS_DURATION_MS;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(OPENING_VISIT_KEY, "true");
      setIsVisible(false);
    }, duration);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isOpening, onReturningVisit, reducedMotion, replayKey]);

  if (!isVisible) return null;

  return (
    <section
      className={`opening-credits${reducedMotion ? " is-reduced-motion" : ""}`}
      aria-label="Introduction"
      aria-live="polite"
    >
      <div className="opening-credit opening-credit-identity">
        <p className="opening-credit-name">{OPENING_COPY.name}</p>
        <p className="opening-credit-dimensions">{OPENING_COPY.dimensions}</p>
      </div>
      <p className="opening-credit opening-credit-thesis">{OPENING_COPY.thesis}</p>
    </section>
  );
}
