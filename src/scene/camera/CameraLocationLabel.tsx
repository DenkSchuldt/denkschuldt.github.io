"use client";

import { useEffect, useState } from "react";
import { SHOT_REGISTRY } from "./shotRegistry";
import type { ShotId } from "./shotTypes";

export function CameraLocationLabel({ stateRef }: { stateRef:React.MutableRefObject<{requestedShot:ShotId;introActive:boolean}> }) {
  const [area,setArea]=useState<ShotId>("opening");
  useEffect(()=>{
    const update=()=>{
      const next=stateRef.current.introActive?"opening":stateRef.current.requestedShot;
      setArea((current)=>current===next?current:next);
    };
    update();
    const timer=window.setInterval(update,120);
    return()=>window.clearInterval(timer);
  },[stateRef]);
  return <div className="camera-location" aria-live="polite">{SHOT_REGISTRY[area].label}</div>;
}
