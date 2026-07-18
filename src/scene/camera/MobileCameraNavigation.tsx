"use client";

import { useEffect,useState } from "react";
import type { FocusCollectionId,SceneId } from "./navigationTypes";
import { getAdjacentScene } from "./sceneRegistry";

interface Props {
  selectedScene:SceneId;
  selectedFocusCollection:FocusCollectionId|null;
  stateRef:React.MutableRefObject<{introComplete:boolean;isTransitioning:boolean}>;
  onNavigate:(scene:SceneId)=>void;
}

export function MobileCameraNavigation({selectedScene,selectedFocusCollection,stateRef,onNavigate}:Props){
  const [ready,setReady]=useState(false);
  useEffect(()=>{const update=()=>setReady(stateRef.current.introComplete);update();const timer=window.setInterval(update,120);return()=>window.clearInterval(timer);},[stateRef]);
  const previous=selectedFocusCollection==="certificates"?"certificates":selectedFocusCollection?null:getAdjacentScene(selectedScene,-1);
  const next=selectedFocusCollection==="certificates"?"projects":selectedFocusCollection?null:getAdjacentScene(selectedScene,1);
  return <nav className="mobile-camera-nav" aria-label="Camera navigation">
    <button type="button" className="liquid-nav-button" aria-label="Previous view" disabled={!ready||!previous} onClick={()=>previous&&onNavigate(previous)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6"/></svg></button>
    <button type="button" className="liquid-nav-button" aria-label="Next view" disabled={!ready||!next} onClick={()=>next&&onNavigate(next)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg></button>
  </nav>;
}
