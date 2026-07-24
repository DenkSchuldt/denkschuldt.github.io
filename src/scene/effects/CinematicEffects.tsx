"use client";

import { useFrame,useThree } from "@react-three/fiber";
import { Bloom,DepthOfField,EffectComposer,HueSaturation,N8AO,Vignette } from "@react-three/postprocessing";
import { useEffect,useLayoutEffect,useRef } from "react";
import type { EffectComposer as PostprocessingEffectComposer } from "postprocessing";
import type { SceneSettings } from "../Scene";
import type { RenderIsolationState } from "../rendering/renderIsolation";
import { RENDERING_INTENT } from "../rendering/renderingIntent";

function ManagedEffectComposer({children}:{children:React.ReactNode}){
  const composerRef=useRef<PostprocessingEffectComposer|null>(null);
  useEffect(()=>{
    // @react-three/postprocessing does not dispose its postprocessing composer
    // when the component is unmounted, so release it when post-processing is
    // explicitly disabled or the scene is torn down.
    const composer=composerRef.current;
    return()=>composer?.dispose();
  },[]);
  // Keep the React composer and its render targets stable for the complete
  // session. Reallocating multisampled targets during a shot transition can
  // expose an uninitialised rectangular buffer for one frame. The renderer's
  // own antialiasing remains enabled, so this does not increase global cost.
  return <EffectComposer ref={composerRef} multisampling={0}>{children}</EffectComposer>;
}

export default function CinematicEffects({s,focusRef,readingMode,isolation}:{s:SceneSettings;focusRef:React.MutableRefObject<number>;readingMode:boolean;isolation:RenderIsolationState}){
  const dof=useRef<unknown>(null);
  const gl=useThree((state)=>state.gl);
  const composerActive=isolation.postProcessing;
  useLayoutEffect(()=>{
    // EffectComposer takes over R3F's render priority and sets autoClear=false
    // even when its `enabled` prop is false. Restore the base renderer while
    // its render target is being recreated so no stale partial buffer can
    // flash as a white rectangle during a resize or camera-mode change.
    if(!composerActive)gl.autoClear=true;
    return()=>{gl.autoClear=true;};
  },[composerActive,gl]);
  useFrame(()=>{
    const effect=dof.current as {circleOfConfusionMaterial?:{uniforms?:{focusDistance?:{value:number}}}}|null;
    const uniform=effect?.circleOfConfusionMaterial?.uniforms?.focusDistance;
    if(uniform)uniform.value=focusRef.current;
  });
  if(!composerActive)return null;
  return <ManagedEffectComposer>
    {isolation.ambientOcclusion?<N8AO aoRadius={1.7} intensity={RENDERING_INTENT.postProcessing.ambientOcclusionIntensity} distanceFalloff={1.2}/>:null}
    <DepthOfField ref={dof} focusDistance={s.focusDistance} focalLength={.035} bokehScale={readingMode?0:s.dof} height={480}/>
    {isolation.bloom?<Bloom intensity={readingMode?0:s.bloom} luminanceThreshold={.84} luminanceSmoothing={.18} mipmapBlur/>:null}
    <HueSaturation hue={-.012} saturation={-.12}/>
    {isolation.vignette?<Vignette eskil={false} offset={.32} darkness={RENDERING_INTENT.postProcessing.vignetteDarkness}/>:null}
  </ManagedEffectComposer>;
}
