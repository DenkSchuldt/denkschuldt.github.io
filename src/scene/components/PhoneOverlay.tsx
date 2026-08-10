"use client";

import { useEffect, useRef, useState } from "react";

import { solveHomography } from "../homography";
import { NOW_PLAYING_TRACK, ACTIVE_REALITY_STYLE } from "../content/phoneConfig";
import { useWorkingSetStore } from "../runtime/working-set";

import type { ScreenProjectionRef } from "../screenProjection";

// Matches the phone screen planeGeometry (0.299 x 0.618 scene units) at a
// uniform ~1305 logical px per scene unit, so the overlay maps onto it
// without distortion. See the screenRef mesh in Phone/PhoneScreen
// (objects/Primitives.tsx).
const SCREEN_LOGICAL_WIDTH = 390;
const SCREEN_LOGICAL_HEIGHT = 806;

export interface PhoneLatestPoem {
  slug: string;
  title: string;
  date: string;
}

function useLockScreenClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: number | undefined;
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, msUntilNextMinute);
    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);
  return {
    time: now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    date: now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
  };
}

// A short, honest "published" label rather than a hardcoded "now" — most
// visits happen well after the latest poem's publish date.
function formatPoetryTimestamp(dateValue: string) {
  const published = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(published.getTime())) return "";
  const days = Math.floor((Date.now() - published.getTime()) / 86_400_000);
  if (days <= 0) return "now";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  return published.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PoetryIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M4 16 12.7 7.3a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.8 5.5 14.5 9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M8.6 15V4.8L16.6 3v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="15" r="2.6" fill="currentColor" />
      <circle cx="14" cy="13" r="2.6" fill="currentColor" />
    </svg>
  );
}

function RealityIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.3" fill="currentColor" />
    </svg>
  );
}

function NotificationCardContent({
  icon,
  label,
  timestamp,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  timestamp?: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <>
      <span className="denkos-notification-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="denkos-notification-body">
        <span className="denkos-notification-row">
          <span className="denkos-notification-label">{label}</span>
          {timestamp && <span className="denkos-notification-timestamp">{timestamp}</span>}
        </span>
        <span className="denkos-notification-primary">{primary}</span>
        {secondary && <span className="denkos-notification-secondary">{secondary}</span>}
      </span>
    </>
  );
}

function NotificationCard({
  className,
  icon,
  label,
  timestamp,
  primary,
  secondary,
  onSelect,
  href,
}: {
  className: string;
  icon: React.ReactNode;
  label: string;
  timestamp?: string;
  primary: string;
  secondary?: string;
  onSelect?: () => void;
  href?: string;
}) {
  const content = (
    <NotificationCardContent
      icon={icon}
      label={label}
      timestamp={timestamp}
      primary={primary}
      secondary={secondary}
    />
  );
  if (href)
    return (
      <a
        className={`denkos-notification ${className}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  return (
    <button
      type="button"
      className={`denkos-notification ${className}`}
      onClick={onSelect}
      disabled={!onSelect}
    >
      {content}
    </button>
  );
}

export function PhoneOverlay({
  visible,
  projectionRef,
  latestPoem,
  poemsLoading,
  onOpenPoetry,
  onOpenReality,
}: {
  visible: boolean;
  projectionRef: ScreenProjectionRef;
  latestPoem: PhoneLatestPoem | null;
  poemsLoading: boolean;
  onOpenPoetry: () => void;
  onOpenReality?: () => void;
}) {
  const workingSet = useWorkingSetStore();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [present, setPresent] = useState(visible);
  const { time, date } = useLockScreenClock();

  useEffect(() => {
    workingSet.resourceEvent("prepare-end", "phone-overlay", {
      status: "resident",
      cache: "browser",
      detail: "lazy module/component mounted",
    });
    return () =>
      workingSet.resourceEvent("release", "phone-overlay", {
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

  const poetrySecondary = latestPoem ? `“${latestPoem.title}”` : null;

  return (
    <section
      className={`denkos-lockscreen${visible ? "" : " is-exiting"}`}
      aria-label="denkOS lock screen"
    >
      <div
        ref={shellRef}
        className="denkos-lockscreen-shell"
        style={{
          width: SCREEN_LOGICAL_WIDTH,
          height: SCREEN_LOGICAL_HEIGHT,
          visibility: "hidden",
        }}
      >
        <header className="denkos-lockscreen-header">
          <p className="denkos-lockscreen-time">{time}</p>
          <p className="denkos-lockscreen-date">{date}</p>
        </header>
        <div className="denkos-notification-list">
          {poemsLoading && !latestPoem ? (
            <div className="denkos-notification denkos-notification-loading" aria-hidden="true">
              <span className="denkos-notification-icon">
                <PoetryIcon />
              </span>
              <span className="denkos-notification-body">
                <span className="denkos-notification-row">
                  <span className="denkos-notification-label">Poetry</span>
                </span>
                <span className="denkos-notification-primary denkos-notification-placeholder">
                  Loading latest poem…
                </span>
              </span>
            </div>
          ) : (
            latestPoem && (
              <NotificationCard
                className="denkos-notification-poetry"
                icon={<PoetryIcon />}
                label="Poetry"
                timestamp={formatPoetryTimestamp(latestPoem.date)}
                primary="New poem published"
                secondary={poetrySecondary ?? undefined}
                onSelect={onOpenPoetry}
              />
            )
          )}
          <NotificationCard
            className="denkos-notification-music"
            icon={<MusicIcon />}
            label="Music"
            primary="Now Playing"
            secondary={`${NOW_PLAYING_TRACK.title} — ${NOW_PLAYING_TRACK.artist}`}
            href={NOW_PLAYING_TRACK.url}
          />
          <NotificationCard
            className="denkos-notification-reality"
            icon={<RealityIcon />}
            label="Workspace"
            primary={`Reality: ${ACTIVE_REALITY_STYLE.label}`}
            secondary="Change visual style"
            onSelect={onOpenReality}
          />
        </div>
        <p className="denkos-lockscreen-wordmark" aria-hidden="true">
          denkOS
        </p>
      </div>
    </section>
  );
}
