import type { ResolvedShot, Shot, ShotFraming, ShotId, ShotViewport } from "./shotTypes";

const quietBreathing = { positionAmplitude:0.002, rotationAmplitude:0.00035, speed:0.3 };
const margins = { top:.06, right:.06, bottom:.06, left:.06 };
const framing = (position:ShotFraming["position"],lookAt:ShotFraming["lookAt"],fov:number,extra:Partial<ShotFraming>={}):ShotFraming => ({position,lookAt,fov,safeMargins:margins,alignment:"center",...extra});

const baseShots = {
  opening:{id:"opening",label:"Opening",route:"/",subject:"room",framing:framing([-3.1,3.35,4.9],[-.15,1.45,-1.35],45),focus:{enabled:true,focusDistance:.016},transition:{duration:1,breathing:{...quietBreathing,positionAmplitude:.001}},responsive:{mobile:{position:[-2.55,3.3,5.75],lookAt:[-.1,1.45,-1.35],fov:50}}},
  workspace:{id:"workspace",label:"Workspace",route:"/",subject:"desk",framing:framing([-2.35,3.25,4.55],[-.15,1.45,-1.35],44),focus:{enabled:true,focusDistance:.02},transition:{duration:4.8,breathing:quietBreathing},responsive:{mobile:{position:[-2.05,3.25,5.45],lookAt:[-.1,1.45,-1.35],fov:50}}},
  about:{id:"about",label:"About me",route:"/about",subject:"paper",framing:framing([-1.8,3,-.772],[-2,1.25,-1.022],31,{roll:-25,waypoint:[-1.6,2.85,.16],composition:"readable manuscript"}),focus:{enabled:true,focusDistance:.013,depthOfFieldStrength:0,focusTarget:"paper"},transition:{duration:4.3},responsive:{mobile:{position:[-1.897,3.16,-.578],fov:46,roll:0}}},
  projects:{id:"projects",label:"Projects",route:"/projects",subject:"laptop",framing:framing([.35,2.06,3.52],[-.55,1.76,-1.9],37),focus:{enabled:true,focusDistance:.02,focusTarget:"laptop-screen"},transition:{duration:4.8,arrivalDelay:.12,breathing:quietBreathing},responsive:{mobile:{position:[.15,2.25,4.45],lookAt:[-.45,1.72,-1.82],fov:45},tablet:{position:[.45,2.16,3.9],fov:40}}},
  certificates:{id:"certificates",label:"Certificates",route:"/certificates",subject:"shelf",framing:framing([-3.75,2.3,1.25],[-3.8,2,-3.58],44,{waypoint:[-1.8,3.15,2.35],composition:"chronological certificate archive"}),focus:{enabled:true,focusDistance:.026,focusTarget:"certificate"},transition:{duration:5,breathing:quietBreathing},responsive:{mobile:{position:[-3.72,2.35,2.1],lookAt:[-3.8,2,-3.58],fov:52}}},
  poems:{id:"poems",label:"Poems",route:"/poems",subject:"folder",framing:framing([2.1,3.55,.25],[1.55,1.26,-.68],34,{waypoint:[2.55,3.05,2.15]}),focus:{enabled:true,focusDistance:.012,focusTarget:"folder-pages"},transition:{duration:4.6,breathing:{...quietBreathing,positionAmplitude:.0012}},responsive:{mobile:{position:[1.78,3.72,.68],lookAt:[1.55,1.26,-.68],fov:42},tablet:{position:[2,3.62,.48],fov:38}}},
  phone:{id:"phone",label:"Phone",route:"/phone",subject:"phone",framing:framing([.25,2.78,.72],[-.25,1.26,-.73],33,{waypoint:[1.05,2.65,2.1]}),focus:{enabled:true,focusDistance:.011,focusTarget:"phone-screen"},transition:{duration:4.2,breathing:{...quietBreathing,positionAmplitude:.0008}},responsive:{mobile:{position:[.1,3.1,1.15],fov:41}}},
  wall:{id:"wall",label:"Wall",route:"/wall",subject:"wall",framing:framing([4.65,3.05,2.45],[2.6,2.85,-3.75],40,{waypoint:[3.8,3.1,3.4]}),focus:{enabled:true,focusDistance:.028},transition:{duration:5.2,breathing:quietBreathing},responsive:{mobile:{position:[4.1,3.15,3.3],fov:48}}},
  drawer:{id:"drawer",label:"Drawer",route:null,subject:"drawer",framing:framing([2.85,1.58,1.45],[1.55,.72,-1.52],36,{waypoint:[3.15,1.95,2.4]}),focus:{enabled:true,focusDistance:.014},transition:{duration:4.5,breathing:{positionAmplitude:.0007,rotationAmplitude:.0001,speed:.2}},responsive:{mobile:{position:[2.55,1.75,2.15],fov:43}},guided:true},
} satisfies Partial<Record<ShotId,Shot>>;

const detail = (id:ShotId,label:string,route:string,source:keyof typeof baseShots,subject:string):Shot => ({...baseShots[source],id,label,route,subject});

export const SHOT_REGISTRY:Record<ShotId,Shot> = {
  ...baseShots,
  "project-detail":detail("project-detail","Project detail","/projects/:slug","projects","project-detail"),
  "certificate-detail":{...detail("certificate-detail","Certificate detail","/certificates/:slug","certificates","certificate-detail"),framing:framing([-3.8,2,-1.45],[-3.8,2,-3.58],27,{composition:"cursor-controlled certificate inspection"}),focus:{enabled:true,focusDistance:.012,depthOfFieldStrength:0,focusTarget:"certificate"},transition:{duration:3.2}},
  "poem-detail":detail("poem-detail","Poem detail","/poems/:slug","poems","poem-detail"),
  "phone-qr":detail("phone-qr","Phone QR","/phone/qr","phone","phone-qr"),
  socials:detail("socials","Socials","/socials","phone","socials"),
  "movie-detail":detail("movie-detail","Movie detail","/wall/:slug","wall","movie-detail"),
};

export const INTRO_DESTINATION:ShotId="about";
export const INTRO_PAN_SHOT:ShotId="workspace";
export const GUIDED_SHOT_IDS:ShotId[]=["about","certificates","projects","wall","phone","poems","drawer"];

export function getShotViewport(aspect:number):ShotViewport { return aspect<.82?"mobile":aspect<1.45?"tablet":"desktop"; }

export function resolveShot(id:ShotId,aspect:number):ResolvedShot {
  const shot=SHOT_REGISTRY[id];
  if(!shot) throw new Error(`Unknown shot: ${id}`);
  const viewport=getShotViewport(aspect);
  const override=shot.responsive?.[viewport];
  return {...shot,viewport,framing:{...shot.framing,...override,safeMargins:override?.safeMargins??shot.framing.safeMargins}};
}

export function validateShotRegistry() {
  if(process.env.NODE_ENV==="production") return;
  Object.values(SHOT_REGISTRY).forEach((shot)=>{
    const valid=(value:number[])=>value.length===3&&value.every(Number.isFinite);
    if(!valid(shot.framing.position)||!valid(shot.framing.lookAt)) console.warn(`Malformed framing for ${shot.id}`);
    if(!(shot.transition.duration>0)) console.warn(`Invalid transition for ${shot.id}`);
    if(shot.id==="drawer"&&shot.route!==null) console.warn("Drawer shot must not own a route");
  });
}
