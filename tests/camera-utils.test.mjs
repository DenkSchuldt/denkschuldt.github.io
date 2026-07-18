import test from "node:test";
import assert from "node:assert/strict";
import { cinematicEase, applyReducedMotionDuration } from "../src/scene/camera/cameraEasing.ts";
import { resolveCameraTarget, getViewportKind } from "../src/scene/camera/cameraTargets.ts";
import { allowsCanvasTapNavigation, getAdjacentCameraTarget, getCertificateBrowseOffset, getFocusDirectionForKey, getShotOvershoot, isDrawerOpeningReturn, isOpeningAboutJourney, isReturnToStartKey, isSceneReadyForAutoAdvance, isTrackpadPinchOut, shouldBeginShotTransition, shouldResumeFromStart, shouldSyncRouteShot } from "../src/scene/camera/cameraNavigation.ts";
import { INTRO_DESTINATION, INTRO_PAN_SHOT, SHOT_REGISTRY, resolveShot } from "../src/scene/camera/shotRegistry.ts";
import { parseScenePath, pathForShot } from "../src/scene/camera/sceneRoutes.ts";
import { CERTIFICATES, CERTIFICATE_LAYOUT, getCertificateFocusBySlug } from "../src/scene/objects/certificates.ts";
import { FOCUS_COLLECTIONS, getAdjacentFocus, getAdjacentScene, getFocusNeighbor, GUIDED_SCENE_IDS, locationForFocus, locationForScene, SCENE_REGISTRY } from "../src/scene/camera/sceneRegistry.ts";
import { pathForFocus, pathForScene, resolveNavigationPath, STATIC_FOCUS_ROUTES } from "../src/scene/camera/sceneRoutes.ts";
import { PHONE_LAYOUT, POEMS_FOLDER_LAYOUT } from "../src/scene/sceneLayout.ts";

test("cinematic easing preserves exact endpoints", () => {
  assert.equal(cinematicEase(0), 0);
  assert.equal(cinematicEase(1), 1);
  assert.ok(cinematicEase(.25) < .25);
  assert.ok(cinematicEase(.75) > .75);
});

test("responsive target resolution selects mobile framing", () => {
  assert.equal(getViewportKind(.6), "mobile");
  assert.equal(getViewportKind(1.1), "tablet");
  assert.equal(getViewportKind(1.8), "desktop");
  assert.equal(resolveCameraTarget("projects", .6).fov, 44);
  assert.deepEqual(resolveCameraTarget("about", .6).position, [-1.897, 3.16, -.578]);
  assert.equal(resolveCameraTarget("about", .6).fov, 46);
  assert.equal(resolveCameraTarget("about", .6).roll, 0);
});

test("reduced motion shortens long transitions", () => {
  assert.equal(applyReducedMotionDuration(6, true), .45);
  assert.equal(applyReducedMotionDuration(6, false), 6);
});

test("camera navigation resolves adjacent swipe targets", () => {
  assert.equal(getAdjacentCameraTarget("opening", 1), "about");
  assert.equal(getAdjacentCameraTarget("about", 1), "certificates");
  assert.equal(getAdjacentCameraTarget("certificates", 1), "projects");
  assert.equal(getAdjacentCameraTarget("projects", -1), "certificates");
  assert.equal(getAdjacentCameraTarget("certificate-detail", 1), "projects");
  assert.equal(getAdjacentCameraTarget("certificate-detail", -1), "certificates");
  assert.equal(getAdjacentCameraTarget("about", -1), "opening");
  assert.equal(getAdjacentCameraTarget("drawer", 1), "opening");
  assert.equal(getAdjacentCameraTarget("opening", -1), null);
});

test("canvas taps leave collection objects in control",()=>{
  assert.equal(allowsCanvasTapNavigation("opening"),true);
  assert.equal(allowsCanvasTapNavigation("about"),true);
  assert.equal(allowsCanvasTapNavigation("certificates"),false);
  assert.equal(allowsCanvasTapNavigation("projects"),false);
  assert.equal(allowsCanvasTapNavigation("phone"),false);
});

