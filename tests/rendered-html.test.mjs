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
  assert.match(html,/<title>Cinematic Playground<\/title>/i);
  assert.match(html,/class="experience-shell"/);
  assert.match(html,/<canvas/);
  assert.match(html,/class="camera-location"/);
  assert.match(html,/>Opening<\/span>/);
  assert.match(html,/class="mobile-camera-nav"/);
  assert.match(html,/class="cinematic-fade"/);
  assert.match(html,/class="grain"/);
  assert.match(html,/A quiet creative studio at night\./);
  assert.doesNotMatch(html,/codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.doesNotMatch(html,/rendering-diagnostics|Render diagnostics/i);
});

test("keeps the cinematic shell and fallback scoped",async()=>{
  const [shell,layout,css]=await Promise.all([readFile(new URL("../app/SceneShell.tsx",import.meta.url),"utf8"),readFile(new URL("../app/layout.tsx",import.meta.url),"utf8"),readFile(new URL("../app/globals.css",import.meta.url),"utf8")]);
  assert.match(shell,/<Experience\s*\/>/);
  assert.match(shell,/className="grain"/);
  assert.match(shell,/className="fallback"/);
  assert.match(layout,/title:\s*"Cinematic Playground"/);
  assert.match(css,/\.experience-shell\s*\{[^}]*position:\s*fixed/);
  assert.match(css,/\.fallback\s*\{[^}]*clip-path:\s*inset\(50%\)/);
  assert.match(css,/canvas\s*\{\s*touch-action:\s*none/);
});
