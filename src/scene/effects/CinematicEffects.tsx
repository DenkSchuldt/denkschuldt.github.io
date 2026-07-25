"use client";

import { useFrame,useThree } from "@react-three/fiber";
import { Bloom,DepthOfField,EffectComposer,HueSaturation,N8AO,Vignette } from "@react-three/postprocessing";
import { useEffect,useLayoutEffect,useRef,type ReactElement } from "react";
import type { DepthOfFieldEffect,EffectComposer as PostprocessingEffectComposer } from "postprocessing";
import type { SceneSettings } from "../Scene";
import type { RenderIsolationState } from "../rendering/renderIsolation";
import { measurePerformanceTask } from "../diagnostics/performance/performanceStore";
import type { RenderingQualityProfile,ResolvedQualityFeatures } from "../rendering/quality";
import { useRenderDemand,useRenderSchedulerStore } from "../runtime/render-scheduler";

function ManagedEffectComposer({children}:{children:ReactElement|ReactElement[]}){
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

export default function CinematicEffects({s,focusRef,readingMode,isolation,profile,features}:{s:SceneSettings;focusRef:React.MutableRefObject<number>;readingMode:boolean;isolation:RenderIsolationState;profile:RenderingQualityProfile;features:ResolvedQualityFeatures}){
  const dof=useRef<DepthOfFieldEffect|null>(null);
  const lastFocus=useRef(Number.NaN);
  const gl=useThree((state)=>state.gl);
  const renderDemand=useRenderDemand("cinematic-effects"),scheduler=useRenderSchedulerStore();
  const composerActive=isolation.postProcessing&&features.postProcessing;
  useLayoutEffect(()=>{
    // EffectComposer takes over R3F's render priority and sets autoClear=false
    // even when its `enabled` prop is false. Restore the base renderer while
    // its render target is being recreated so no stale partial buffer can
    // flash as a white rectangle during a resize or camera-mode change.
    if(!composerActive)gl.autoClear=true;
    return()=>{gl.autoClear=true;};
  },[composerActive,gl]);
  useEffect(()=>renderDemand.acquireFor({reason:"effects-settle",priority:2},500),[composerActive,profile.id,readingMode,renderDemand]);
  useFrame(()=>measurePerformanceTask("CinematicEffectsFocusUpdate",()=>{
    if(!features.depthOfField)return;
    const effect=dof.current as {circleOfConfusionMaterial?:{uniforms?:{focusDistance?:{value:number}}}}|null;
    const uniform=effect?.circleOfConfusionMaterial?.uniforms?.focusDistance;
    if(uniform&&Math.abs(lastFocus.current-focusRef.current)>.000001){uniform.value=focusRef.current;lastFocus.current=focusRef.current;scheduler.recordDof();}
  }));
  if(!composerActive)return null;
  return <ManagedEffectComposer>
    {isolation.ambientOcclusion&&features.ambientOcclusion?<N8AO aoRadius={profile.postprocessing.ao.radius} intensity={profile.postprocessing.ao.intensity} distanceFalloff={profile.postprocessing.ao.distanceFalloff} quality={profile.postprocessing.ao.quality} halfRes={profile.postprocessing.ao.halfResolution}/>:null}
    {features.depthOfField?<DepthOfField ref={dof} focusDistance={s.focusDistance} focalLength={profile.postprocessing.dof.focalLength} bokehScale={readingMode?0:profile.postprocessing.dof.bokehScale} height={profile.postprocessing.dof.height}/>:null}
    {isolation.bloom&&features.bloom?<Bloom intensity={readingMode?0:profile.postprocessing.bloom.intensity} luminanceThreshold={profile.postprocessing.bloom.luminanceThreshold} luminanceSmoothing={profile.postprocessing.bloom.luminanceSmoothing} mipmapBlur={profile.postprocessing.bloom.mipmapBlur}/>:null}
    {features.grading?<HueSaturation hue={profile.postprocessing.grading.hue} saturation={profile.postprocessing.grading.saturation}/>:null}
    {isolation.vignette&&features.vignette?<Vignette eskil={false} offset={profile.postprocessing.vignette.offset} darkness={profile.postprocessing.vignette.darkness}/>:null}
  </ManagedEffectComposer>;
}
