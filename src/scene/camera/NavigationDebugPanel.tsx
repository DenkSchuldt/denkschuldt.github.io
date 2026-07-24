"use client";

import { useEffect,useState } from "react";
import type { CameraNavigationState } from "./navigationTypes";

export function NavigationDebugPanel({visible,stateRef,boundsVisible}:{visible:boolean;stateRef:React.MutableRefObject<CameraNavigationState>;boundsVisible:boolean}){
  const [snapshot,setSnapshot]=useState<CameraNavigationState|null>(null);
  useEffect(()=>{
    if(!visible)return;
    const update=()=>setSnapshot({...stateRef.current});
    update();const timer=window.setInterval(update,120);return()=>window.clearInterval(timer);
  },[visible,stateRef]);
  if(!visible||!snapshot)return null;
  const vector=(value:[number,number,number])=>value.map((part)=>part.toFixed(2)).join(", ");
  return <aside className="navigation-debug" aria-label="Navigation debug information">
    <dl>
      <dt>Scene</dt><dd>{snapshot.sceneId}</dd>
      <dt>Collection</dt><dd>{snapshot.focusCollectionId??"—"}</dd>
      <dt>Focus</dt><dd>{snapshot.focusItemId??"—"}</dd>
      <dt>Target</dt><dd>{snapshot.cameraTarget}</dd>
      <dt>Camera</dt><dd>{vector(snapshot.cameraPosition)}</dd>
      <dt>LookAt</dt><dd>{vector(snapshot.cameraLookAt)}</dd>
      <dt>Transition</dt><dd>{snapshot.transitionState} · {Math.round(snapshot.transitionProgress*100)}%</dd>
      <dt>Responsive</dt><dd>{snapshot.viewport}</dd>
      <dt>Bounds</dt><dd>{boundsVisible?"visible":"hidden"}</dd>
    </dl>
  </aside>;
}
