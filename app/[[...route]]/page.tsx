import SceneShell from "../SceneShell";
import { SCENE_ROUTES } from "@/src/scene/camera";
import { CERTIFICATES } from "@/src/scene/objects/certificates";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { route: [] },
    ...Object.values(SCENE_ROUTES).map(({path})=>({route:[path.slice(1)]})),
    ...CERTIFICATES.map(({slug})=>({route:["certificates",slug]})),
  ];
}

export default function WorldPage() { return <SceneShell/>; }
