"use client";

import { lazy,Suspense,useEffect,useLayoutEffect,useRef,useState } from "react";
import { useFrame,useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CameraController } from "./camera/CameraController";
import { Lighting } from "./lighting/Lighting";
import { DebugHelpers } from "./components/DebugHelpers";
import { Room, Desk, Laptop, DeskObjects, Chair, Shelf, Posters, Plant } from "./objects/Primitives";
import { getCertificateFocusBySlug, type CertificateFocus } from "./objects/certificates";
import type { CinematicNavigationSystem } from "./camera/useCinematicCamera";
import { DEFAULT_RENDER_ISOLATION,type RenderIsolationState } from "./rendering/renderIsolation";
import type { PoemsContentState } from "./content/usePoems";
import type { ScreenProjectionRef } from "./screenProjection";

const LAPTOP_SCREEN_CORNERS:readonly [THREE.Vector3,THREE.Vector3,THREE.Vector3,THREE.Vector3]=[
  new THREE.Vector3(-.5,.5,0),new THREE.Vector3(.5,.5,0),new THREE.Vector3(.5,-.5,0),new THREE.Vector3(-.5,-.5,0),
];

function LaptopScreenProjection({screenRef,projectionRef}:{screenRef:React.MutableRefObject<THREE.Mesh|null>;projectionRef:ScreenProjectionRef}){
  const {camera,size}=useThree();
  const projected=LAPTOP_SCREEN_CORNERS.map(()=>new THREE.Vector3()) as [THREE.Vector3,THREE.Vector3,THREE.Vector3,THREE.Vector3];
  useFrame(()=>{
    const screen=screenRef.current;
    if(!screen)return;
    screen.updateWorldMatrix(true,false);
    projected.forEach((corner,index)=>{
      corner.copy(LAPTOP_SCREEN_CORNERS[index]).applyMatrix4(screen.matrixWorld).project(camera);
    });
    projectionRef.current={
      points:projected.map(({x,y})=>({x:(x*.5+.5)*size.width,y:(-.5*y+.5)*size.height})) as [
        {x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}
      ],
      viewport:{width:size.width,height:size.height},
    };
  });
  return null;
}

const CinematicEffects=lazy(()=>import("./effects/CinematicEffects"));

export interface SceneSettings { desk:number; moon:number; moonColor:string; bounce:number; bloom:number; fog:number; exposure:number; dof:number; focusDistance:number; helpers:boolean; laptopPosition:[number,number,number]; laptopRotation:number; folderPosition:[number,number]; folderRotation:number; paperPosition:[number,number]; paperRotation:number; penPosition:[number,number]; penRotation:number; coffeePosition:[number,number,number]; plantPosition:[number,number,number]; plantRotationY:number; lampPosition:[number,number,number] }

export function Scene({s,cameraSystem,certificateSlug,poemsContent,onPoemRead,renderIsolation=DEFAULT_RENDER_ISOLATION,onReady,laptopScreenRef,screenProjectionRef}:{s:SceneSettings;cameraSystem:CinematicNavigationSystem;certificateSlug?:string;poemsContent:PoemsContentState;onPoemRead:()=>void;renderIsolation?:RenderIsolationState;onReady?:()=>void;laptopScreenRef:React.MutableRefObject<THREE.Mesh|null>;screenProjectionRef:ScreenProjectionRef}) {
  const focusRef=useRef(s.focusDistance);
  const [effectsReady,setEffectsReady]=useState(false);
  const certificateFocusRef=useRef<CertificateFocus|null>(getCertificateFocusBySlug(certificateSlug));
  const focusCertificate=(slug:string)=>{
    certificateFocusRef.current=getCertificateFocusBySlug(slug);
    cameraSystem.enterFocus("certificates",slug);
  };
  useEffect(()=>{if(cameraSystem.selectedFocusCollection!=="certificates")certificateFocusRef.current=null;},[cameraSystem.selectedFocusCollection]);
  useLayoutEffect(()=>{
    if(cameraSystem.selectedFocusCollection!=="certificates")return;
    certificateFocusRef.current=getCertificateFocusBySlug(certificateSlug)??certificateFocusRef.current;
  },[cameraSystem.selectedFocusCollection,certificateSlug]);
  useEffect(()=>{const frame=window.requestAnimationFrame(()=>onReady?.());const timer=window.setTimeout(()=>setEffectsReady(true),350);return()=>{window.cancelAnimationFrame(frame);window.clearTimeout(timer);};},[onReady]);
  return <>
  <color attach="background" args={["#070707"]} />
  <fog attach="fog" args={["#111216", 7, s.fog]} />
  <Lighting desk={s.desk} moon={s.moon} moonColor={s.moonColor} bounce={s.bounce} fillEnabled={renderIsolation.fillLighting} shadowsEnabled={renderIsolation.shadows} />
  <CameraController system={cameraSystem} focusRef={focusRef} certificateFocusRef={certificateFocusRef} />
  <Room /><Desk /><Laptop position={s.laptopPosition} rotation={s.laptopRotation} screenRef={laptopScreenRef} /><LaptopScreenProjection screenRef={laptopScreenRef} projectionRef={screenProjectionRef}/><DeskObjects coffeePosition={s.coffeePosition} lampPosition={s.lampPosition} folderPosition={s.folderPosition} folderRotation={s.folderRotation} paperPosition={s.paperPosition} paperRotation={s.paperRotation} penPosition={s.penPosition} penRotation={s.penRotation} phoneActive={cameraSystem.selectedScene==="phone"} poemsActive={cameraSystem.selectedScene==="poems"} poemsContent={poemsContent} activePoemSlug={cameraSystem.selectedFocusCollection==="poems"?cameraSystem.selectedFocusItem:null} onPoemRead={onPoemRead} /><Chair /><Shelf illuminated={cameraSystem.selectedScene==="certificates"} onCertificateSelect={focusCertificate} /><Posters/><Plant position={s.plantPosition} rotationY={s.plantRotationY} />
  <DebugHelpers visible={s.helpers} />
  {effectsReady&&<Suspense fallback={null}><CinematicEffects s={s} focusRef={focusRef} readingMode={cameraSystem.selectedScene==="about"||cameraSystem.selectedScene==="certificates"||cameraSystem.cameraState.current.introActive} isolation={renderIsolation}/></Suspense>}
</>; }
