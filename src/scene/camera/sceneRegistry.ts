import { CERTIFICATES, CERTIFICATE_LAYOUT } from "../objects/certificates.ts";
import type { FocusCollectionDefinition, FocusDirection, FocusItemDefinition, NavigationLocation, SceneDefinition, SceneId } from "./navigationTypes.ts";
import type { Shot, ShotFraming, ShotId } from "./shotTypes.ts";
import { PHONE_LAYOUT, POEMS_FOLDER_LAYOUT, POEMS_PAGE_LAYOUT, poemsAlignedCameraPosition, poemsPageCameraPosition } from "../sceneLayout.ts";

const quietBreathing={positionAmplitude:.002,rotationAmplitude:.00035,speed:.3};
const margins={top:.06,right:.06,bottom:.06,left:.06};
const framing=(position:ShotFraming["position"],lookAt:ShotFraming["lookAt"],fov:number,extra:Partial<ShotFraming>={}):ShotFraming=>({position,lookAt,fov,safeMargins:margins,alignment:"center",...extra});

export const SCENE_REGISTRY:Record<SceneId,SceneDefinition>={
  opening:{id:"opening",label:"Opening",route:"/",subject:"room",cameraTarget:"opening",framing:framing([-3.1,3.35,4.9],[-.15,1.45,-1.35],45),cameraFocus:{enabled:true,focusDistance:.016},transition:{duration:1},responsive:{mobile:{position:[-2.55,3.3,5.75],lookAt:[-.1,1.45,-1.35],fov:50}}},
  about:{id:"about",label:"About me",route:"/about",subject:"paper",cameraTarget:"about",framing:framing([-1.8,3,-.772],[-2,1.25,-1.022],31,{roll:-25,waypoint:[-1.6,2.85,.16],composition:"readable manuscript"}),cameraFocus:{enabled:true,focusDistance:.013,depthOfFieldStrength:0,focusTarget:"paper"},transition:{duration:4.3},revisitTransition:{duration:4.8},returnTransition:{duration:4.8},responsive:{mobile:{position:[-1.897,3.16,-.578],fov:46,roll:0}}},
  certificates:{id:"certificates",label:"Certificates",route:"/certificates",subject:"shelf",cameraTarget:"certificates",framing:framing([-3.75,2.3,1.25],[-3.8,2,-3.58],44,{waypoint:[-1.8,3.15,2.35],composition:"chronological certificate archive"}),cameraFocus:{enabled:true,focusDistance:.026,focusTarget:"certificate"},transition:{duration:5,breathing:quietBreathing},responsive:{mobile:{position:[-3.72,2.35,2.1],lookAt:[-3.8,2,-3.58],fov:52}},focusCollection:"certificates"},
  projects:{id:"projects",label:"Projects",route:"/projects",subject:"laptop",cameraTarget:"projects",framing:framing([-.25,1.82,-.25],[-.55,1.78,-2.3],31,{composition:"interactive MacBook display"}),cameraFocus:{enabled:true,focusDistance:.02,focusTarget:"laptop-screen"},transition:{duration:4.8,arrivalDelay:.12,breathing:quietBreathing},responsive:{mobile:{position:[-.5,1.86,1.7],lookAt:[-.55,1.78,-2.3],fov:44},tablet:{position:[-.25,1.84,.9],lookAt:[-.55,1.78,-2.3],fov:38}},focusCollection:"projects"},
  wall:{id:"wall",label:"Wall",route:"/wall",subject:"wall",cameraTarget:"wall",framing:framing([4.65,3.05,2.45],[2.6,2.85,-3.75],40,{waypoint:[3.8,3.1,3.4]}),cameraFocus:{enabled:true,focusDistance:.028},transition:{duration:5.2,breathing:quietBreathing},responsive:{mobile:{position:[4.1,3.15,3.3],fov:48}},focusCollection:"wall",autoAdvance:{to:"phone",delay:.18}},
  phone:{id:"phone",label:"Phone",route:"/phone",subject:"phone",cameraTarget:"phone",framing:framing(PHONE_LAYOUT.cameraPosition,PHONE_LAYOUT.cameraTarget,29,{waypoint:[.42,2.95,1.2],composition:"near-orthogonal scannable iPhone screen"}),cameraFocus:{enabled:true,focusDistance:.011,depthOfFieldStrength:0,focusTarget:"phone-screen"},transition:{duration:4.2,breathing:{...quietBreathing,positionAmplitude:.0008}},responsive:{mobile:{position:PHONE_LAYOUT.mobileCameraPosition,lookAt:PHONE_LAYOUT.cameraTarget,fov:34},tablet:{position:PHONE_LAYOUT.tabletCameraPosition,lookAt:PHONE_LAYOUT.cameraTarget,fov:31}},focusCollection:"phone"},
  poems:{id:"poems",label:"Poems",route:"/poems",subject:"folder",cameraTarget:"poems",framing:framing(poemsAlignedCameraPosition(3.24,.22),POEMS_FOLDER_LAYOUT.worldCenter,26,{waypoint:poemsAlignedCameraPosition(3.25,1.15),composition:"close stable overhead reading view aligned with writing portfolio"}),cameraFocus:{enabled:true,focusDistance:.012,depthOfFieldStrength:0,focusTarget:"folder-pages"},transition:{duration:4.8,breathing:{positionAmplitude:.00035,rotationAmplitude:.00008,speed:.18}},responsive:{mobile:{position:poemsPageCameraPosition(3.55,.08),lookAt:POEMS_PAGE_LAYOUT.mobileReadingTarget,fov:37,safeMargins:{top:.08,right:.07,bottom:.14,left:.07},composition:"single readable poem page with notebook spine context"},tablet:{position:poemsAlignedCameraPosition(3.72,.2),lookAt:POEMS_FOLDER_LAYOUT.worldCenter,fov:33}},focusCollection:"poems"},
  drawer:{id:"drawer",label:"Drawer",route:null,subject:"drawer",cameraTarget:"drawer",framing:framing([2.85,1.58,1.45],[1.55,.72,-1.52],36,{waypoint:[3.15,1.95,2.4]}),cameraFocus:{enabled:true,focusDistance:.014},transition:{duration:4.5,breathing:{positionAmplitude:.0007,rotationAmplitude:.0001,speed:.2}},responsive:{mobile:{position:[2.55,1.75,2.15],fov:43}}},
};

