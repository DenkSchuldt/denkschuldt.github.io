import type { PreliminaryCapabilities,RenderingCapabilitySnapshot } from "./types";

const deviceMemory=()=>typeof navigator!=="undefined"&&"deviceMemory" in navigator?(navigator as Navigator&{deviceMemory?:number}).deviceMemory??null:null;
export function detectPreliminaryCapabilities():PreliminaryCapabilities {
  if(typeof window==="undefined")return {viewportWidth:1280,viewportHeight:720,devicePixelRatio:1,estimatedPixelCount:921600,coarsePointer:false,touchPoints:0,reducedMotion:false,hardwareConcurrency:null,deviceMemoryGb:null,iosHint:false};
  const viewportWidth=window.innerWidth,viewportHeight=window.innerHeight,devicePixelRatio=window.devicePixelRatio||1;
  const ua=navigator.userAgent;
  return {viewportWidth,viewportHeight,devicePixelRatio,estimatedPixelCount:viewportWidth*viewportHeight*Math.min(devicePixelRatio,1.6)**2,coarsePointer:window.matchMedia("(pointer: coarse)").matches,touchPoints:navigator.maxTouchPoints??0,reducedMotion:window.matchMedia("(prefers-reduced-motion: reduce)").matches,hardwareConcurrency:navigator.hardwareConcurrency??null,deviceMemoryGb:deviceMemory(),iosHint:/iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&(navigator.maxTouchPoints??0)>1)};
}

export function captureRenderingCapabilities(gl:WebGLRenderingContext|WebGL2RenderingContext,input:PreliminaryCapabilities,resolvedDpr:number,drawingBufferWidth:number,drawingBufferHeight:number,precision:string):RenderingCapabilitySnapshot {
  const debug=gl.getExtension("WEBGL_debug_renderer_info") as {UNMASKED_VENDOR_WEBGL:number;UNMASKED_RENDERER_WEBGL:number}|null;
  const anisotropy=gl.getExtension("EXT_texture_filter_anisotropic") as {MAX_TEXTURE_MAX_ANISOTROPY_EXT:number}|null;
  return {...input,webglVersion:typeof WebGL2RenderingContext!=="undefined"&&gl instanceof WebGL2RenderingContext?2:1,maximumTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),maximumRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),maximumTextureUnits:gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),maximumAnisotropy:anisotropy?gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT):1,fragmentPrecision:precision,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,vendor:debug?gl.getParameter(debug.UNMASKED_VENDOR_WEBGL):null,resolvedDpr,drawingBufferWidth,drawingBufferHeight,capturedAt:new Date().toISOString()};
}