test("auto Scenes advance only after their camera has settled",()=>{
  assert.deepEqual(SCENE_REGISTRY.wall.autoAdvance,{to:"phone",delay:.18});
  assert.equal(getAdjacentScene("projects",1),"wall");
  assert.equal(getAdjacentScene("projects",1,["wall"]),"phone");
  assert.equal(getAdjacentCameraTarget("projects",1,["wall"]),"phone");
  assert.equal(getAdjacentScene("phone",-1),"projects");
  assert.equal(getAdjacentScene("wall",-1),"projects");
  const settled={sceneId:"wall",requestedScene:"wall",currentTarget:"wall",requestedTarget:"wall",isTransitioning:false,introComplete:true};
  assert.equal(isSceneReadyForAutoAdvance(settled,"wall"),true);
  assert.equal(isSceneReadyForAutoAdvance({...settled,isTransitioning:true},"wall"),false);
  assert.equal(isSceneReadyForAutoAdvance({...settled,requestedScene:"phone"},"wall"),false);
  assert.equal(isSceneReadyForAutoAdvance({...settled,sceneId:"projects",requestedScene:"projects",currentTarget:"projects",requestedTarget:"projects"},"projects"),false);
});

test("Escape always resolves to the Opening starting point",()=>{
  assert.equal(isReturnToStartKey("Escape"),true);
  assert.equal(isReturnToStartKey("Esc"),false);
  assert.equal(isReturnToStartKey(" "),false);
  assert.deepEqual(locationForScene("opening"),{sceneId:"opening",focusCollectionId:null,focusItemId:null,cameraTarget:"opening"});
});

test("only an Escape return resumes the latest scene from Opening",()=>{
  assert.equal(shouldResumeFromStart("projects","opening","about"),true);
  assert.equal(shouldResumeFromStart("projects","opening","projects"),true);
  assert.equal(shouldResumeFromStart(null,"opening","about"),false);
  assert.equal(shouldResumeFromStart("projects","drawer","opening"),false);
  assert.equal(shouldResumeFromStart("projects","opening","certificates"),false);
});

test("opening and About share the same reversible camera journey", () => {
  assert.equal(isOpeningAboutJourney("opening", "about"), true);
  assert.equal(isOpeningAboutJourney("about", "opening"), true);
  assert.equal(isOpeningAboutJourney("about", "projects"), false);
});

test("Drawer returns smoothly to Opening without landing overshoot", () => {
  assert.equal(isDrawerOpeningReturn("drawer", "opening"), true);
  assert.equal(isDrawerOpeningReturn("poems", "opening"), false);
  assert.equal(getShotOvershoot("opening", .018), 0);
});

test("the opening presents workspace from the left and lands on About", () => {
  assert.equal(INTRO_DESTINATION, "about");
  assert.equal(INTRO_PAN_SHOT, "workspace");
  assert.ok(resolveShot("opening", 1.8).framing.position[0] < resolveShot("workspace", 1.8).framing.position[0]);
  assert.ok(resolveShot("workspace", 1.8).framing.position[0] < resolveShot("about", 1.8).framing.position[0]);
  assert.equal(getShotOvershoot("about", .018), 0);
  assert.equal(getShotOvershoot("workspace", .018), .018);
});

test("shot registry owns routes and preserves the golden About framing", () => {
  assert.equal(SHOT_REGISTRY.drawer.route, null);
  assert.equal(pathForShot("drawer"), null);
  assert.equal(parseScenePath("/projects/atlas").shot, "project-detail");
  assert.equal(parseScenePath("/phone/qr").shot, "phone-qr");
  assert.deepEqual(resolveShot("about", 1.8).framing.position, [-1.8, 3, -.772]);
  assert.equal(resolveShot("about", 1.8).framing.roll, -25);
  assert.equal(resolveShot("about", 1.8).transition.breathing, undefined);
  assert.deepEqual(resolveShot("about", .6).framing.position, [-1.897, 3.16, -.578]);
  assert.equal(resolveShot("about", .6).framing.roll, 0);
});

