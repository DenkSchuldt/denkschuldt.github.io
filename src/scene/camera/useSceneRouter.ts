"use client";

import { useCallback, useEffect, useState } from "react";
import { parseScenePath, withSceneBasePath, withoutSceneBasePath } from "./sceneRoutes";
import type { ShotId } from "./shotTypes";

const currentPath=()=>typeof window==="undefined"?"/":withoutSceneBasePath(window.location.pathname);

export function useSceneRouter() {
  const [route,setRoute]=useState(()=>parseScenePath(currentPath()));
  useEffect(()=>{
    const sync=()=>{
      const path=currentPath();
      setRoute(parseScenePath(path));
    };
    window.addEventListener("popstate",sync);
    sync();
    return()=>window.removeEventListener("popstate",sync);
  },[]);
  const navigate=useCallback((path:string,shotOverride?:ShotId)=>{
    const browserPath=withSceneBasePath(path);
    if(path===currentPath()){
      const parsed=parseScenePath(path);
      setRoute(shotOverride?{...parsed,shot:shotOverride,target:shotOverride}:parsed);
      return;
    }
    // Projects is the landing shot. Keep the opening immediately behind it in
    // the in-world history, regardless of which section discovered it.
    if(path==="/projects"&&currentPath()!=="/") {
      window.history.pushState({scene:"opening"},"",withSceneBasePath("/"));
    }
    window.history.pushState({},"",browserPath);
    const parsed=parseScenePath(path);
    setRoute(shotOverride?{...parsed,shot:shotOverride,target:shotOverride}:parsed);
  },[]);
  return {...route,navigate,goToRoute:navigate};
}
