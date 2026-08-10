"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ReactDOM from "react-dom";
import DialogPackage from "@denkschuldt/react-dialog";

import { useWorkingSetStore } from "../runtime/working-set";

import type { ComponentType, ReactNode } from "react";
import type { PoemRecord } from "../content/poems";

type ReactDialogProps = {
  title?: string;
  className?: string;
  draggable?: boolean;
  cancelableOutside?: boolean;
  closeOnEscPress?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onCancelClick?: () => void;
  onConfirmClick?: () => void;
  onCloseClick: () => void;
};

// The published package is CommonJS (`exports.default = Dialog`). Vite's
// interop can therefore hand a default import the module object itself.
// Unwrap it once so JSX always receives the actual component function.
const Dialog = ((DialogPackage as unknown as { default?: ComponentType<ReactDialogProps> })
  .default ?? DialogPackage) as ComponentType<ReactDialogProps>;

type ReactDomWithFindNode = typeof ReactDOM & {
  findDOMNode?: (instance: unknown) => Element | null;
};
type ReactFiber = {
  tag?: number;
  stateNode?: unknown;
  child?: ReactFiber | null;
  sibling?: ReactFiber | null;
};

function findHostNode(fiber: ReactFiber | null | undefined): Element | null {
  if (!fiber) return null;
  if (
    fiber.tag === 5 &&
    fiber.stateNode &&
    typeof Element !== "undefined" &&
    fiber.stateNode instanceof Element
  )
    return fiber.stateNode;
  return findHostNode(fiber.child) ?? findHostNode(fiber.sibling);
}

// react-dialog 1.x bundles react-draggable, whose legacy findDOMNode call is
// incompatible with React 19. The dialog only needs its host element for
// pointer bookkeeping, so provide the narrow equivalent through its fiber.
const reactDomCompat = ReactDOM as ReactDomWithFindNode;
if (typeof reactDomCompat.findDOMNode !== "function") {
  reactDomCompat.findDOMNode = (instance) => {
    if (typeof Element !== "undefined" && instance instanceof Element) return instance;
    return findHostNode((instance as { _reactInternals?: ReactFiber } | null)?._reactInternals);
  };
}

interface Props {
  open: boolean;
  poems: PoemRecord[];
  slug: string | null;
  onSlugChange: (slug: string) => void;
  onClose: (slug: string | null) => void;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

// Native `scrollBy({ behavior: "smooth" })` duration/easing isn't
// controllable and varies by browser, so the scroll-hint nudge animates
// scrollTop by hand for a deliberately slow, eased motion.
function smoothScrollBy(el: HTMLElement, distance: number, duration: number) {
  const start = el.scrollTop;
  const startTime = performance.now();
  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    el.scrollTop = start + distance * easeInOutCubic(progress);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function readableDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

const LOVED_POEMS_STORAGE_KEY = "denny.poems.loved";

function readLovedPoems(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(LOVED_POEMS_STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(parsed)) return {};
    return Object.fromEntries(
      parsed
        .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
        .map((slug) => [slug, true]),
    );
  } catch {
    return {};
  }
}

export function PoemReader({ open, poems, slug, onSlugChange, onClose }: Props) {
  const workingSet = useWorkingSetStore();
  useEffect(() => {
    if (!open) return;
    workingSet.resourceEvent("prepare-end", "poem-reader-chunk", {
      status: "resident",
      cache: "browser",
      detail: "lazy reader module and DOM mounted",
    });
    return () =>
      workingSet.resourceEvent("release", "poem-reader-chunk", {
        status: "released",
        cache: "browser",
        detail: "reader DOM unmounted; JavaScript module remains cached",
        evidence: ["unmounted", "references-released", "browser-memory-unverified"],
      });
  }, [open, workingSet]);

  const [shareLabel, setShareLabel] = useState("Share");
  const [lovedPoems, setLovedPoems] = useState<Record<string, boolean>>(readLovedPoems);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [commentStatus, setCommentStatus] = useState<string | null>(null);
  const [commentSending, setCommentSending] = useState(false);

  const contentRef = useRef<HTMLElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [scrollHintSeen, setScrollHintSeen] = useState(false);

  // The parent owns the URL-backed slug. Keeping a second local slug here can
  // briefly pair the previous selection with the new route during fast turns.
  const activeSlug = slug;
  const currentIndex = poems.findIndex((poem) => poem.slug === slug);
  const current = currentIndex >= 0 ? poems[currentIndex] : null;
  // The manifest and Markdown body are updated by slug in usePoems. Render the
  // complete record from that single source only; this prevents a previous
  // poem's body from ever being paired with the newly selected metadata.
  const displayRecord = current?.body ? current : null;

  const changeSlug = useCallback(
    (nextSlug: string) => {
      if (!poems.some((poem) => poem.slug === nextSlug)) return;
      onSlugChange(nextSlug);
    },
    [onSlugChange, poems],
  );

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);

