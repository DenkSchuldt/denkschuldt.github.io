import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

async function render(path="/"){
  const workerUrl=new URL("../dist/server/index.js",import.meta.url);
  workerUrl.searchParams.set("test",`${process.pid}-${Date.now()}`);
  const {default:worker}=await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`,{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
}

test("server-renders the cinematic experience shell",async()=>{
  const response=await render();
  assert.equal(response.status,200);
  assert.match(response.headers.get("content-type")??"",/^text\/html\b/i);
  const html=await response.text();
  assert.match(html,/<title>Denny K\. Schuldt<\/title>/i);
  assert.match(html,/class="experience-shell"/);
  assert.match(html,/<canvas/);
  assert.match(html,/class="scene-navigation"/);
  assert.match(html,/class="experience-loading"/);
  assert.match(html,/Entering workspace/);
  assert.match(html,/class="scene-navigation-current camera-location"/);
  assert.doesNotMatch(html,/>Opening<\/div>/);
  assert.match(html,/Next scene: About me/);
  assert.doesNotMatch(html,/mobile-camera-nav/);
  assert.match(html,/class="cinematic-fade"/);
  assert.match(html,/class="grain"/);
  assert.match(html,/A quiet creative studio at night\./);
  assert.doesNotMatch(html,/codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.doesNotMatch(html,/rendering-diagnostics|Render diagnostics/i);
});

test("collection focus is explicit and the responsive navigation stays scene-based",async()=>{
  const [navigation,scene,primitives,css]=await Promise.all([
    readFile(new URL("../src/scene/camera/SceneNavigation.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/scene/Scene.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/scene/objects/Primitives.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/globals.css",import.meta.url),"utf8"),
  ]);
  assert.match(navigation,/onFocus=\{\(\)=>\{if\(!active\)onEnterFocus/);
  assert.match(navigation,/aria-label=\{`Exit \$\{collection\?\.label\?\?"collection"\} collection`\}/);
  assert.match(navigation,/aria-keyshortcuts="Escape"/);
  assert.doesNotMatch(navigation,/event\.key!=="Escape"/);
  const camera=await readFile(new URL("../src/scene/camera/useCinematicCamera.ts",import.meta.url),"utf8");
  assert.match(camera,/isReturnToStartKey\(event\.key\).*system\.returnToStart\(\)/s);
  assert.match(camera,/const \[visitedAutoScenes,setVisitedAutoScenes\]=useState<SceneId\[]>\(\[\]\)/);
  assert.match(navigation,/<FadingSceneName label=\{currentLabel\}\/>/);
  assert.equal((navigation.match(/<FadingSceneName /g)??[]).length,3);
  assert.match(navigation,/const next=resumeTarget\?\?getAdjacentScene\(current,1,visitedAutoScenes\)/);
  assert.match(scene,/onCertificateSelect=\{focusCertificate\}/);
  assert.match(primitives,/onPointerOver=\{\(\)=>\{if\(interactive\)setHovered\(true\);\}\}/);
  assert.doesNotMatch(primitives,/onPointerOver=\{\(\)=>\{[^}]*onSelect/);
  assert.match(primitives,/function ShelfDecor\(\)/);
  assert.match(primitives,/function Pen\(\{position,rotation\}/);
  assert.match(primitives,/<sphereGeometry args=\{\[\.0032,12,8\]\}/);
  assert.match(primitives,/MACBOOK_CHASSIS_MATERIAL=new THREE\.MeshStandardMaterial/);
  assert.match(primitives,/bevelSegments:1/);
  assert.match(primitives,/new THREE\.CylinderGeometry\(\.026,\.026,1\.18,8,1,false\)/);
  assert.doesNotMatch(primitives,/\[-\.48,-\.24,0,\.24,\.48\]\.flatMap/);
  assert.match(primitives,/shelf-led-row-/);
  assert.match(primitives,/emissiveIntensity=\{initialImageEmission\}/);
  assert.match(primitives,/intensity=\{initialLightIntensity\}/);
  assert.match(primitives,/<meshStandardMaterial ref=\{imageMaterialRef\} map=\{texture\}/);
  assert.match(primitives,/withSceneBasePath\("\/phone\.jpeg"\)/);
  assert.match(primitives,/PHONE_CONTACT_URL="https:\/\/wa\.me\/\+593964198839(?:\?[^\"]*)?"/);
  assert.match(primitives,/screenLoaded&&<Suspense fallback=\{null\}><PhoneScreen active=\{active\}/);
  assert.match(primitives,/<meshBasicMaterial ref=\{materialRef\} map=\{texture\} color="#050505" toneMapped=\{false\}/);
  assert.match(css,/@media \(max-width: 1024px\).*\.scene-navigation-target \{ display: none; \}/s);
  assert.match(css,/@media \(max-width: 640px\).*\.scene-navigation-target \{ display: grid;[^}]*border-radius: 999px/s);
  assert.match(css,/@media \(max-width: 640px\).*\.scene-navigation-target \.scene-name \{ display: none; \}/s);
});

test("keeps heavy WebGL resources outside the initial loading boundary",async()=>{
  const [shell,experience,scene,primitives,camera]=await Promise.all([
    readFile(new URL("../app/SceneShell.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/scene/Experience.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/scene/Scene.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/scene/objects/Primitives.tsx",import.meta.url),"utf8"),
    readFile(new URL("../src/scene/camera/useCinematicCamera.ts",import.meta.url),"utf8"),
  ]);
  assert.match(shell,/lazy\(\(\)=>import\("@\/src\/scene\/Experience"\)\)/);
  assert.match(experience,/import \{ Scene,type SceneSettings \} from "\.\/Scene"/);
  assert.doesNotMatch(experience,/lazy\(\(\)=>import\("\.\/Scene"\)/);
  const effects=await readFile(new URL("../src/scene/effects/CinematicEffects.tsx",import.meta.url),"utf8");
  assert.match(effects,/multisampling=\{0\}/);
  assert.doesNotMatch(scene,/loadCertificates|loadTextures/);
  assert.match(primitives,/<CertificateGallery illuminated=\{illuminated\}/);
  assert.match(primitives,/<PosterImages\/>/);
  assert.match(primitives,/<PortfolioPhoto materialRef=\{photoMaterialRef\}\/>/);
  assert.match(primitives,/<Suspense fallback=\{<mesh geometry=\{PORTFOLIO_PHOTO_GEOMETRY\}/);
  assert.match(primitives,/\/certificates\/thumbs\//);
  assert.match(primitives,/\/fonts\/PatrickHand-Regular\.ttf/);
  assert.doesNotMatch(`${experience}\n${camera}`,/from "leva"/);
});

test("keeps the cinematic shell and fallback scoped",async()=>{
  const [shell,layout,css]=await Promise.all([readFile(new URL("../app/SceneShell.tsx",import.meta.url),"utf8"),readFile(new URL("../app/layout.tsx",import.meta.url),"utf8"),readFile(new URL("../app/globals.css",import.meta.url),"utf8")]);
  assert.match(shell,/<Experience initialPath=\{initialPath\}\/>/);
  assert.match(shell,/className="grain"/);
  assert.match(shell,/className="fallback"/);
  assert.match(layout,/title:\s*"Denny K\. Schuldt"/);
  assert.match(css,/\.experience-shell\s*\{[^}]*position:\s*fixed/);
  assert.match(css,/\.fallback\s*\{[^}]*clip-path:\s*inset\(50%\)/);
  assert.match(css,/canvas\s*\{\s*touch-action:\s*none/);
});
