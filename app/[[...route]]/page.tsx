import SceneShell from "../SceneShell";
import { SCENE_ROUTES, STATIC_FOCUS_ROUTES } from "@/src/scene/camera";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { route: [] },
    ...Object.values(SCENE_ROUTES).map(({path})=>({route:[path.slice(1)]})),
    ...STATIC_FOCUS_ROUTES.map((path)=>({route:path.split("/").filter(Boolean)})),
  ];
}

export default function WorldPage() { return <SceneShell/>; }
