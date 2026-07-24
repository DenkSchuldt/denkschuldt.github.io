import test from "node:test";
import assert from "node:assert/strict";
import { createCinematicEngine, createCinematicRuntime } from "../packages/cinematic-navigation/dist/core/index.js";

const scene=(id)=>({id,subjectId:`subject:${id}`,cameraTargetId:`camera:${id}`,framing:{},transition:{duration:1}});
const item=(id)=>({id,subjectId:`subject:${id}`,cameraTargetId:"camera:detail",framing:{},transition:{duration:1}});
const createEngine=()=>createCinematicEngine({
  scenes:[scene("opening"),scene("gallery")],
  focusCollections:[{id:"art",sceneId:"gallery",cameraTargetId:"camera:detail",framing:{},transition:{duration:1},items:[item("one")]}],
  guidedSequence:["opening","gallery"],
  initialLocation:{sceneId:"opening",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:opening"},
});

test("runtime derives persistent, scene, collection, and focus phases from navigation state",()=>{
  const engine=createEngine();
  const runtime=createCinematicRuntime(engine);
  const cleanups=[
    runtime.registerNode({id:"world",scope:"world",mountPolicy:"persistent"}),
    runtime.registerNode({id:"scene:gallery",scope:"scene",sceneId:"gallery",mountPolicy:"persistent"}),
    runtime.registerNode({id:"collection:art",scope:"collection",sceneId:"gallery",collectionId:"art",mountPolicy:"persistent"}),
    runtime.registerNode({id:"focus:one",scope:"focus-item",sceneId:"gallery",collectionId:"art",focusItemId:"one",mountPolicy:"persistent"}),
  ];
  assert.equal(runtime.getNodeState("world").phase,"active");
  assert.equal(runtime.getNodeState("scene:gallery").phase,"sleeping");
  engine.goToScene("gallery");
  assert.equal(runtime.getNodeState("scene:gallery").phase,"transitioning-in");
  assert.equal(runtime.getNodeState("collection:art").phase,"transitioning-in");
  engine.completeTransition();
  assert.equal(runtime.getNodeState("scene:gallery").phase,"active");
  assert.equal(runtime.getNodeState("collection:art").phase,"active");
  engine.enterFocus("art","one");
  assert.equal(runtime.getNodeState("focus:one").phase,"transitioning-in");
  engine.completeTransition();
  assert.equal(runtime.getNodeState("focus:one").phase,"focused");
  cleanups.forEach((cleanup)=>cleanup());
});

test("scheduler only runs tasks for runtime nodes that are updating",()=>{
  const engine=createEngine();
  const runtime=createCinematicRuntime(engine);
  runtime.registerNode({id:"scene:gallery",scope:"scene",sceneId:"gallery",mountPolicy:"persistent"});
  let updates=0;
  runtime.registerTask({id:"task:gallery",nodeId:"scene:gallery",update:()=>{updates+=1;}});
  runtime.update(.016,.016);
  assert.equal(updates,0);
  engine.goToScene("gallery");
  runtime.update(.016,.032);
  assert.equal(updates,1);
  engine.completeTransition();
  runtime.update(.016,.048);
  assert.equal(updates,2);
});

test("lazy nodes dispose while sleeping and mount when requested",()=>{
  const engine=createEngine();
  const runtime=createCinematicRuntime(engine);
  runtime.registerNode({id:"scene:gallery",scope:"scene",sceneId:"gallery",mountPolicy:"lazy",retainOnSleep:false});
  assert.equal(runtime.getNodeState("scene:gallery").phase,"disposed");
  assert.equal(runtime.getNodeState("scene:gallery").mounted,false);
  engine.goToScene("gallery");
  assert.equal(runtime.getNodeState("scene:gallery").phase,"transitioning-in");
  assert.equal(runtime.getNodeState("scene:gallery").mounted,true);
});

test("shared node declarations are reference counted and lifecycle events are coarse",()=>{
  const engine=createEngine();
  const runtime=createCinematicRuntime(engine);
  const node={id:"scene:gallery",scope:"scene",sceneId:"gallery",mountPolicy:"lazy",retainOnSleep:false};
  const phases=[];
  const unsubscribe=runtime.subscribeNode(node.id,(next,previous)=>phases.push([previous?.phase??null,next?.phase??null]));
  const releaseA=runtime.registerNode(node);
  const releaseB=runtime.registerNode({...node});
  engine.goToScene("gallery");
  for(let index=0;index<20;index++)engine.updateTransition(index/20);
  assert.deepEqual(phases.map(([from,to])=>to),["disposed","transitioning-in"]);
  releaseA();
  assert.equal(runtime.getNodeState(node.id)?.phase,"transitioning-in");
  releaseB();
  assert.equal(runtime.getNodeState(node.id),undefined);
  unsubscribe();
});
