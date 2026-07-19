"use client";

import { useEffect,useRef,useState } from "react";
import { loadPoemContent,loadPoemManifest,type PoemRecord } from "./poems";
import { withSceneBasePath } from "../camera/sceneRoutes";

export interface PoemsContentState {
  poems:PoemRecord[];
  loading:boolean;
  error:string|null;
}

export function usePoems(activeSlug:string|null):PoemsContentState {
  const [state,setState]=useState<PoemsContentState>({poems:[],loading:true,error:null});
  const loadingSlugs=useRef(new Set<string>());
  useEffect(()=>{
    let active=true;
    loadPoemManifest(fetch,withSceneBasePath("/poems-manifest.json")).then((poems)=>{if(active)setState({poems:poems.map((poem)=>({...poem,body:"",contentUrl:withSceneBasePath(poem.contentUrl),imageUrl:poem.imageUrl?withSceneBasePath(poem.imageUrl):null})),loading:false,error:null});}).catch((error)=>{if(active)setState({poems:[],loading:false,error:error instanceof Error?error.message:String(error)});});
    return()=>{active=false;};
  },[]);
  useEffect(()=>{
    if(activeSlug===null||!state.poems.length)return;
    const requestedIndex=activeSlug?state.poems.findIndex(({slug})=>slug===activeSlug):0;
    const index=requestedIndex>=0?requestedIndex:0;
    const targets=[index,index-1,index+1].map((target)=>state.poems[target]).filter((poem):poem is PoemRecord=>Boolean(poem&&!poem.body&&!loadingSlugs.current.has(poem.slug)));
    if(!targets.length)return;
    let active=true;
    targets.forEach((poem)=>loadingSlugs.current.add(poem.slug));
    Promise.all(targets.map(async(poem)=>{
      try{return {poem:await loadPoemContent(poem),error:null};}
      catch(error){return {poem:null,error:poem.slug===state.poems[index].slug?(error instanceof Error?error.message:String(error)):null};}
      finally{loadingSlugs.current.delete(poem.slug);}
    })).then((results)=>{
      if(!active)return;
      const loaded=new Map(results.flatMap(({poem})=>poem?[[poem.slug,poem] as const]:[]));
      const error=results.find((result)=>result.error)?.error??null;
      setState((current)=>({...current,error:error??current.error,poems:current.poems.map((candidate)=>loaded.get(candidate.slug)??candidate)}));
    });
    return()=>{active=false;};
  },[activeSlug,state.poems]);
  return state;
}
