"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { CameraNavigationState } from "../camera";
import type { SceneSettings } from "../Scene";
import type { RenderIsolationState } from "../rendering/renderIsolation";
import { RENDERING_INTENT } from "../rendering/renderingIntent";

export { DEFAULT_RENDER_ISOLATION } from "../rendering/renderIsolation";
export type { RenderIsolationState } from "../rendering/renderIsolation";

export interface RenderingDiagnosticsSnapshot {
  viewport:{width:number;height:number;aspect:number;kind:"desktop"|"mobile"};
  renderer:{type:string;webglVersion:string;precision:string;powerPreference:string|null;antialias:boolean|null;alpha:boolean|null;dpr:number;toneMapping:string;exposure:number;outputColorSpace:string;physicallyCorrectLights:boolean|null;useLegacyLights:boolean|null;colorBuffer:string};
  qualityTier:"fixed";
  lights:Array<{name:string;type:string;intensity:number;color:string;position:[number,number,number];distance:number|null;decay:number|null;castShadow:boolean;shadowMapSize:[number,number]|null;bias:number|null;normalBias:number|null}>;
  environment:{present:boolean;intensity:number};
  shadows:{enabled:boolean;type:string};
  postProcessing:{active:boolean;effects:string[];multisampling:number;aoIntensity:number;vignetteDarkness:number;bloomIntensity:number};
  camera:{position:[number,number,number];target:[number,number,number]};
  performance:{drawCalls:number;triangles:number;shadowCasters:number;gpuResources:number};
  isolation:RenderIsolationState;
  mobilePerformanceAdaptations:string[];
}

const toneMappingName=(value:number)=>Object.entries({NoToneMapping:THREE.NoToneMapping,LinearToneMapping:THREE.LinearToneMapping,ReinhardToneMapping:THREE.ReinhardToneMapping,CineonToneMapping:THREE.CineonToneMapping,ACESFilmicToneMapping:THREE.ACESFilmicToneMapping,AgXToneMapping:THREE.AgXToneMapping,NeutralToneMapping:THREE.NeutralToneMapping}).find(([,candidate])=>candidate===value)?.[0]??String(value);
const shadowTypeName=(value:number)=>Object.entries({BasicShadowMap:THREE.BasicShadowMap,PCFShadowMap:THREE.PCFShadowMap,PCFSoftShadowMap:THREE.PCFSoftShadowMap,VSMShadowMap:THREE.VSMShadowMap}).find(([,candidate])=>candidate===value)?.[0]??String(value);
const round=(value:number)=>Math.round(value*10000)/10000;

