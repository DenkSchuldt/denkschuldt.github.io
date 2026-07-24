import type { FocusDirection, FocusItemRegistration } from "./types.js";

const axisDistance=(a:FocusItemRegistration,b:FocusItemRegistration,direction:FocusDirection)=>{
  const source=a.spatial!,candidate=b.spatial!;
  const primary=direction==="left"||direction==="right"?Math.abs(candidate.x-source.x):Math.abs(candidate.y-source.y);
  const secondary=direction==="left"||direction==="right"?Math.abs(candidate.y-source.y):Math.abs(candidate.x-source.x);
  return primary+secondary*2;
};

export function resolveSpatialNeighbor<TFraming,TTransition>(items:Iterable<FocusItemRegistration<TFraming,TTransition>>,currentId:string,direction:FocusDirection){
  const list=[...items],current=list.find(({id})=>id===currentId);
  if(!current?.spatial)return null;
  const explicit=current.neighbors?.[direction];
  if(explicit)return list.find(({id})=>id===explicit)??null;
  const {x,y}=current.spatial;
  const candidates=list.filter((item)=>item.id!==currentId&&item.spatial&&(
    direction==="left"?item.spatial.x<x:
    direction==="right"?item.spatial.x>x:
    direction==="up"?item.spatial.y>y:item.spatial.y<y
  ));
  candidates.sort((a,b)=>axisDistance(current,a,direction)-axisDistance(current,b,direction));
  return candidates[0]??null;
}