test("Certificates uses an unobstructed straight-on archive framing", () => {
  const frame=resolveShot("certificates",1.8).framing;
  assert.ok(Math.abs(frame.position[0]-frame.lookAt[0])<.1);
  assert.equal(frame.composition,"chronological certificate archive");
});

test("Projects frames the MacBook display as its subject",()=>{
  const frame=resolveShot("projects",1.8).framing;
  assert.deepEqual(frame.lookAt,[-.55,1.78,-2.3]);
  assert.ok(frame.position[2]<0);
  assert.equal(frame.fov,31);
  assert.equal(frame.composition,"interactive MacBook display");
});

test("Certificate inspection uses a close cursor-controlled framing", () => {
  const frame=resolveShot("certificate-detail",1.8).framing;
  assert.equal(frame.composition,"cursor-controlled certificate inspection");
  assert.ok(frame.fov<resolveShot("certificates",1.8).framing.fov);
  assert.ok(frame.position[2]<-1);
  assert.equal(getShotOvershoot("certificate-detail",.018),0);
});

test("Certificate browsing begins without drift and spans every shelf row", () => {
  assert.deepEqual(getCertificateBrowseOffset(-.4,.55,-.4,.55),[0,0]);
  const [,verticalTravel]=getCertificateBrowseOffset(-.4,-.7,-.4,.55);
  assert.ok(verticalTravel<=-2.55);
});

test("trackpad pinch-out requires deliberate accumulated movement", () => {
  assert.equal(isTrackpadPinchOut(47), false);
  assert.equal(isTrackpadPinchOut(48), true);
});

test("a new shot request interrupts an active camera journey", () => {
  assert.equal(shouldBeginShotTransition(true, false, "workspace", "about"), true);
  assert.equal(shouldBeginShotTransition(true, false, "about", "about"), false);
  assert.equal(shouldBeginShotTransition(false, false, "workspace", "about"), false);
});

test("the root route does not overwrite the intro destination", () => {
  assert.equal(shouldSyncRouteShot("/", false), false);
  assert.equal(shouldSyncRouteShot("/about", false), true);
  assert.equal(shouldSyncRouteShot("/", true), true);
});

test("certificate archive preserves the supplied newest-to-oldest order", () => {
  assert.equal(CERTIFICATES.length, 14);
  assert.equal(CERTIFICATES[0].title, "UX Management: Strategy and Tactics");
  assert.equal(CERTIFICATES[9].title, "Product Management");
  assert.equal(CERTIFICATES.at(-1).title, "Data-Driven Design: Quantitative Research for UX");
  assert.equal(new Set(CERTIFICATES.map(({image})=>image)).size, CERTIFICATES.length);
  assert.equal(new Set(CERTIFICATES.map(({slug})=>slug)).size, CERTIFICATES.length);
});

test("certificate detail URLs restore an exact shelf focus", () => {
  const certificate=CERTIFICATES[5];
  const path=pathForShot("certificate-detail",certificate.slug);
  assert.equal(path,`/certificates/${certificate.slug}`);
  assert.equal(parseScenePath(path).slug,certificate.slug);
  const focus=getCertificateFocusBySlug(certificate.slug);
  assert.equal(focus.slug,certificate.slug);
  assert.ok(Math.abs(focus.x+.275)<1e-9);
  assert.ok(Math.abs(focus.y-.425)<1e-9);
  assert.equal(getCertificateFocusBySlug("missing-certificate"),null);
});

test("guided Scenes preserve the cinematic order and Drawer loop",()=>{
  assert.deepEqual(GUIDED_SCENE_IDS,["opening","about","certificates","projects","wall","phone","poems","drawer"]);
  for(let index=0;index<GUIDED_SCENE_IDS.length-1;index++)assert.equal(getAdjacentScene(GUIDED_SCENE_IDS[index],1),GUIDED_SCENE_IDS[index+1]);
  assert.equal(getAdjacentScene("drawer",1),"opening");
  assert.equal(getAdjacentScene("opening",-1),null);
});

