"use client";

import { useEffect, useState } from "react";

export function CinematicFade({ replayKey, skipKey, hold, duration, reducedMotion }: { replayKey:number; skipKey:number; hold:number; duration:number; reducedMotion:boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const delay = reducedMotion ? 80 : (hold * 1000);
    const timer = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(timer);
  }, [replayKey, skipKey, hold, reducedMotion]);
  return <div aria-hidden="true" className="cinematic-fade" style={{ opacity:visible?1:0, transitionDuration:`${reducedMotion?.18:duration}s` }} />;
}
