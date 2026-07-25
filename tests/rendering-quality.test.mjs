import assert from "node:assert/strict";
import test from "node:test";
import {createAdaptiveState,evaluateAdaptiveDpr} from "../src/scene/rendering/quality/adaptiveController.ts";
import {RENDERING_QUALITY_PROFILES,validateRenderingQualityProfiles} from "../src/scene/rendering/quality/profiles.ts";
import {parseDiagnosticQualityOverrides,parseQualityPreference,resolveFeatureFlags,selectInitialQuality} from "../src/scene/rendering/quality/qualitySelection.ts";

const capabilities={viewportWidth:1280,viewportHeight:720,devicePixelRatio:2,estimatedPixelCount:2359296,coarsePointer:false,touchPoints:0,reducedMotion:false,hardwareConcurrency:8,deviceMemoryGb:8,iosHint:false};
const diagnostics=parseDiagnosticQualityOverrides("");
const health=(patch={})=>({medianFrameMs:17,p95FrameMs:20,overBudgetRatio:.1,longestFrameMs:24,sampleDurationMs:5000,sampleCount:300,targetFrameMs:16.67,transitioning:false,visible:true,overlayChanging:false,warmingUp:false,...patch});

test("quality profiles are valid and fallback is safe",()=>{
  assert.equal(validateRenderingQualityProfiles(),true);
  for(const profile of Object.values(RENDERING_QUALITY_PROFILES))assert.ok(profile.renderer.dprMin<=profile.renderer.dprMax);
  assert.equal(RENDERING_QUALITY_PROFILES.fallback.renderer.dprMax,1);
  assert.equal(RENDERING_QUALITY_PROFILES.fallback.shadows.enabled,false);
  assert.equal(RENDERING_QUALITY_PROFILES.fallback.postprocessing.enabled,false);
});

test("diagnostic and user preferences follow precedence",()=>{
  const user=selectInitialQuality({diagnostics,preference:"high",capabilities});
  assert.equal(user.profileId,"high");assert.equal(user.reason,"user-preference");assert.equal(user.adaptiveAllowed,false);
  const forced=selectInitialQuality({diagnostics:parseDiagnosticQualityOverrides("?perfProfile=mobile"),preference:"ultra",capabilities});
  assert.equal(forced.profileId,"mobile");assert.equal(forced.reason,"diagnostic-override");
  assert.equal(parseQualityPreference("obsolete"),"auto");
});

test("reduced motion stays independent from graphical capability",()=>{
  const selection=selectInitialQuality({diagnostics,preference:"auto",capabilities:{...capabilities,reducedMotion:true}});
  assert.equal(selection.profileId,"ultra");
  assert.equal(selection.reason,"reduced-motion");
});

test("pixel workload and mobile signals can select lower initial profiles",()=>{
  assert.equal(selectInitialQuality({diagnostics,preference:"auto",capabilities:{...capabilities,estimatedPixelCount:5_000_000}}).profileId,"balanced");
  assert.equal(selectInitialQuality({diagnostics,preference:"auto",capabilities:{...capabilities,coarsePointer:true}}).profileId,"mobile");
});

test("query switches override profile features",()=>{
  const parsed=parseDiagnosticQualityOverrides("?perfProfile=ultra&perfDisable=ao,bloom,deskShadow");
  const flags=resolveFeatureFlags("ultra",parsed);
  assert.equal(flags.ambientOcclusion,false);assert.equal(flags.bloom,false);assert.equal(flags.deskShadow,false);assert.equal(flags.depthOfField,true);
});

test("adaptive downgrade requires sustained poor frames and ignores spikes",()=>{
  const profile=RENDERING_QUALITY_PROFILES.ultra,state=createAdaptiveState(1.6,0);
  const spike=evaluateAdaptiveDpr({...state,warmupUntil:0},{now:4000,health:health({p95FrameMs:60,overBudgetRatio:.01,sampleDurationMs:1000}),profile,autoMode:true});
  assert.equal(spike.nextDpr,null);
  const poor=evaluateAdaptiveDpr({...state,warmupUntil:0},{now:4000,health:health({p95FrameMs:24,overBudgetRatio:.5,sampleDurationMs:4000}),profile,autoMode:true});
  assert.equal(poor.nextDpr,1.4);
});

test("upgrade needs longer stability and cooldown prevents oscillation",()=>{
  const profile=RENDERING_QUALITY_PROFILES.ultra,state={...createAdaptiveState(1.25,0),warmupUntil:0};
  const early=evaluateAdaptiveDpr(state,{now:5000,health:health({p95FrameMs:10,overBudgetRatio:0,sampleDurationMs:5000}),profile,autoMode:true});
  assert.equal(early.nextDpr,null);
  const upgraded=evaluateAdaptiveDpr(state,{now:13000,health:health({p95FrameMs:10,overBudgetRatio:0,sampleDurationMs:13000}),profile,autoMode:true});
  assert.equal(upgraded.nextDpr,1.4);
  const cooldown=evaluateAdaptiveDpr(upgraded.state,{now:14000,health:health({p95FrameMs:30,overBudgetRatio:.8,sampleDurationMs:5000}),profile,autoMode:true});
  assert.equal(cooldown.nextDpr,null);
});

test("hidden tabs, transitions and explicit profiles suspend adaptation",()=>{
  const profile=RENDERING_QUALITY_PROFILES.ultra,state={...createAdaptiveState(1.6,0),warmupUntil:0},poor=health({p95FrameMs:30,overBudgetRatio:.8,sampleDurationMs:5000});
  assert.equal(evaluateAdaptiveDpr(state,{now:6000,health:{...poor,visible:false},profile,autoMode:true}).nextDpr,null);
  assert.equal(evaluateAdaptiveDpr(state,{now:6000,health:{...poor,transitioning:true},profile,autoMode:true}).nextDpr,null);
  assert.equal(evaluateAdaptiveDpr(state,{now:6000,health:poor,profile,autoMode:false}).nextDpr,null);
});
