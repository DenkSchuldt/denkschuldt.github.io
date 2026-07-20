import test from "node:test";
import assert from "node:assert/strict";
import { createCinematicEngine } from "../packages/cinematic-navigation/dist/core/index.js";
import { createMemoryPersistence } from "../packages/cinematic-navigation/dist/persistence/index.js";

const scene=(id)=>({id,subjectId:`subject:${id}`,cameraTargetId:`camera:${id}`,framing:{id},transition:{duration:1},...(id==="two"?{revisitTransition:{duration:.4},returnTransition:{duration:.6}}:{})});
const item=(id,x,y,neighbors={})=>({id,subjectId:`subject:${id}`,cameraTargetId:"camera:detail",framing:{id},transition:{duration:1},spatial:{x,y},neighbors});
const createEngine=(overrides={})=>createCinematicEngine({
  scenes:[scene("one"),scene("two"),scene("three")],
  focusCollections:[{
    id:"cards",sceneId:"two",cameraTargetId:"camera:detail",framing:{},transition:{},orderedItemIds:["a","b","c"],
    items:[item("a",0,1,{right:"b"}),item("b",1,1,{left:"a",down:"c"}),item("c",1,0,{up:"b"})],
  }],
  guidedSequence:["one","two","three"],guidedWrap:"forward",
  initialLocation:{sceneId:"one",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:one"},
  ...overrides,
});

test("registers scenes, rejects duplicates, and cleans registrations",()=>{
  const engine=createEngine();
  assert.equal(engine.getScene("two").subjectId,"subject:two");
  assert.throws(()=>engine.registerScene(scene("two")),/Duplicate Scene ID/);
  const unregister=engine.registerScene(scene("temporary"));unregister();
  assert.equal(engine.getScene("temporary"),undefined);
});

test("preserves guided order and forward-only looping",()=>{
  const engine=createEngine();
  assert.equal(engine.previousScene(),null);
  assert.equal(engine.nextScene().sceneId,"two");
  assert.equal(engine.nextScene().sceneId,"three");
  assert.equal(engine.nextScene().sceneId,"one");
});

test("enters, moves, and exits Focus without leaving its Scene",()=>{
  const engine=createEngine();engine.goToScene("two");
  assert.equal(engine.enterFocus("cards","a").sceneId,"two");
  assert.equal(engine.moveFocus("right").focusItemId,"b");
  assert.equal(engine.moveFocus("down").focusItemId,"c");
  assert.deepEqual(engine.exitFocus(),{sceneId:"two",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:two"});
});

test("collection exit can resolve to the beginning of the guided sequence",()=>{
  const engine=createEngine({focusCollections:[{
    id:"cards",sceneId:"two",cameraTargetId:"camera:detail",exitBehavior:"start",framing:{},transition:{},orderedItemIds:["a"],items:[item("a",0,0)],
  }]});
  engine.goToScene("two");
  engine.enterFocus("cards","a");
  assert.deepEqual(engine.exitFocus(),{sceneId:"one",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:one"});
  assert.equal(engine.getState().transitionIntent,"return");
});

test("static Focus collections keep the parent camera while changing items",()=>{
  const calls=[];
  const engine=createEngine({
    cameraDriver:{start:(request)=>calls.push(["start",request.cameraTargetId]),redirect:(request)=>calls.push(["redirect",request.cameraTargetId]),cancel:()=>{}},
    focusCollections:[{id:"cards",sceneId:"two",cameraTargetId:"camera:detail",reframeOnFocus:false,framing:{},transition:{},orderedItemIds:["a","b"],items:[item("a",0,0),item("b",1,0)]}],
    initialLocation:{sceneId:"two",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:two"},
  });
  assert.deepEqual(engine.enterFocus("cards","a"),{sceneId:"two",focusCollectionId:"cards",focusItemId:"a",cameraTargetId:"camera:two"});
  assert.deepEqual(engine.moveFocus(1),{sceneId:"two",focusCollectionId:"cards",focusItemId:"b",cameraTargetId:"camera:two"});
  assert.equal(calls.length,0);
  assert.equal(engine.getState().transitionStatus,"idle");
});

test("clearing a static focus keeps the parent camera stable",()=>{
  const calls=[];
  const engine=createEngine({
    cameraDriver:{start:(request)=>calls.push(["start",request.cameraTargetId]),redirect:(request)=>calls.push(["redirect",request.cameraTargetId]),cancel:()=>{}},
    focusCollections:[{id:"cards",sceneId:"two",cameraTargetId:"camera:detail",reframeOnFocus:false,framing:{},transition:{},orderedItemIds:["a"],items:[item("a",0,0)]}],
    initialLocation:{sceneId:"two",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:two"},
  });
  engine.enterFocus("cards","a");
  calls.length=0;
  assert.deepEqual(engine.syncLocation({sceneId:"two",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:two"}),{sceneId:"two",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:two"});
  assert.equal(calls.length,0);
  assert.equal(engine.getState().transitionStatus,"idle");
});

test("explicit neighbors win and spatial fallback selects the closest candidate",()=>{
  const engine=createCinematicEngine({scenes:[scene("gallery")],focusCollections:[{id:"art",sceneId:"gallery",cameraTargetId:"detail",framing:{},transition:{},items:[item("origin",0,0,{right:"far"}),item("near",1,0),item("far",3,0),item("upper",.1,2)]}],initialLocation:{sceneId:"gallery",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:gallery"}});
  engine.enterFocus("art","origin");assert.equal(engine.moveFocus("right").focusItemId,"far");
  engine.enterFocus("art","origin");assert.equal(engine.moveFocus("up").focusItemId,"upper");
});

test("redirects transitions and keeps logical/camera completion explicit",()=>{
  const calls=[];const engine=createEngine({cameraDriver:{start:(request)=>calls.push(["start",request.sceneId]),redirect:(request)=>calls.push(["redirect",request.sceneId]),cancel:()=>calls.push(["cancel"])}});
  engine.goToScene("two");engine.goToScene("three");
  assert.deepEqual(calls,[["start","two"],["redirect","three"]]);
  assert.equal(engine.getState().sceneId,"one");engine.updateTransition(.5);engine.completeTransition();
  assert.equal(engine.getState().sceneId,"three");assert.equal(engine.getState().transitionStatus,"idle");
  engine.interruptTransition();assert.equal(calls.at(-1)[0],"cancel");
});

test("resolves revisit transitions only after a Scene has been reached",()=>{
  const engine=createEngine();
  assert.deepEqual(engine.getState().visitedSceneIds,["one"]);
  assert.deepEqual(engine.resolveSceneTransition("two"),{sceneId:"two",transition:{duration:1},revisit:false,variant:"base"});
  engine.goToScene("two");
  assert.equal(engine.resolveSceneTransition("two").revisit,false);
  engine.completeTransition();
  assert.deepEqual(engine.getState().visitedSceneIds,["one","two"]);
  assert.deepEqual(engine.resolveSceneTransition("two"),{sceneId:"two",transition:{duration:.4},revisit:true,variant:"revisit"});
  engine.returnToScene("one");
  assert.deepEqual(engine.resolveSceneTransition("one"),{sceneId:"one",transition:{duration:.6},revisit:true,variant:"return"});
});

test("persistence is injected and explicit route state remains authoritative",()=>{
  const persistence=createMemoryPersistence();const engine=createEngine({persistence,persistenceKey:"last"});
  engine.goToScene("three");engine.completeTransition();
  const restored=createEngine({persistence,persistenceKey:"last"});restored.syncLocation({sceneId:"two",focusCollectionId:null,focusItemId:null,cameraTargetId:"camera:two"});
  assert.equal(restored.getState().requestedSceneId,"two");
  assert.equal(restored.restoreLastVisitedScene().sceneId,"two");
});

test("invalid registration and navigation fail predictably",()=>{
  assert.throws(()=>createCinematicEngine({scenes:[scene("one")],focusCollections:[{id:"broken",sceneId:"missing",cameraTargetId:"x",framing:{},transition:{}}]}),/Missing parent Scene/);
  const engine=createEngine();assert.throws(()=>engine.goToScene("missing"),/unregistered Scene/);assert.throws(()=>engine.enterFocus("missing","x"),/unregistered collection/);
});
