"use client";

import { useFrame,useThree } from "@react-three/fiber";
import { useEffect,useRef } from "react";
import { evaluateAdaptiveDpr } from "./adaptiveController";
import { captureRenderingCapabilities,detectPreliminaryCapabilities } from "./capabilityDetection";
import { useQualityStore } from "./QualityProvider";
import type { FrameHealthSummary } from "./types";
import { useRenderDemand } from "../../runtime/render-scheduler";

interface Sample {time:number;delta:number}
const percentile=(values:number[],fraction:number)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*fraction)-1))]??0;};

export function QualityRuntimeBridge({transitioning,overlayChanging}:{transitioning:boolean;overlayChanging:boolean}){
  const store=useQualityStore(),{gl,setDpr,size}=useThree();
  const renderDemand=useRenderDemand("quality-runtime");
  const samples=useRef<Sample[]>([]),lastEvaluation=useRef(0),transitioningRef=useRef(transitioning),overlayRef=useRef(overlayChanging);
  transitioningRef.current=transitioning;overlayRef.current=overlayChanging;
  useEffect(()=>{
    const snapshot=store.getSnapshot(),context=gl.getContext();
    store.setCapabilities(captureRenderingCapabilities(context,snapshot.preliminary,gl.getPixelRatio(),gl.domElement.width,gl.domElement.height,gl.capabilities.precision));
    setDpr(snapshot.adaptive.currentDpr);
    renderDemand.invalidate("quality-change");
  },[gl,renderDemand,setDpr,store]);
  useEffect(()=>{samples.current=[];store.resetViewport(detectPreliminaryCapabilities());setDpr(store.getSnapshot().adaptive.currentDpr);renderDemand.invalidate("resize");},[size.width,size.height,renderDemand,setDpr,store]);
  useFrame((_,delta)=>{
    const now=performance.now();
    if(document.visibilityState!=="visible"){samples.current=[];return;}
    samples.current.push({time:now,delta:delta*1000});
    while(samples.current[0]&&now-samples.current[0].time>30000)samples.current.shift();
    if(now-lastEvaluation.current<1000)return;lastEvaluation.current=now;
    const values=samples.current.map(({delta:value})=>value),snapshot=store.getSnapshot(),target=snapshot.profile.runtime.targetFrameMs;
    const health:FrameHealthSummary={medianFrameMs:percentile(values,.5),p95FrameMs:percentile(values,.95),overBudgetRatio:values.length?values.filter((value)=>value>target).length/values.length:0,longestFrameMs:values.length?Math.max(...values):0,sampleDurationMs:samples.current.length?now-samples.current[0].time:0,sampleCount:values.length,targetFrameMs:target,transitioning:transitioningRef.current,visible:true,overlayChanging:overlayRef.current,warmingUp:now<snapshot.adaptive.warmupUntil};
    const result=evaluateAdaptiveDpr(snapshot.adaptive,{now,health,profile:snapshot.profile,autoMode:snapshot.preference==="auto"&&!snapshot.selection.userForced});
    if(result.nextDpr!==null){setDpr(result.nextDpr);samples.current=[];renderDemand.invalidate("quality-change");}
    store.setAdaptive(result.state);
  });
  return null;
}
