"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, HueSaturation, N8AO, Vignette } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";
import { CameraController } from "./camera";
import { Lighting } from "./lighting/Lighting";
import { DebugHelpers } from "./components/DebugHelpers";
import { Room, Desk, Laptop, DeskObjects, Chair, Shelf, Posters, Plant } from "./objects/Primitives";
import { getCertificateFocusBySlug, type CertificateFocus } from "./objects/certificates";

export interface SceneSettings { desk:number; moon:number; moonColor:string; bounce:number; bloom:number; fog:number; exposure:number; dof:number; focusDistance:number; helpers:boolean; laptopPosition:[number,number,number]; laptopRotation:number; folderPosition:[number,number]; folderRotation:number; paperPosition:[number,number]; paperRotation:number; penPosition:[number,number]; penRotation:number; coffeePosition:[number,number,number]; plantPosition:[number,number,number]; plantRotationY:number; lampPosition:[number,number,number] }

function CinematicEffects({ s, focusRef, readingMode }: { s: SceneSettings; focusRef:React.MutableRefObject<number>; readingMode:boolean }) {
  const dof = useRef<any>(null);
  useFrame(({ clock }) => {
    const uniform = dof.current?.circleOfConfusionMaterial?.uniforms?.focusDistance;
    if (uniform) uniform.value = focusRef.current;
  });
  return <EffectComposer multisampling={0}>
    <N8AO aoRadius={1.7} intensity={0.32} distanceFalloff={1.2} />
    <DepthOfField ref={dof} focusDistance={s.focusDistance} focalLength={0.035} bokehScale={readingMode?0:s.dof} height={480} />
    <Bloom intensity={readingMode?0:s.bloom} luminanceThreshold={0.84} luminanceSmoothing={0.18} mipmapBlur />
    <HueSaturation hue={-0.012} saturation={-0.12} />
    <Vignette eskil={false} offset={0.32} darkness={0.22} />
  </EffectComposer>;
}

import * as THREE from "three";
import type { ShotId } from "./camera";
export function Scene({ s, cameraSystem, certificateSlug, onCertificateFocus, onCertificateExit }: { s: SceneSettings; cameraSystem:any; certificateSlug?:string; onCertificateFocus?:(slug:string)=>void; onCertificateExit?:()=>void }) {
  const focusRef=useRef(s.focusDistance);
  const certificateFocusRef=useRef<CertificateFocus|null>(getCertificateFocusBySlug(certificateSlug));
  const shelfReturnShot=useRef<ShotId|null>(null);
  const focusShelf=()=>{
    if(cameraSystem.selectedShot==="certificate-detail")return;
    if(!shelfReturnShot.current)shelfReturnShot.current=cameraSystem.selectedShot;
    cameraSystem.goToShot("certificate-detail");
  };
  const focusCertificate=(focus:CertificateFocus)=>{
    certificateFocusRef.current=focus;
    onCertificateFocus?.(focus.slug);
    focusShelf();
  };
  const releaseShelf=()=>{
    if(cameraSystem.selectedShot!=="certificate-detail")return;
    const previous=shelfReturnShot.current??"certificates";
    shelfReturnShot.current=null;
    certificateFocusRef.current=null;
    onCertificateExit?.();
    cameraSystem.goToShot(previous);
  };
  useEffect(()=>{if(cameraSystem.selectedShot!=="certificate-detail"){shelfReturnShot.current=null;certificateFocusRef.current=null;}},[cameraSystem.selectedShot]);
  useEffect(()=>{
    if(cameraSystem.selectedShot!=="certificate-detail")return;
    certificateFocusRef.current=getCertificateFocusBySlug(certificateSlug)??certificateFocusRef.current;
  },[cameraSystem.selectedShot,certificateSlug]);
  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")releaseShelf();};
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  });
  return <>
  <color attach="background" args={["#070707"]} />
  <fog attach="fog" args={["#111216", 7, s.fog]} />
  <Lighting desk={s.desk} moon={s.moon} moonColor={s.moonColor} bounce={s.bounce} />
  <CameraController system={cameraSystem} focusRef={focusRef} certificateFocusRef={certificateFocusRef} />
  <Room /><Desk /><Laptop position={s.laptopPosition} rotation={s.laptopRotation} /><DeskObjects coffeePosition={s.coffeePosition} lampPosition={s.lampPosition} folderPosition={s.folderPosition} folderRotation={s.folderRotation} paperPosition={s.paperPosition} paperRotation={s.paperRotation} penPosition={s.penPosition} penRotation={s.penRotation} /><Chair /><Shelf onCertificateHover={focusCertificate} /><Posters /><Plant position={s.plantPosition} rotationY={s.plantRotationY} />
  <DebugHelpers visible={s.helpers} />
  <CinematicEffects s={s} focusRef={focusRef} readingMode={cameraSystem.selectedShot==="about"||cameraSystem.selectedShot==="certificates"||cameraSystem.selectedShot==="certificate-detail"||cameraSystem.cameraState.current.introActive} />
</>; }