  // Long poems can overflow the reader on both desktop and mobile with no
  // visible scrollbar cue (mobile hides it entirely). Show a down-arrow hint
  // each time the reader (re)opens on content that overflows, without dimming
  // the text itself; dismiss it for this visit once actually scrolled. Reruns
  // on `open` because the reader's DOM — and these refs — unmount while closed.
  useEffect(() => {
    const el = contentRef.current;
    const column = columnRef.current;
    if (!el || !column) return;
    const update = () => {
      setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
      if (el.scrollTop > 4) setScrollHintSeen(true);
    };
    setScrollHintSeen(false);
    update();
    el.addEventListener("scroll", update, { passive: true });
    // Observe the content column, not the fixed-size scroll container itself
    // — the container's own box never resizes as its content overflows it.
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(column);
    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [displayRecord, open]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOVED_POEMS_STORAGE_KEY,
        JSON.stringify(Object.keys(lovedPoems).filter((poemSlug) => lovedPoems[poemSlug])),
      );
    } catch {
      // Storage can be unavailable in private browsing; the in-memory state still works.
    }
  }, [lovedPoems]);

  const copyUrl = useCallback(async () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Share"), 1600);
    } catch {
      setShareLabel("Copy failed");
      window.setTimeout(() => setShareLabel("Share"), 1600);
    }
  }, []);

  const lovePoem = useCallback(() => {
    if (!displayRecord || !slug) return;
    setLovedPoems((current) => ({ ...current, [slug]: true }));
    setHeartAnimating(true);
    window.setTimeout(() => setHeartAnimating(false), 680);
    const detail = {
      event: "poem_loved",
      slug,
      title: displayRecord.title,
      url: window.location.href,
    };
    window.dispatchEvent(new CustomEvent("poem:loved", { detail }));
    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
    dataLayer?.push(detail);
  }, [displayRecord, slug]);

  const closeCommentDialog = useCallback(() => {
    setCommentOpen(false);
    setCommentStatus(null);
    setCommentSending(false);
  }, []);

  const sendComment = useCallback(() => {
    const message = comment.trim();
    if (!message || !displayRecord || !slug || commentSending) return;
    const detail = {
      event: "poem_commented",
      slug,
      title: displayRecord.title,
      comment: message,
      url: window.location.href,
    };
    window.dispatchEvent(new CustomEvent("poem:comment", { detail }));
    const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
    dataLayer?.push(detail);
    const dialogRoot = document.querySelector<HTMLElement>(".poem-comment-dialog");
    const dialogCard = dialogRoot?.querySelector<HTMLElement>(".dnk-dialog-content-wrapper");
    const sendButton = document.querySelector<HTMLElement>(".poem-reader-comment");
    if (dialogRoot && dialogCard && sendButton) {
      const source = dialogCard.getBoundingClientRect();
      const target = sendButton.getBoundingClientRect();
      dialogRoot.style.setProperty(
        "--comment-send-x",
        `${target.left + target.width / 2 - (source.left + source.width / 2)}px`,
      );
      dialogRoot.style.setProperty(
        "--comment-send-y",
        `${target.top + target.height / 2 - (source.top + source.height / 2)}px`,
      );
      dialogRoot.style.setProperty(
        "--comment-send-scale",
        `${Math.max(0.08, target.width / source.width)}`,
      );
    }
    setCommentSending(true);
    setComment("");
    setCommentStatus("Thanks for sharing.");
    window.setTimeout(closeCommentDialog, 720);
  }, [comment, commentSending, displayRecord, slug, closeCommentDialog]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (commentOpen) return;
      if (event.key === "Escape") onClose(activeSlug);
      if (event.key === "ArrowLeft" && poems[currentIndex - 1])
        changeSlug(poems[currentIndex - 1].slug);
      if (event.key === "ArrowRight" && poems[currentIndex + 1])
        changeSlug(poems[currentIndex + 1].slug);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, activeSlug, currentIndex, poems, onClose, changeSlug, commentOpen]);

  const paragraphs = useMemo(
    () => (displayRecord?.body ?? "").split(/\n{2,}/).filter(Boolean),
    [displayRecord?.body],
  );
  const readingMinutes = displayRecord
    ? Math.max(1, Math.ceil(displayRecord.body.split(/\s+/).filter(Boolean).length / 200))
    : 0;
  const isLoved = Boolean(slug && lovedPoems[slug]);
  if (!open) return null;

  return (
    <section
      className={`poem-reader${heartAnimating ? " is-love-feedback" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Poem reader"
    >
      <div className="poem-reader-backdrop" aria-hidden="true" />
      <button
        type="button"
        className="poem-reader-close"
        onClick={() => onClose(activeSlug)}
        aria-label="Close reader (ESC)"
        title="Close (ESC)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
        </svg>
      </button>
      <div className="poem-reader-shell">
        <header className="poem-reader-header">
          <p className="poem-reader-kicker">
            <span className="poem-reader-kicker-full">Denny K. Schuldt · </span>Poems
          </p>
          <div className="poem-reader-header-actions">
            <button
              type="button"
              className={`poem-reader-comment${commentSending ? " is-sending" : ""}`}
              onClick={() => setCommentOpen(true)}
              disabled={!displayRecord || commentSending}
              aria-label="Comment on this poem"
              title="Send a comment"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 3-7.2 17-3.9-7.9L2 8.2 21 3Z" />
                <path d="m9.9 12.1 11.1-9.1" />
              </svg>
            </button>
            <button
              type="button"
              className={`poem-reader-love${isLoved ? " is-loved" : ""}${heartAnimating ? " is-animating" : ""}`}
              onClick={lovePoem}
              disabled={!displayRecord}
              aria-label={isLoved ? "Poem loved" : "Love this poem"}
              aria-pressed={isLoved}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.84 8.61c0 5.07-8.84 10.39-8.84 10.39S3.16 13.68 3.16 8.61A4.61 4.61 0 0 1 12 6.05a4.61 4.61 0 0 1 8.84 2.56Z" />
              </svg>
            </button>
            <button
              type="button"
              className="poem-reader-share"
              onClick={copyUrl}
              aria-label="Copy poem URL"
            >
              {shareLabel}
            </button>
            <button
              type="button"
              className="poem-reader-mobile-close"
              onClick={() => onClose(activeSlug)}
              aria-label="Close reader"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
              </svg>
            </button>
          </div>
        </header>
        <main ref={contentRef} className="poem-reader-content" tabIndex={-1}>
          <div className="poem-reader-column" ref={columnRef}>
            {displayRecord && (
              <>
                <p className="poem-reader-date">
                  {readableDate(displayRecord.date)} · {displayRecord.language} · {readingMinutes}{" "}
                  min read
                </p>
                <h1>{displayRecord.title}</h1>
                <div className="poem-reader-rule" />
                <div className="poem-reader-body">
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${displayRecord.slug}-${index}`}>{paragraph}</p>
                  ))}
                </div>
                {displayRecord.imageUrl && (
                  <img
                    className="poem-reader-image"
                    src={displayRecord.imageUrl}
                    alt={`Artwork for ${displayRecord.title}`}
                    loading="lazy"
                  />
                )}
              </>
            )}
            {!displayRecord && <p className="poem-reader-status">Loading poem…</p>}
          </div>
        </main>
        <button
          type="button"
          className={`poem-reader-scroll-hint${hasMoreBelow && !scrollHintSeen ? " is-visible" : ""}`}
          aria-label="Scroll down"
          aria-hidden={!(hasMoreBelow && !scrollHintSeen)}
          tabIndex={hasMoreBelow && !scrollHintSeen ? 0 : -1}
          onClick={() => {
            if (contentRef.current) smoothScrollBy(contentRef.current, 320, 900);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 10l6 6 6-6" />
          </svg>
        </button>
        <footer className="poem-reader-footer">
          <button
            type="button"
            disabled={!poems[currentIndex - 1]}
            onClick={() => poems[currentIndex - 1] && changeSlug(poems[currentIndex - 1].slug)}
          >
            Previous
          </button>
          <span>{poems.length ? `${currentIndex + 1} / ${poems.length}` : ""}</span>
          <button
            type="button"
            disabled={!poems[currentIndex + 1]}
            onClick={() => poems[currentIndex + 1] && changeSlug(poems[currentIndex + 1].slug)}
          >
            Next
          </button>
        </footer>
      </div>
      {commentOpen && (
        <Dialog
          title={`A note about ${displayRecord?.title ?? "this poem"}`}
          className={`poem-comment-dialog${commentSending ? " is-sending" : ""}`}
          draggable
          cancelableOutside
          closeOnEscPress
          cancelText="Cancel"
          onCancelClick={closeCommentDialog}
          confirmText="Send comment"
          confirmDisabled={!comment.trim()}
          onConfirmClick={sendComment}
          onCloseClick={closeCommentDialog}
        >
          <form
            className="poem-comment-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendComment();
            }}
          >
            <label htmlFor="poem-comment-text">What stayed with you?</label>
            <textarea
              id="poem-comment-text"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Write a note about this poem…"
              rows={6}
              autoFocus
            />
            {commentStatus && (
              <p className="poem-comment-status" role="status">
                {commentStatus}
              </p>
            )}
          </form>
        </Dialog>
      )}
    </section>
  );
}