export const WORKSPACE_PRESENTATION:Shot={id:"workspace",label:"Workspace",route:"/",subject:"desk",framing:framing([-2.35,3.25,4.55],[-.15,1.45,-1.35],44),focus:{enabled:true,focusDistance:.02},transition:{duration:4.8,breathing:quietBreathing},responsive:{mobile:{position:[-2.05,3.25,5.45],lookAt:[-.1,1.45,-1.35],fov:50}}};

function certificateNeighbor(index:number,direction:FocusDirection):string|undefined {
  const item=CERTIFICATE_LAYOUT.find((candidate)=>candidate.index===index);
  if(!item)return undefined;
  if(direction==="left"||direction==="right"){
    const target=CERTIFICATE_LAYOUT.find((candidate)=>candidate.row===item.row&&candidate.column===item.column+(direction==="left"?-1:1));
    return target?CERTIFICATES[target.index].slug:undefined;
  }
  const row=item.row+(direction==="up"?-1:1);
  const candidates=CERTIFICATE_LAYOUT.filter((candidate)=>candidate.row===row).sort((a,b)=>Math.abs(a.x-item.x)-Math.abs(b.x-item.x));
  return candidates[0]?CERTIFICATES[candidates[0].index].slug:undefined;
}

const certificateItems=Object.fromEntries(CERTIFICATE_LAYOUT.map(({index,x,y,row,column})=>{
  const certificate=CERTIFICATES[index];
  // Certificate selection is now presented in an HTML gallery. Keep every
  // item on the shelf's parent shot so changing the active certificate never
  // reframes or zooms the 3D camera.
  const item:FocusItemDefinition={id:certificate.slug,slug:certificate.slug,label:certificate.title,subject:`certificate:${certificate.slug}`,cameraTarget:"certificates",framing:SCENE_REGISTRY.certificates.framing,cameraFocus:SCENE_REGISTRY.certificates.cameraFocus,transition:SCENE_REGISTRY.certificates.transition,neighbors:{left:certificateNeighbor(index,"left"),right:certificateNeighbor(index,"right"),up:certificateNeighbor(index,"up"),down:certificateNeighbor(index,"down")},metadata:{image:certificate.image,date:certificate.date,url:certificate.url,spatial:{x,y,row,column}}};
  return [item.id,item];
}));

const dynamicCollection=(id:"projects"|"wall"|"poems",sceneId:SceneId,cameraTarget:ShotId,routePattern:string):FocusCollectionDefinition=>({id,sceneId,routePattern,cameraTarget,exitBehavior:"start",defaultFraming:SCENE_REGISTRY[sceneId].framing,cameraFocus:SCENE_REGISTRY[sceneId].cameraFocus,transition:SCENE_REGISTRY[sceneId].transition,items:{},orderedItemIds:[],allowDynamicItems:true});

const phoneItems:Record<string,FocusItemDefinition>={
  qr:{id:"qr",slug:"qr",label:"Phone QR",subject:"phone-qr",route:"/phone/qr",cameraTarget:"phone-qr",framing:SCENE_REGISTRY.phone.framing,cameraFocus:SCENE_REGISTRY.phone.cameraFocus,transition:SCENE_REGISTRY.phone.transition,neighbors:{right:"socials"}},
  socials:{id:"socials",slug:"socials",label:"Socials",subject:"socials",route:"/socials",cameraTarget:"socials",framing:SCENE_REGISTRY.phone.framing,cameraFocus:SCENE_REGISTRY.phone.cameraFocus,transition:SCENE_REGISTRY.phone.transition,neighbors:{left:"qr"}},
};

