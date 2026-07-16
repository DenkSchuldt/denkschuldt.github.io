"use client";

import { useCallback, useEffect, useState } from "react";
import { parseScenePath } from "./sceneRoutes";

const currentPath=()=>typeof window==="undefined"?"/":window.location.pathname;
const LAST_SCENE_PATH="cinematic-room:last-path";

export function useSceneRouter() {
  const [route,setRoute]=useState(()=>parseScenePath(currentPath()));
  useEffect(()=>{
    const sync=()=>{
      const path=currentPath();
      window.localStorage.setItem(LAST_SCENE_PATH,path);
      setRoute(parseScenePath(path));
    };
    window.addEventListener("popstate",sync);
    sync();
    return()=>window.removeEventListener("popstate",sync);
  },[]);
  const navigate=useCallback((path:string)=>{
    window.localStorage.setItem(LAST_SCENE_PATH,path);
    if(path===window.location.pathname){
      setRoute(parseScenePath(path));
      return;
    }
    // Projects is the landing shot. Keep the opening immediately behind it in
    // the in-world history, regardless of which section discovered it.
    if(path==="/projects"&&window.location.pathname!=="/") {
      window.history.pushState({scene:"opening"},"","/");
    }
    window.history.pushState({},"",path);
    setRoute(parseScenePath(path));
  },[]);
  return {...route,navigate};
}
