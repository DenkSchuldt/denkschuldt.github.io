import assert from "node:assert/strict";
import test from "node:test";
import { WORKING_SET_DEFINITIONS,WORKING_SET_DESTINATIONS } from "../src/scene/runtime/working-set/definitions.ts";
import { createResolverState,isPreparationGenerationCurrent,resolvePreparationPriority,resolveWorkingSet } from "../src/scene/runtime/working-set/resolver.ts";

const intent=(current,requested=current,transitioning=false,extra={})=>({
  current,requested,transitioning,overlayResourceIds:[],focusedResourceIds:[],visible:true,...extra,
});

test("every cinematic destination has an explicit definition",()=>{
  assert.deepEqual(new Set(WORKING_SET_DESTINATIONS),new Set(["opening","about","certificates","projects","wall","phone","poems","drawer"]));
  for(const definition of Object.values(WORKING_SET_DEFINITIONS)){
    assert.ok(definition.resources.length);
    assert.ok(definition.resources.every((resource)=>resource.owner&&resource.failureFallback));
  }
});

test("current destination is active and navigation target prepares",()=>{
  let state=createResolverState("about");
  state=resolveWorkingSet(state,intent("about","phone",true),"ultra",1000);
  assert.equal(state.destinations.phone.state,"preparing");
  assert.equal(state.destinations.about.state,"sleeping");
});

test("recently departed destination sleeps with bounded retention",()=>{
  let state=createResolverState("phone");
  state=resolveWorkingSet(state,intent("phone","about",true),"mobile",1000);
  state=resolveWorkingSet(state,intent("about"),"mobile",1200);
  assert.equal(state.destinations.phone.state,"sleeping");
  assert.equal(state.destinations.phone.releaseAt,3700);
});

test("retention expiry releases and then returns to ambient",()=>{
  let state=createResolverState("phone");
  state=resolveWorkingSet(state,intent("about"),"fallback",1000);
  assert.equal(state.destinations.phone.state,"releasing");
  state=resolveWorkingSet(state,intent("about"),"fallback",1001);
  assert.equal(state.destinations.phone.state,"ambient");
});

test("rapid A to B to A re-entry cancels release and advances generation",()=>{
  let state=createResolverState("phone");
  state=resolveWorkingSet(state,intent("phone","about",true),"balanced",1000);
  state=resolveWorkingSet(state,intent("about"),"balanced",1100);
  const priorGeneration=state.destinations.phone.generation;
  state=resolveWorkingSet(state,intent("about","phone",true),"balanced",1200);
  assert.equal(state.destinations.phone.state,"preparing");
  assert.equal(state.destinations.phone.releaseAt,null);
  assert.ok(state.destinations.phone.generation>priorGeneration);
});

test("active resources are never released even after an old deadline",()=>{
  let state=createResolverState("phone");
  state.destinations.phone={...state.destinations.phone,releaseAt:1};
  state=resolveWorkingSet(state,intent("phone"),"mobile",99999);
  assert.equal(state.destinations.phone.state,"active");
  assert.equal(state.destinations.phone.releaseAt,null);
});

test("hidden tabs do not advance timed release",()=>{
  let state=createResolverState("phone");
  state=resolveWorkingSet(state,intent("about"),"mobile",1000);
  state=resolveWorkingSet(state,intent("about","about",false,{visible:false}),"mobile",99999);
  assert.equal(state.destinations.phone.state,"sleeping");
});

test("overlay and focus resources outrank destinations",()=>{
  const priorities=resolvePreparationPriority(intent("poems","phone",true,{overlayResourceIds:["poem-markdown"],focusedResourceIds:["poem:selected"]}),"mobile");
  assert.deepEqual(priorities.map(({id})=>id),["poem-markdown","poem:selected","destination:poems","destination:phone"]);
});

test("stale preparation generations cannot activate a new intent",()=>{
  let state=createResolverState("about");
  state=resolveWorkingSet(state,intent("about","phone",true),"ultra",1000);
  const stale=state.destinations.phone.generation;
  state=resolveWorkingSet(state,intent("about","poems",true),"ultra",1100);
  assert.equal(isPreparationGenerationCurrent(state.destinations.phone,stale),false);
});

test("mobile retains fewer resources than ultra and fallback disables retention",()=>{
  assert.ok(WORKING_SET_DEFINITIONS.certificates.retentionMs.mobile<WORKING_SET_DEFINITIONS.certificates.retentionMs.ultra);
  assert.equal(WORKING_SET_DEFINITIONS.certificates.retentionMs.fallback,0);
  assert.equal(WORKING_SET_DEFINITIONS.phone.retentionMs.fallback,0);
});

test("shared resources declare session ownership and are never locally evicted",()=>{
  const shared=Object.values(WORKING_SET_DEFINITIONS).flatMap(({resources})=>resources).filter(({shared})=>shared);
  assert.ok(shared.length);
  assert.ok(shared.every((resource)=>resource.class==="ambient"||resource.class==="persistent-essential"||resource.class==="shared-cache"));
});
