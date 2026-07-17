"use client";

import { useEffect, useState } from "react";
import { getAdjacentShot } from "./cameraNavigation";
import type { ShotId } from "./shotTypes";

interface Props {
  selectedShot:ShotId;
  stateRef:React.MutableRefObject<{introComplete:boolean;isTransitioning:boolean}>;
  onNavigate:(shot:ShotId)=>void;
}

export function MobileCameraNavigation({selectedShot,stateRef,onNavigate}:Props) {
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    const update=()=>setReady(stateRef.current.introComplete);
    update();
    const timer=window.setInterval(update,120);
    return()=>window.clearInterval(timer);
  },[stateRef]);
  const previous=getAdjacentShot(selectedShot,-1);
  const next=getAdjacentShot(selectedShot,1);
  const disabled=!ready;
  return <nav className="mobile-camera-nav" aria-label="Camera navigation">
    <button type="button" className="liquid-nav-button" aria-label="Previous view" disabled={disabled||!previous} onClick={()=>previous&&onNavigate(previous)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
    </button>
    <button type="button" className="liquid-nav-button" aria-label="Next view" disabled={disabled||!next} onClick={()=>next&&onNavigate(next)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
    </button>
  </nav>;
}