export const FOCUS_COLLECTIONS:Record<string,FocusCollectionDefinition>={
  certificates:{id:"certificates",sceneId:"certificates",routePattern:"/certificates/:slug",cameraTarget:"certificates",exitBehavior:"parent",reframeOnFocus:false,defaultFraming:SCENE_REGISTRY.certificates.framing,cameraFocus:SCENE_REGISTRY.certificates.cameraFocus,transition:SCENE_REGISTRY.certificates.transition,items:certificateItems,orderedItemIds:CERTIFICATES.map(({slug})=>slug)},
  projects:dynamicCollection("projects","projects","project-detail","/projects/:slug"),
  wall:dynamicCollection("wall","wall","movie-detail","/wall/:slug"),
  poems:{...dynamicCollection("poems","poems","poem-detail","/poems/:slug"),reframeOnFocus:false},
  phone:{id:"phone",sceneId:"phone",routePattern:"/phone/:slug",cameraTarget:"phone-qr",exitBehavior:"start",defaultFraming:SCENE_REGISTRY.phone.framing,cameraFocus:SCENE_REGISTRY.phone.cameraFocus,transition:SCENE_REGISTRY.phone.transition,items:phoneItems,orderedItemIds:["qr","socials"]},
};

// Drawer remains part of the world and registry, but is intentionally not a
// guided stop. The camera should pass from Poems back to Opening without
// focusing the drawer.
export const GUIDED_SCENE_IDS:SceneId[]=["opening","about","certificates","projects","wall","phone","poems"];

export function getAdjacentScene(sceneId:SceneId,direction:-1|1,visitedAutoScenes:readonly SceneId[]=[]):SceneId|null {
  // Drawer remains addressable internally, but is no longer a guided stop.
  // If stale state ever lands there, the next action still returns to Opening.
  if(direction>0&&sceneId==="drawer")return "opening";
  const index=GUIDED_SCENE_IDS.indexOf(sceneId);
  if(index<0)return null;
  if(direction>0&&index===GUIDED_SCENE_IDS.length-1)return "opening";
  if(direction>0){
    let nextIndex=index+1;
    while(nextIndex<GUIDED_SCENE_IDS.length){
      const candidate=GUIDED_SCENE_IDS[nextIndex];
      if(!SCENE_REGISTRY[candidate].autoAdvance||!visitedAutoScenes.includes(candidate))return candidate;
      nextIndex+=1;
    }
    return null;
  }
  let previousIndex=index-1;
  while(previousIndex>=0&&SCENE_REGISTRY[GUIDED_SCENE_IDS[previousIndex]].autoAdvance)previousIndex-=1;
  return GUIDED_SCENE_IDS[previousIndex]??null;
}

export function getFocusItem(collectionId:string,itemId:string):FocusItemDefinition|null {
  const collection=FOCUS_COLLECTIONS[collectionId];
  if(!collection)return null;
  const registered=collection.items[itemId];
  if(registered)return registered;
  if(!collection.allowDynamicItems)return null;
  return {id:itemId,slug:itemId,label:itemId,subject:`${collection.sceneId}:${itemId}`,route:collection.routePattern.replace(":slug",itemId),cameraTarget:collection.cameraTarget,framing:collection.defaultFraming,cameraFocus:collection.cameraFocus,transition:collection.transition,neighbors:{}};
}

export function getFocusNeighbor(collectionId:string,itemId:string,direction:FocusDirection):FocusItemDefinition|null {
  const item=getFocusItem(collectionId,itemId);
  const neighbor=item?.neighbors[direction];
  return neighbor?getFocusItem(collectionId,neighbor):null;
}

export function getAdjacentFocus(collectionId:string,itemId:string,direction:-1|1):FocusItemDefinition|null {
  const collection=FOCUS_COLLECTIONS[collectionId];
  if(!collection)return null;
  const index=collection.orderedItemIds.indexOf(itemId);
  const next=index<0?null:collection.orderedItemIds[index+direction];
  return next?getFocusItem(collectionId,next):null;
}

export function locationForScene(sceneId:SceneId,cameraTarget:ShotId=SCENE_REGISTRY[sceneId].cameraTarget):NavigationLocation {
  return {sceneId,focusCollectionId:null,focusItemId:null,cameraTarget};
}

export function locationForFocus(collectionId:string,itemId:string):NavigationLocation|null {
  const collection=FOCUS_COLLECTIONS[collectionId];
  const item=getFocusItem(collectionId,itemId);
  return collection&&item?{sceneId:collection.sceneId,focusCollectionId:collection.id,focusItemId:item.id,cameraTarget:collection.reframeOnFocus===false?SCENE_REGISTRY[collection.sceneId].cameraTarget:item.cameraTarget}:null;
}

export function sceneForCameraTarget(target:ShotId):SceneId {
  if(target==="workspace")return "opening";
  const scene=Object.values(SCENE_REGISTRY).find(({cameraTarget})=>cameraTarget===target);
  if(scene)return scene.id;
  const collection=Object.values(FOCUS_COLLECTIONS).find(({cameraTarget,items})=>cameraTarget===target||Object.values(items).some((item)=>item.cameraTarget===target));
  return collection?.sceneId??"opening";
}
