"use client";

import { useEffect,useRef,useState } from "react";
import { loadPoemContent,loadPoemManifest,type PoemRecord } from "./poems";
import { withSceneBasePath } from "../camera/sceneRoutes";
import { useWorkingSetStore } from "../runtime/working-set";

export interface PoemsContentState {
  poems:PoemRecord[];
  loading:boolean;
  error:string|null;
}

export function usePoems(activeSlug:string|null,enabled=false):PoemsContentState {
  const workingSet=useWorkingSetStore();
  const [state,setState]=useState<PoemsContentState>({poems:[],loading:true,error:null});
  const loadingSlugs=useRef(new Set<string>());
  const manifestLoaded=useRef(false);
  useEffect(()=>{
    if(!enabled)return;
    if(manifestLoaded.current){workingSet.resourceEvent("cache-hit","poem-manifest",{status:"resident",cache:"shared-loader",detail:"session metadata reused"});return;}
    let active=true;
    workingSet.resourceEvent("prepare-start","poem-manifest",{status:"preparing",cache:"shared-loader"});
    loadPoemManifest(fetch,withSceneBasePath("/poems-manifest.json")).then((poems)=>{if(active){manifestLoaded.current=true;setState({poems:poems.map((poem)=>({...poem,body:"",contentUrl:withSceneBasePath(poem.contentUrl),imageUrl:poem.imageUrl?withSceneBasePath(poem.imageUrl):null})),loading:false,error:null});workingSet.resourceEvent("prepare-end","poem-manifest",{status:"resident",cache:"shared-loader",detail:`${poems.length} metadata records; retained for session`});}}).catch((error)=>{if(active){setState({poems:[],loading:false,error:error instanceof Error?error.message:String(error)});workingSet.resourceEvent("error","poem-manifest",{status:"error",cache:"shared-loader",detail:error instanceof Error?error.message:String(error)});}});
    return()=>{active=false;};
  },[enabled,workingSet]);
  useEffect(()=>{
    if(enabled)return;
    setState((current)=>({...current,poems:current.poems.map((poem)=>poem.body?{...poem,body:""}:poem)}));
    workingSet.resourceEvent("release","poem-markdown",{status:"released",cache:"browser",detail:"React body references removed; fetch/browser cache and heap reclamation are not observable",evidence:["references-released","browser-memory-unverified"]});
  },[enabled,workingSet]);
  useEffect(()=>{
    if(!enabled||!state.poems.length)return;
    const requestedIndex=activeSlug?state.poems.findIndex(({slug})=>slug===activeSlug):0;
    const index=requestedIndex>=0?requestedIndex:0;
    const targets=[index,index-1,index+1].map((target)=>state.poems[target]).filter((poem):poem is PoemRecord=>Boolean(poem&&!poem.body&&!loadingSlugs.current.has(poem.slug)));
    if(!targets.length)return;
    let active=true;
    targets.forEach((poem)=>loadingSlugs.current.add(poem.slug));
    workingSet.resourceEvent("prepare-start","poem-markdown",{status:"preparing",cache:"browser",detail:targets.map(({slug})=>slug).join(",")});
    Promise.all(targets.map(async(poem)=>{
      try{return {poem:await loadPoemContent(poem),error:null};}
      catch(error){return {poem:null,error:poem.slug===state.poems[index].slug?(error instanceof Error?error.message:String(error)):null};}
      finally{loadingSlugs.current.delete(poem.slug);}
    })).then((results)=>{
      if(!active)return;
      const loaded=new Map(results.flatMap(({poem})=>poem?[[poem.slug,poem] as const]:[]));
      const error=results.find((result)=>result.error)?.error??null;
      setState((current)=>{
        const requested=state.poems[index]?.slug;
        const keep=new Set([requested,...targets.map(({slug})=>slug)]);
        return {...current,error:error??current.error,poems:current.poems.map((candidate)=>{
          const next=loaded.get(candidate.slug)??candidate;
          return keep.has(candidate.slug)?next:(next.body?{...next,body:""}:next);
        })};
      });
      workingSet.resourceEvent(error?"error":"prepare-end","poem-markdown",{status:error?"error":"resident",cache:"browser",detail:error??`${loaded.size} body reference(s); bounded to selected and neighbours`});
    });
    return()=>{active=false;};
  },[activeSlug,enabled,state.poems,workingSet]);
  return state;
}
