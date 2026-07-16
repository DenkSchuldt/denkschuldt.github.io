"use client";

import Experience from "@/src/scene/Experience";
export default function SceneShell() {
  return <main className="experience-shell">
    <Experience/>
    <div className="grain" aria-hidden="true"/>
    <div className="fallback"><p>A quiet creative studio at night.</p></div>
  </main>;
}
