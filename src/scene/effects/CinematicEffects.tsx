"use client";

import { useFrame,useThree } from "@react-three/fiber";
import { Bloom,DepthOfField,EffectComposer,HueSaturation,N8AO,Vignette } from "@react-three/postprocessing";
import { useEffect,useLayoutEffect,useRef,useState } from "react";
import type { EffectComposer as PostprocessingEffectComposer } from "postprocessing";
import type { SceneSettings } from "../Scene";
import type { RenderIsolationState } from "../rendering/renderIsolation";
import { RENDERING_INTENT } from "../rendering/renderingIntent";

function ManagedEffectComposer({paperAntialiasing,children}:{paperAntialiasing:boolean;children:React.ReactNode}){
  const composerRef=useRef<PostprocessingEffectComposer|null>(null);
  useEffect(()=>{
    // @react-three/postprocessing does not dispose its postprocessing composer
    // when the component is unmounted. We intentionally remount it when the
    // render target changes, so capture and release the old target here.
    const composer=composerRef.current;
    return()=>composer?.dispose();
  },[]);
  return <EffectComposer ref={composerRef} multisampling={paperAntialiasing?RENDERING_INTENT.postProcessing.paperMultisampling:0}>{children}</EffectComposer>;
}

export default function CinematicEffects({s,focusRef,readingMode,paperAntialiasing,isolation}:{s:SceneSettings;focusRef:React.MutableRefObject<number>;readingMode:boolean;paperAntialiasing:boolean;isolation:RenderIsolationState}){
  const dof=useRef<unknown>(null);
  const gl=useThree((state)=>state.gl);
  const {width,height}=useThree((state)=>state.size);
  const composerSignature=`${paperAntialiasing?"paper":"base"}:${width}x${height}`;
  const [readySignature,setReadySignature]=useState<string|null>(null);
  useEffect(()=>{setReadySignature(composerSignature);},[composerSignature]);
  const composerReady=readySignature===composerSignature;
  const composerActive=isolation.postProcessing&&composerReady;
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
  // EffectComposer resizes its render target in a passive effect. Unmount it
  // for that single resize frame instead of disabling it: its high-priority
  // render hook otherwise suppresses the normal R3F render and exposes a
  // stale/partial buffer.
  return <ManagedEffectComposer paperAntialiasing={paperAntialiasing}>
    {isolation.ambientOcclusion?<N8AO aoRadius={1.7} intensity={RENDERING_INTENT.postProcessing.ambientOcclusionIntensity} distanceFalloff={1.2}/>:null}
    <DepthOfField ref={dof} focusDistance={s.focusDistance} focalLength={.035} bokehScale={readingMode?0:s.dof} height={480}/>
    {isolation.bloom?<Bloom intensity={readingMode?0:s.bloom} luminanceThreshold={.84} luminanceSmoothing={.18} mipmapBlur/>:null}
    <HueSaturation hue={-.012} saturation={-.12}/>
    {isolation.vignette?<Vignette eskil={false} offset={.32} darkness={RENDERING_INTENT.postProcessing.vignetteDarkness}/>:null}
  </ManagedEffectComposer>;
}
