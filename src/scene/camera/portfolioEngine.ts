import { createCinematicEngine, type CinematicEngine, type FocusCollectionRegistration, type NavigationLocation as EngineLocation, type SceneRegistration } from "@denk/cinematic-navigation";
import type { PersistenceAdapter } from "@denk/cinematic-navigation";
import type { NavigationLocation } from "./navigationTypes";
import { FOCUS_COLLECTIONS, GUIDED_SCENE_IDS, SCENE_REGISTRY } from "./sceneRegistry";
import type { ShotFraming, ShotFramingOverride, ShotTransition, ShotViewport } from "./shotTypes";

type PortfolioResponsive=Partial<Record<ShotViewport,ShotFramingOverride>>;
export type PortfolioNavigationEngine=CinematicEngine<ShotFraming,ShotTransition,PortfolioResponsive>;

const scenes=Object.values(SCENE_REGISTRY).map((scene):SceneRegistration<ShotFraming,ShotTransition,PortfolioResponsive>=>({
  id:scene.id,subjectId:scene.subject,cameraTargetId:scene.cameraTarget,framing:scene.framing,transition:scene.transition,responsive:scene.responsive,focusCollectionId:scene.focusCollection,metadata:{label:scene.label,route:scene.route,cameraFocus:scene.cameraFocus},
}));

const collections=Object.values(FOCUS_COLLECTIONS).map((collection):FocusCollectionRegistration<ShotFraming,ShotTransition>=>({
  id:collection.id,sceneId:collection.sceneId,cameraTargetId:collection.cameraTarget,framing:collection.defaultFraming,transition:collection.transition,orderedItemIds:collection.orderedItemIds,allowDynamicItems:collection.allowDynamicItems,metadata:{routePattern:collection.routePattern,cameraFocus:collection.cameraFocus},
  items:Object.values(collection.items).map((item)=>({id:item.id,subjectId:item.subject,cameraTargetId:item.cameraTarget,framing:item.framing,transition:item.transition,neighbors:item.neighbors,spatial:item.metadata?.spatial as {x:number;y:number;row?:number;column?:number}|undefined,metadata:{...item.metadata,label:item.label,slug:item.slug,route:item.route,cameraFocus:item.cameraFocus}})),
}));

export const toEngineLocation=(location:NavigationLocation):EngineLocation=>({sceneId:location.sceneId,focusCollectionId:location.focusCollectionId,focusItemId:location.focusItemId,cameraTargetId:location.cameraTarget});
export const fromEngineLocation=(location:EngineLocation):NavigationLocation=>({sceneId:location.sceneId as NavigationLocation["sceneId"],focusCollectionId:location.focusCollectionId as NavigationLocation["focusCollectionId"],focusItemId:location.focusItemId,cameraTarget:location.cameraTargetId as NavigationLocation["cameraTarget"]});

export function createPortfolioNavigationEngine(initialLocation:NavigationLocation,persistence?:PersistenceAdapter){
  return createCinematicEngine<ShotFraming,ShotTransition,PortfolioResponsive>({scenes,focusCollections:collections,guidedSequence:GUIDED_SCENE_IDS,guidedWrap:"forward",initialLocation:toEngineLocation(initialLocation),persistence,persistenceKey:"cinematic-room:last-scene",development:process.env.NODE_ENV!=="production"});
}
