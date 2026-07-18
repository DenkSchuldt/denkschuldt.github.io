"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, HueSaturation, N8AO, Vignette } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useRef } from "react";
import { CameraController } from "./camera";
import { Lighting } from "./lighting/Lighting";
import { DebugHelpers } from "./components/DebugHelpers";
import { Room, Desk, Laptop, DeskObjects, Chair, Shelf, Posters, Plant } from "./objects/Primitives";
import { getCertificateFocusBySlug, type CertificateFocus } from "./objects/certificates";
import type { CinematicNavigationSystem } from "./camera";
import { DEFAULT_RENDER_ISOLATION, type RenderIsolationState } from "./diagnostics/RenderingDiagnostics";
import { RENDERING_INTENT } from "./rendering/renderingIntent";

export interface SceneSettings { desk:number; moon:number; moonColor:string; bounce:number; bloom:number; fog:number; exposure:number; dof:number; focusDistance:number; helpers:boolean; laptopPosition:[number,number,number]; laptopRotation:number; folderPosition:[number,number]; folderRotation:number; paperPosition:[number,number]; paperRotation:number; penPosition:[number,number]; penRotation:number; coffeePosition:[number,number,number]; plantPosition:[number,number,number]; plantRotationY:number; lampPosition:[number,number,number] }

function CinematicEffects({ s, focusRef, readingMode, isolation }: { s: SceneSettings; focusRef:React.MutableRefObject<number>; readingMode:boolean; isolation:RenderIsolationState }) {
  const dof=useRef<unknown>(null);
  useFrame(() => {
    const effect=dof.current as {circleOfConfusionMaterial?:{uniforms?:{focusDistance?:{value:number}}}}|null;
    const uniform=effect?.circleOfConfusionMaterial?.uniforms?.focusDistance;
    if (uniform) uniform.value = focusRef.current;
  });
  if(!isolation.postProcessing)return null;
  return <EffectComposer multisampling={0}>
    {isolation.ambientOcclusion?<N8AO aoRadius={1.7} intensity={RENDERING_INTENT.postProcessing.ambientOcclusionIntensity} distanceFalloff={1.2} />:null}
    <DepthOfField ref={dof} focusDistance={s.focusDistance} focalLength={0.035} bokehScale={readingMode?0:s.dof} height={480} />
    {isolation.bloom?<Bloom intensity={readingMode?0:s.bloom} luminanceThreshold={0.84} luminanceSmoothing={0.18} mipmapBlur />:null}
    <HueSaturation hue={-0.012} saturation={-0.12} />
    {isolation.vignette?<Vignette eskil={false} offset={0.32} darkness={RENDERING_INTENT.postProcessing.vignetteDarkness} />:null}
  </EffectComposer>;
}

export function Scene({ s, cameraSystem, certificateSlug, renderIsolation=DEFAULT_RENDER_ISOLATION }: { s: SceneSettings; cameraSystem:CinematicNavigationSystem; certificateSlug?:string;renderIsolation?:RenderIsolationState }) {
  const focusRef=useRef(s.focusDistance);
  const certificateFocusRef=useRef<CertificateFocus|null>(getCertificateFocusBySlug(certificateSlug));
  const focusCertificate=(slug:string)=>{
    certificateFocusRef.current=getCertificateFocusBySlug(slug);
    cameraSystem.previewFocus("certificates",slug);
  };
  const releaseShelf=()=>{
    if(cameraSystem.selectedFocusCollection!=="certificates")return;
    certificateFocusRef.current=null;
    cameraSystem.exitFocus();
  };
  useEffect(()=>{if(cameraSystem.selectedFocusCollection!=="certificates")certificateFocusRef.current=null;},[cameraSystem.selectedFocusCollection]);
  useLayoutEffect(()=>{
    if(cameraSystem.selectedFocusCollection!=="certificates")return;
    certificateFocusRef.current=getCertificateFocusBySlug(certificateSlug)??certificateFocusRef.current;
  },[cameraSystem.selectedFocusCollection,certificateSlug]);
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")releaseShelf();};
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  });
  return <>
  <color attach="background" args={["#070707"]} />
  <fog attach="fog" args={["#111216", 7, s.fog]} />
  <Lighting desk={s.desk} moon={s.moon} moonColor={s.moonColor} bounce={s.bounce} fillEnabled={renderIsolation.fillLighting} shadowsEnabled={renderIsolation.shadows} />
  <CameraController system={cameraSystem} focusRef={focusRef} certificateFocusRef={certificateFocusRef} />
  <Room /><Desk /><Laptop position={s.laptopPosition} rotation={s.laptopRotation} /><DeskObjects coffeePosition={s.coffeePosition} lampPosition={s.lampPosition} folderPosition={s.folderPosition} folderRotation={s.folderRotation} paperPosition={s.paperPosition} paperRotation={s.paperRotation} penPosition={s.penPosition} penRotation={s.penRotation} /><Chair /><Shelf illuminated={cameraSystem.selectedScene==="certificates"} onCertificateHover={focusCertificate} /><Posters /><Plant position={s.plantPosition} rotationY={s.plantRotationY} />
  <DebugHelpers visible={s.helpers} />
  <CinematicEffects s={s} focusRef={focusRef} readingMode={cameraSystem.selectedScene==="about"||cameraSystem.selectedScene==="certificates"||cameraSystem.cameraState.current.introActive} isolation={renderIsolation} />
</>; }
