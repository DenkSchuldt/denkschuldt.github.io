"use client";

import { useEffect, useRef } from "react";

import { withSceneBasePath } from "../camera/sceneRoutes";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Same links the site's pre-3D "Socials" section used, carried over as-is.
const SOCIAL_LINKS: readonly { label: string; href: string }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/denny-schuldt/" },
  { label: "GitHub", href: "https://github.com/DenkSchuldt" },
  { label: "Instagram", href: "https://www.instagram.com/denkschuldt/" },
  { label: "X", href: "https://twitter.com/DenkSchuldt" },
  { label: "Medium", href: "https://medium.com/@DenkSchuldt" },
];

// Same UI as CertificateGalleryOverlay (reuses its CSS classes verbatim) for
// a single, unrelated photo — no slug/collection/prev-next data model, so
// it's its own small component rather than stretching the certificate
// gallery's data-driven navigation to fit a one-off image.
export function PhotoLightbox({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    const panel = panelRef.current;
    panel?.addEventListener("keydown", handleKeyDown);
    return () => panel?.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <section
      className="certificate-gallery-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
    >
      <div className="certificate-gallery-panel" ref={panelRef} tabIndex={-1}>
        <header className="certificate-gallery-header">
          <div>
            <p className="certificate-gallery-kicker">About me</p>
          </div>
          <button
            type="button"
            className="certificate-gallery-close"
            onClick={onClose}
            aria-label="Close photo"
            title="Close photo (ESC)"
          >
            <span aria-hidden="true">ESC</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="photo-lightbox-content">
          <figure className="certificate-gallery-figure">
            <a
              href={withSceneBasePath("/me.jpeg")}
              target="_blank"
              rel="noopener noreferrer"
              className="certificate-gallery-image-link"
              aria-label="Open photo in a new tab"
            >
              <img
                src={withSceneBasePath("/me.jpeg")}
                alt="Denny outdoors"
                className="certificate-gallery-image"
                loading="eager"
                decoding="async"
              />
            </a>
            <figcaption className="certificate-gallery-caption">
              <h2>Pinscher and me</h2>
            </figcaption>
          </figure>
          <nav className="photo-lightbox-socials" aria-label="Social media">
            <p className="certificate-gallery-kicker">Find me online</p>
            <ul>
              {SOCIAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
