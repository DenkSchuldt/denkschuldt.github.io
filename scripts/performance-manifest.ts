import type { Plugin } from "vite";

const SCENE_ROOTS = [
  "/app/SceneShell.tsx",
  "/src/scene/Experience.tsx",
  "/src/scene/effects/CinematicEffects.tsx",
];

export function performanceManifest(): Plugin {
  return {
    name: "portfolio-performance-manifest",
    generateBundle(_options, bundle) {
      if (this.environment.name !== "client") return;
      const files = new Set<string>();
      function visit(fileName: string) {
        if (files.has(fileName)) return;
        const chunk = bundle[fileName];
        if (!chunk || chunk.type !== "chunk") return;
        files.add(fileName);
        chunk.imports.forEach(visit);
      }
      for (const root of SCENE_ROOTS) {
        const chunk = Object.values(bundle).find(
          (entry) => entry.type === "chunk" && entry.facadeModuleId?.endsWith(root),
        );
        if (!chunk) this.error(`Missing 3D performance entry: ${root}`);
        visit(chunk.fileName);
      }
      this.emitFile({
        type: "asset",
        fileName: "performance-manifest.json",
        source: JSON.stringify({ sceneJavaScript: [...files].sort() }),
      });
    },
  };
}