test("Scene definitions own camera framing without changing About",()=>{
  assert.equal(SCENE_REGISTRY.about.subject,"paper");
  assert.equal(SCENE_REGISTRY.about.route,"/about");
  assert.deepEqual(SCENE_REGISTRY.about.framing.position,[-1.8,3,-.772]);
  assert.deepEqual(SCENE_REGISTRY.about.framing.lookAt,[-2,1.25,-1.022]);
  assert.equal(SCENE_REGISTRY.about.framing.fov,31);
  assert.equal(SCENE_REGISTRY.about.framing.roll,-25);
  assert.deepEqual(SCENE_REGISTRY.about.responsive.mobile.position,[-1.897,3.16,-.578]);
  assert.equal(SCENE_REGISTRY.about.responsive.mobile.fov,46);
  assert.equal(SCENE_REGISTRY.about.responsive.mobile.roll,0);
  assert.equal(SCENE_REGISTRY.about.responsive.tablet,undefined);
  assert.equal(SCENE_REGISTRY.about.transition.duration,4.3);
  assert.equal(SCENE_REGISTRY.about.cameraFocus.depthOfFieldStrength,0);
});

test("Poems camera remains centered on and aligned with the writing portfolio",()=>{
  const framing=SCENE_REGISTRY.poems.framing;
  assert.deepEqual(framing.lookAt,POEMS_FOLDER_LAYOUT.worldCenter);
  const cameraOffsetX=framing.position[0]-framing.lookAt[0];
  const cameraOffsetZ=framing.position[2]-framing.lookAt[2];
  const offsetLength=Math.hypot(cameraOffsetX,cameraOffsetZ);
  const screenRight=[cameraOffsetZ/offsetLength,-cameraOffsetX/offsetLength];
  const angle=POEMS_FOLDER_LAYOUT.rotationDegrees*Math.PI/180;
  const folderRight=[Math.cos(angle),-Math.sin(angle)];
  assert.ok(Math.abs(screenRight[0]-folderRight[0])<1e-9);
  assert.ok(Math.abs(screenRight[1]-folderRight[1])<1e-9);
  const verticalDistance=framing.position[1]-framing.lookAt[1];
  assert.ok(Math.atan2(offsetLength,verticalDistance)<10*Math.PI/180);
  assert.equal(SCENE_REGISTRY.poems.cameraFocus.depthOfFieldStrength,0);
});

test("Phone framing remains centered on the device at inspection distance",()=>{
  const framing=SCENE_REGISTRY.phone.framing;
  assert.deepEqual(framing.lookAt,PHONE_LAYOUT.cameraTarget);
  assert.ok(Math.hypot(...framing.lookAt.map((value,index)=>value-PHONE_LAYOUT.worldCenter[index]))<.06);
  assert.deepEqual(framing.position,PHONE_LAYOUT.cameraPosition);
  const delta=framing.position.map((value,index)=>value-framing.lookAt[index]);
  const angleFromScreenNormal=Math.atan2(Math.hypot(delta[0],delta[2]),delta[1])*180/Math.PI;
  assert.ok(angleFromScreenNormal<20);
  assert.ok(Math.hypot(...delta)<1.7);
  assert.equal(SCENE_REGISTRY.phone.cameraFocus.depthOfFieldStrength,0);
  assert.deepEqual(SCENE_REGISTRY.phone.responsive.mobile.lookAt,PHONE_LAYOUT.cameraTarget);
  assert.deepEqual(SCENE_REGISTRY.phone.responsive.tablet.lookAt,PHONE_LAYOUT.cameraTarget);
});

test("Certificates parent and representative Focus framing remain numerically stable",()=>{
  assert.deepEqual(SCENE_REGISTRY.certificates.framing.position,[-3.75,2.3,1.25]);
  assert.deepEqual(SCENE_REGISTRY.certificates.framing.lookAt,[-3.8,2,-3.58]);
  assert.equal(SCENE_REGISTRY.certificates.framing.fov,44);
  assert.deepEqual(SCENE_REGISTRY.certificates.responsive.mobile.position,[-3.72,2.35,2.1]);
  const first=FOCUS_COLLECTIONS.certificates.items[CERTIFICATES[0].slug];
  assert.equal(first.cameraTarget,"certificate-detail");
  assert.equal(first.framing.fov,27);
  assert.equal(first.transition.duration,3.2);
  assert.equal(first.cameraFocus.depthOfFieldStrength,0);
});

