"use client";

import { useEffect, useState } from "react";
import type { CameraTargetId } from "./cameraTypes";

const LABELS: Record<CameraTargetId,string> = {
  opening:"Opening",
  workspace:"Workspace",
  projects:"Projects",
  poems:"Poems",
  wall:"Wall",
  drawer:"Drawer",
};

export function CameraLocationLabel({ stateRef }: { stateRef:React.MutableRefObject<{requestedTarget:CameraTargetId;isIntroActive:boolean}> }) {
  const [area,setArea]=useState<CameraTargetId>("opening");
  useEffect(()=>{
    const update=()=>{
      const next=stateRef.current.isIntroActive?"opening":stateRef.current.requestedTarget;
      setArea((current)=>current===next?current:next);
    };
    update();
    const timer=window.setInterval(update,120);
    return()=>window.clearInterval(timer);
  },[stateRef]);
  return <div className="camera-location" aria-live="polite">{LABELS[area]}</div>;
}
