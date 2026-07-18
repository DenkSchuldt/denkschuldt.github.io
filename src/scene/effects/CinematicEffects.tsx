"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom,DepthOfField,EffectComposer,HueSaturation,N8AO,Vignette } from "@react-three/postprocessing";
import { useRef } from "react";
import type { SceneSettings } from "../Scene";
import type { RenderIsolationState } from "../rendering/renderIsolation";
import { RENDERING_INTENT } from "../rendering/renderingIntent";

export default function CinematicEffects({s,focusRef,readingMode,isolation}:{s:SceneSettings;focusRef:React.MutableRefObject<number>;readingMode:boolean;isolation:RenderIsolationState}){
  const dof=useRef<unknown>(null);
  useFrame(()=>{
    const effect=dof.current as {circleOfConfusionMaterial?:{uniforms?:{focusDistance?:{value:number}}}}|null;
    const uniform=effect?.circleOfConfusionMaterial?.uniforms?.focusDistance;
    if(uniform)uniform.value=focusRef.current;
  });
  if(!isolation.postProcessing)return null;
  return <EffectComposer multisampling={0}>
    {isolation.ambientOcclusion?<N8AO aoRadius={1.7} intensity={RENDERING_INTENT.postProcessing.ambientOcclusionIntensity} distanceFalloff={1.2}/>:null}
    <DepthOfField ref={dof} focusDistance={s.focusDistance} focalLength={.035} bokehScale={readingMode?0:s.dof} height={480}/>
    {isolation.bloom?<Bloom intensity={readingMode?0:s.bloom} luminanceThreshold={.84} luminanceSmoothing={.18} mipmapBlur/>:null}
    <HueSaturation hue={-.012} saturation={-.12}/>
    {isolation.vignette?<Vignette eskil={false} offset={.32} darkness={RENDERING_INTENT.postProcessing.vignetteDarkness}/>:null}
  </EffectComposer>;
}
