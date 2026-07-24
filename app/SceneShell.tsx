"use client";

import { lazy,Suspense } from "react";

const Experience=lazy(()=>import("@/src/scene/Experience"));
export default function SceneShell({initialPath="/"}:{initialPath?:string}) {
  return <main className="experience-shell">
    <Suspense fallback={<div className="experience-loading" role="status" aria-live="polite"><span>Entering workspace</span></div>}><Experience initialPath={initialPath}/></Suspense>
    <div className="grain" aria-hidden="true"/>
    <div className="fallback"><p>A quiet creative studio at night.</p></div>
  </main>;
}
