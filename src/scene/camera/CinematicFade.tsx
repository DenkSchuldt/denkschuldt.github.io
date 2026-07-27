"use client";

/* eslint-disable react-hooks/set-state-in-effect -- each replay intentionally restarts the fade state machine. */
import { useEffect, useState } from "react";

export function CinematicFade({
  replayKey,
  skipKey,
  hold,
  duration,
  reducedMotion,
  onComplete,
}: {
  replayKey: number;
  skipKey: number;
  hold: number;
  duration: number;
  reducedMotion: boolean;
  onComplete?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const delay = reducedMotion ? 80 : hold * 1000;
    const timer = window.setTimeout(() => setVisible(false), delay);
    const completeTimer = window.setTimeout(
      () => onComplete?.(),
      delay + (reducedMotion ? 180 : duration * 1000),
    );
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(completeTimer);
    };
  }, [replayKey, skipKey, reducedMotion, hold, duration, onComplete]);
  return (
    <div
      aria-hidden="true"
      className="cinematic-fade"
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${reducedMotion ? 0.18 : duration}s`,
      }}
    />
  );
}
