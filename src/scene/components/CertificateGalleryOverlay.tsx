"use client";

import { useEffect, useMemo, useRef } from "react";
import { CERTIFICATES } from "../objects/certificates";
import { withSceneBasePath } from "../camera/sceneRoutes";
import { useWorkingSetStore } from "../runtime/working-set";

interface Props {
  open: boolean;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onClose: () => void;
}

function GalleryArrow({ direction }: { direction: "previous" | "next" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === "previous" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} /></svg>;
}

/**
 * The certificate shelf remains a lightweight 3D scene. Full certificate
 * artwork is intentionally presented here, one image at a time, so browsing
 * never asks the camera to reframe or the GPU to keep every full-size image
 * resident in the scene.
 */
export function CertificateGalleryOverlay({ open, selectedSlug, onSelect, onClose }: Props) {
  const workingSet=useWorkingSetStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedIndex = useMemo(() => {
    const index = CERTIFICATES.findIndex(({ slug }) => slug === selectedSlug);
    return index < 0 ? 0 : index;
  }, [selectedSlug]);
  const certificate = CERTIFICATES[selectedIndex];
  const previous = CERTIFICATES[selectedIndex - 1];
  const next = CERTIFICATES[selectedIndex + 1];
  useEffect(()=>{
    if(!open||!certificate)return;
    workingSet.resourceEvent("prepare-start","certificate-original",{status:"preparing",cache:"browser",detail:certificate.image});
    return()=>workingSet.resourceEvent("release","certificate-original",{status:"released",cache:"browser",detail:"HTMLImageElement unmounted/reference released; browser decode/cache memory not observable",evidence:["unmounted","references-released","browser-memory-unverified","gpu-memory-unverified"]});
  },[certificate,open,workingSet]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        if (previous) onSelect(previous.slug);
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        if (next) onSelect(next.slug);
      }
    };
    panelRef.current?.addEventListener("keydown", handleKeyDown);
    return () => panelRef.current?.removeEventListener("keydown", handleKeyDown);
  }, [next, onClose, onSelect, open, previous]);

  if (!open || !certificate) return null;

  return <section className="certificate-gallery-overlay" role="dialog" aria-modal="true" aria-label="Certificate gallery">
    <div className="certificate-gallery-panel" ref={panelRef} tabIndex={-1}>
      <header className="certificate-gallery-header">
        <div>
          <p className="certificate-gallery-kicker">Certificates</p>
          <p className="certificate-gallery-count" aria-live="polite">{selectedIndex + 1} / {CERTIFICATES.length}</p>
        </div>
        <button type="button" className="certificate-gallery-close" onClick={onClose} aria-label="Close certificates" title="Close certificates (ESC)">
          <span aria-hidden="true">ESC</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div className="certificate-gallery-content">
        <button type="button" className="certificate-gallery-nav certificate-gallery-nav-previous" onClick={() => previous && onSelect(previous.slug)} disabled={!previous} aria-label="Previous certificate">
          <GalleryArrow direction="previous" />
        </button>
        <figure className="certificate-gallery-figure">
          <a href={certificate.url} target="_blank" rel="noopener noreferrer" className="certificate-gallery-image-link" aria-label={`Open ${certificate.title} certificate in a new tab`}>
            <img src={withSceneBasePath(`/certificates/${certificate.image}`)} alt={certificate.title} className="certificate-gallery-image" loading="eager" decoding="async" onLoad={()=>workingSet.resourceEvent("prepare-end","certificate-original",{status:"resident",cache:"browser",detail:certificate.image})} onError={()=>workingSet.resourceEvent("error","certificate-original",{status:"error",cache:"browser",detail:certificate.image})}/>
          </a>
          <figcaption className="certificate-gallery-caption">
            <div>
              <h2>{certificate.title}</h2>
              <p>{certificate.date}</p>
            </div>
            <a href={certificate.url} target="_blank" rel="noopener noreferrer" className="certificate-gallery-open">Open certificate <span aria-hidden="true">↗</span></a>
          </figcaption>
        </figure>
        <button type="button" className="certificate-gallery-nav certificate-gallery-nav-next" onClick={() => next && onSelect(next.slug)} disabled={!next} aria-label="Next certificate">
          <GalleryArrow direction="next" />
        </button>
      </div>
    </div>
  </section>;
}
