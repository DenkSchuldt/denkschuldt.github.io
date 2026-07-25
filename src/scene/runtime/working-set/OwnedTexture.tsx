"use client";

import { useEffect,useState } from "react";
import * as THREE from "three";
import { useWorkingSetStore } from "./WorkingSetProvider";
import type { ReleaseEvidence } from "./types";

export function useOwnedTexture(url:string,resourceId:string,enabled=true){
  const store=useWorkingSetStore();
  const [texture,setTexture]=useState<THREE.Texture|null>(null);
  useEffect(()=>{
    if(!enabled){setTexture(null);return;}
    let cancelled=false,owned:THREE.Texture|null=null;
    store.resourceEvent("prepare-start",resourceId,{status:"preparing",cache:"owned",detail:url});
    new THREE.TextureLoader().load(url,(loaded)=>{
      if(cancelled){
        loaded.dispose();
        store.resourceEvent("prepare-cancel",resourceId,{status:"released",cache:"owned",detail:"late completion disposed",evidence:["references-released","texture-disposed","browser-memory-unverified","gpu-memory-unverified"]});
        return;
      }
      owned=loaded;loaded.colorSpace=THREE.SRGBColorSpace;loaded.needsUpdate=true;setTexture(loaded);
      store.resourceEvent("prepare-end",resourceId,{status:"resident",cache:"owned",detail:url});
    },undefined,(error)=>{
      if(cancelled)return;
      store.resourceEvent("error",resourceId,{status:"error",cache:"owned",detail:error instanceof Error?error.message:String(error)});
    });
    return()=>{
      cancelled=true;
      setTexture(null);
      if(!owned)return;
      owned.dispose();
      const evidence:readonly ReleaseEvidence[]=["unmounted","references-released","texture-disposed","browser-memory-unverified","gpu-memory-unverified"];
      store.resourceEvent("dispose",resourceId,{status:"released",cache:"owned",detail:"owned texture dispose() called; browser/GPU reclamation not observable",evidence});
      owned=null;
    };
  },[enabled,resourceId,store,url]);
  return texture;
}

export function useOwnedTextures(urls:readonly string[],resourceId:string,enabled=true){
  const store=useWorkingSetStore();
  const [textures,setTextures]=useState<THREE.Texture[]>([]);
  const key=urls.join("\u0000");
  useEffect(()=>{
    if(!enabled){setTextures([]);return;}
    let cancelled=false;
    const owned:THREE.Texture[]=[];
    store.resourceEvent("prepare-start",resourceId,{status:"preparing",cache:"owned",detail:`${urls.length} texture(s)`});
    Promise.all(urls.map((url)=>new Promise<THREE.Texture>((resolve,reject)=>{
      new THREE.TextureLoader().load(url,(texture)=>{texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;resolve(texture);},undefined,reject);
    }))).then((loaded)=>{
      if(cancelled){
        loaded.forEach((texture)=>texture.dispose());
        store.resourceEvent("prepare-cancel",resourceId,{status:"released",cache:"owned",detail:"late batch disposed",evidence:["references-released","texture-disposed","browser-memory-unverified","gpu-memory-unverified"]});
        return;
      }
      owned.push(...loaded);setTextures(loaded);
      store.resourceEvent("prepare-end",resourceId,{status:"resident",cache:"owned",detail:`${loaded.length} texture(s)`});
    }).catch((error)=>{
      owned.forEach((texture)=>texture.dispose());
      if(!cancelled)store.resourceEvent("error",resourceId,{status:"error",cache:"owned",detail:error instanceof Error?error.message:String(error)});
    });
    return()=>{
      cancelled=true;setTextures([]);
      owned.forEach((texture)=>texture.dispose());
      if(owned.length)store.resourceEvent("dispose",resourceId,{status:"released",cache:"owned",detail:`dispose() called for ${owned.length} texture(s); actual GPU/browser release unobservable`,evidence:["unmounted","references-released","texture-disposed","browser-memory-unverified","gpu-memory-unverified"]});
    };
  },[enabled,key,resourceId,store]);
  return textures;
}