test("every certificate Focus item keeps its subject centered",()=>{
  const collection=FOCUS_COLLECTIONS.certificates;
  for(const layout of CERTIFICATE_LAYOUT){
    const certificate=CERTIFICATES[layout.index];
    const focused=collection.items[certificate.slug];
    assert.ok(Math.abs((focused.framing.position[0]-collection.defaultFraming.position[0])-layout.x)<1e-9);
    assert.ok(Math.abs((focused.framing.position[1]-collection.defaultFraming.position[1])-layout.y)<1e-9);
    assert.ok(Math.abs((focused.framing.lookAt[0]-collection.defaultFraming.lookAt[0])-layout.x)<1e-9);
    assert.ok(Math.abs((focused.framing.lookAt[1]-collection.defaultFraming.lookAt[1])-layout.y)<1e-9);
  }
});

test("Focus activation and restoration keep the parent Scene",()=>{
  const item=CERTIFICATES[0];
  const focused=locationForFocus("certificates",item.slug);
  assert.deepEqual(focused,{sceneId:"certificates",focusCollectionId:"certificates",focusItemId:item.slug,cameraTarget:"certificate-detail"});
  assert.deepEqual(locationForScene(focused.sceneId),{sceneId:"certificates",focusCollectionId:null,focusItemId:null,cameraTarget:"certificates"});
});

test("Focus-to-Focus navigation stays inside the collection",()=>{
  const first=CERTIFICATES[0].slug,second=CERTIFICATES[1].slug;
  assert.equal(getAdjacentFocus("certificates",first,1).id,second);
  const firstLocation=locationForFocus("certificates",first),secondLocation=locationForFocus("certificates",second);
  assert.equal(firstLocation.sceneId,secondLocation.sceneId);
  assert.equal(firstLocation.cameraTarget,secondLocation.cameraTarget);
});

test("certificate Focus neighbors follow spatial layout",()=>{
  const topLeft=CERTIFICATES[0].slug;
  assert.equal(getFocusNeighbor("certificates",topLeft,"left"),null);
  assert.equal(getFocusNeighbor("certificates",topLeft,"right").id,CERTIFICATES[1].slug);
  assert.equal(getFocusNeighbor("certificates",topLeft,"down").id,CERTIFICATES[4].slug);
  assert.match(FOCUS_COLLECTIONS.certificates.items[topLeft].subject,/^certificate:/);
});

test("arrow keys resolve to Focus movement before Scene navigation",()=>{
  assert.equal(getFocusDirectionForKey("ArrowLeft"),"left");
  assert.equal(getFocusDirectionForKey("ArrowRight"),"right");
  assert.equal(getFocusDirectionForKey("ArrowUp"),"up");
  assert.equal(getFocusDirectionForKey("ArrowDown"),"down");
  assert.equal(getFocusDirectionForKey(" "),null);
});

test("routes reconstruct Scene and Focus state for deep links and Back",()=>{
  const first=CERTIFICATES[0].slug,second=CERTIFICATES[1].slug;
  assert.equal(pathForScene("certificates"),"/certificates");
  assert.equal(pathForFocus("certificates",first),`/certificates/${first}`);
  const history=[resolveNavigationPath("/certificates"),resolveNavigationPath(`/certificates/${first}`),resolveNavigationPath(`/certificates/${second}`)];
  assert.equal(history[2].focusItemId,second);
  assert.equal(history[1].focusItemId,first);
  assert.equal(history[0].focusItemId,null);
  assert.ok(STATIC_FOCUS_ROUTES.includes("/phone/qr"));
  assert.ok(STATIC_FOCUS_ROUTES.includes("/socials"));
});
