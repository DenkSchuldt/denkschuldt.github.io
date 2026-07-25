import { RENDERING_QUALITY_PROFILES } from "./profiles.ts";
import type { DiagnosticQualityOverrides,PreliminaryCapabilities,QualityPreference,QualityProfileId,QualitySelection } from "./types.ts";

export const QUALITY_PREFERENCE_STORAGE_KEY="portfolio:rendering-quality:v1";
export const isQualityProfileId=(value:unknown):value is QualityProfileId=>typeof value==="string"&&value in RENDERING_QUALITY_PROFILES;
export const parseQualityPreference=(value:unknown):QualityPreference=>value==="auto"||isQualityProfileId(value)&&value!=="fallback"?value:"auto";

export function parseDiagnosticQualityOverrides(search:string):DiagnosticQualityOverrides {
  const params=new URLSearchParams(search),rawProfile=params.get("perfProfile"),rawDpr=params.get("perfDpr");
  const profile=isQualityProfileId(rawProfile)?rawProfile:null,dpr=rawDpr&&Number.isFinite(Number(rawDpr))?Number(rawDpr):null;
  const disabled=new Set((params.get("perfDisable")??"").split(",").filter(Boolean)),warnings:string[]=[];
  if(rawProfile&&!profile)warnings.push(`Invalid perfProfile '${rawProfile}' ignored.`);
  if(rawDpr&&dpr===null)warnings.push(`Invalid perfDpr '${rawDpr}' ignored.`);
  if(profile&&dpr!==null&&!RENDERING_QUALITY_PROFILES[profile].renderer.dprLevels.includes(dpr))warnings.push(`perfDpr ${dpr} is outside profile ${profile}; it will be clamped.`);
  return {profile,dpr,disabled,warnings};
}

export function selectInitialQuality(input:{diagnostics:DiagnosticQualityOverrides;preference:QualityPreference;capabilities:PreliminaryCapabilities}):QualitySelection {
  const {diagnostics,preference,capabilities}=input;
  if(diagnostics.profile)return {profileId:diagnostics.profile,reason:"diagnostic-override",signals:[`perfProfile=${diagnostics.profile}`],userForced:true,adaptiveAllowed:false};
  if(preference!=="auto")return {profileId:preference,reason:"user-preference",signals:[`stored=${preference}`],userForced:true,adaptiveAllowed:false};
  const pixels=capabilities.estimatedPixelCount,weakMemory=capabilities.deviceMemoryGb!==null&&capabilities.deviceMemoryGb<=4;
  if(pixels>4_000_000)return {profileId:capabilities.coarsePointer||capabilities.iosHint?"mobile":"balanced",reason:"high-pixel-workload",signals:[`estimatedPixels=${Math.round(pixels)}`],userForced:false,adaptiveAllowed:true};
  if(capabilities.coarsePointer||capabilities.touchPoints>1||weakMemory)return {profileId:"mobile",reason:"mobile-capability",signals:[`coarsePointer=${capabilities.coarsePointer}`,`touchPoints=${capabilities.touchPoints}`],userForced:false,adaptiveAllowed:true};
  return {profileId:"ultra",reason:capabilities.reducedMotion?"reduced-motion":"desktop-capability",signals:[`estimatedPixels=${Math.round(pixels)}`,`reducedMotion=${capabilities.reducedMotion}`],userForced:false,adaptiveAllowed:true};
}

export function resolveFeatureFlags(profileId:QualityProfileId,diagnostics:DiagnosticQualityOverrides){
  const profile=RENDERING_QUALITY_PROFILES[profileId],off=diagnostics.disabled;
  return {postProcessing:profile.postprocessing.enabled&&!off.has("post"),ambientOcclusion:profile.postprocessing.ao.enabled&&!off.has("ao"),depthOfField:profile.postprocessing.dof.enabled&&!off.has("dof"),bloom:profile.postprocessing.bloom.enabled&&!off.has("bloom"),grading:profile.postprocessing.grading.enabled&&!off.has("grading"),vignette:profile.postprocessing.vignette.enabled&&!off.has("vignette"),allShadows:profile.shadows.enabled&&!off.has("shadows"),contactShadows:profile.shadows.contactEnabled&&!off.has("contactShadows"),directionalShadow:profile.shadows.directionalEnabled&&!off.has("directionalShadow"),deskShadow:profile.shadows.deskSpotEnabled&&!off.has("deskShadow"),antialias:profile.renderer.antialias&&!off.has("aa"),laptopProjection:!off.has("projection"),coffeeSteam:!off.has("steam"),nonCameraTasks:!off.has("tasks")};
}
export type ResolvedQualityFeatures=ReturnType<typeof resolveFeatureFlags>;