export function RenderingDiagnosticsProbe({settings,isolation,stateRef,onSnapshot}:{settings:SceneSettings;isolation:RenderIsolationState;stateRef:React.MutableRefObject<CameraNavigationState>;onSnapshot:(snapshot:RenderingDiagnosticsSnapshot)=>void}){
  const {gl,scene,camera,size}=useThree();
  const elapsed=useRef(0);
  useFrame((_,delta)=>{
    elapsed.current+=delta;if(elapsed.current<.4)return;elapsed.current=0;
    const context=gl.getContext();
    const attributes=context.getContextAttributes();
    const lights:RenderingDiagnosticsSnapshot["lights"]=[];
    let shadowCasters=0;
    scene.traverse((object)=>{
      if(object.castShadow)shadowCasters+=1;
      const light=object as THREE.Light&{isLight?:boolean;distance?:number;decay?:number;shadow?:{mapSize?:THREE.Vector2;bias?:number;normalBias?:number}};
      if(!light.isLight||!light.visible)return;
      lights.push({name:light.name||"unnamed",type:light.type,intensity:round(light.intensity),color:`#${light.color.getHexString()}`,position:[round(light.position.x),round(light.position.y),round(light.position.z)],distance:typeof light.distance==="number"?round(light.distance):null,decay:typeof light.decay==="number"?round(light.decay):null,castShadow:light.castShadow,shadowMapSize:light.shadow?.mapSize?[light.shadow.mapSize.x,light.shadow.mapSize.y]:null,bias:typeof light.shadow?.bias==="number"?light.shadow.bias:null,normalBias:typeof light.shadow?.normalBias==="number"?light.shadow.normalBias:null});
    });
    const renderer=gl as THREE.WebGLRenderer&{useLegacyLights?:boolean;physicallyCorrectLights?:boolean};
    const effects=isolation.postProcessing?[isolation.ambientOcclusion&&"N8AO","DepthOfField",isolation.bloom&&"Bloom","HueSaturation",isolation.vignette&&"Vignette"].filter(Boolean) as string[]:[];
    onSnapshot({
      viewport:{width:size.width,height:size.height,aspect:round(size.width/size.height),kind:size.width/size.height<.82?"mobile":"desktop"},
      renderer:{type:gl.constructor.name,webglVersion:String(context.getParameter(context.VERSION)),precision:gl.capabilities.precision,powerPreference:attributes?.powerPreference??null,antialias:attributes?.antialias??null,alpha:attributes?.alpha??null,dpr:gl.getPixelRatio(),toneMapping:toneMappingName(gl.toneMapping),exposure:gl.toneMappingExposure,outputColorSpace:String(gl.outputColorSpace),physicallyCorrectLights:renderer.physicallyCorrectLights??null,useLegacyLights:renderer.useLegacyLights??null,colorBuffer:`rgba(${context.getParameter(context.RED_BITS)},${context.getParameter(context.GREEN_BITS)},${context.getParameter(context.BLUE_BITS)},${context.getParameter(context.ALPHA_BITS)}) depth:${context.getParameter(context.DEPTH_BITS)} stencil:${context.getParameter(context.STENCIL_BITS)}`},
      qualityTier:"fixed",
      lights,
      environment:{present:Boolean(scene.environment),intensity:scene.environment?scene.environmentIntensity:0},
      shadows:{enabled:gl.shadowMap.enabled,type:shadowTypeName(gl.shadowMap.type)},
      postProcessing:{active:isolation.postProcessing,effects,multisampling:isolation.postProcessing&&stateRef.current.requestedTarget==="about"?RENDERING_INTENT.postProcessing.paperMultisampling:0,aoIntensity:isolation.postProcessing&&isolation.ambientOcclusion?RENDERING_INTENT.postProcessing.ambientOcclusionIntensity:0,vignetteDarkness:isolation.postProcessing&&isolation.vignette?RENDERING_INTENT.postProcessing.vignetteDarkness:0,bloomIntensity:isolation.postProcessing&&isolation.bloom?settings.bloom:0},
      camera:{position:[round(camera.position.x),round(camera.position.y),round(camera.position.z)],target:stateRef.current.cameraLookAt.map(round) as [number,number,number]},
      performance:{drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,shadowCasters,gpuResources:gl.info.memory.geometries+gl.info.memory.textures},
      isolation,
      mobilePerformanceAdaptations:[],
    });
  });
  return null;
}

const toggleLabels:Record<keyof RenderIsolationState,string>={postProcessing:"All post-processing",ambientOcclusion:"Ambient occlusion",vignette:"Vignette",bloom:"Bloom",shadows:"Shadows",environmentLighting:"Environment lighting",fillLighting:"Ambient / fill lights",mobilePerformanceAdaptations:"Mobile adaptations"};

export function RenderingDiagnosticsPanel({snapshot,isolation,onChange,mobileViewport,onMobileViewportChange}:{snapshot:RenderingDiagnosticsSnapshot|null;isolation:RenderIsolationState;onChange:(next:RenderIsolationState)=>void;mobileViewport:boolean;onMobileViewportChange:(active:boolean)=>void}){
  const [copied,setCopied]=useState(false);
  if(process.env.NODE_ENV==="production")return null;
  const copy=async()=>{if(!snapshot)return;await navigator.clipboard.writeText(JSON.stringify(snapshot,null,2));setCopied(true);window.setTimeout(()=>setCopied(false),1200);};
  return <details className="rendering-diagnostics">
    <summary>Render diagnostics</summary>
    <div className="rendering-diagnostics-body">
      <div className="rendering-diagnostics-actions"><button type="button" onClick={copy} disabled={!snapshot}>{copied?"Copied":"Copy JSON"}</button></div>
      <fieldset><legend>Comparison</legend><label><input type="checkbox" checked={mobileViewport} onChange={(event)=>onMobileViewportChange(event.target.checked)}/><span>390 × 720 viewport</span></label></fieldset>
      <fieldset><legend>Isolation</legend>{(Object.keys(toggleLabels) as Array<keyof RenderIsolationState>).map((key)=><label key={key}><input type="checkbox" checked={isolation[key]} onChange={(event)=>onChange({...isolation,[key]:event.target.checked})}/><span>{toggleLabels[key]}</span></label>)}</fieldset>
      <pre>{snapshot?JSON.stringify(snapshot,null,2):"Collecting runtime values…"}</pre>
    </div>
  </details>;
}
