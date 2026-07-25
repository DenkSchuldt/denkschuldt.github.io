"use client";

import type { ReactNode } from "react";
import type { WorkingSetState } from "./types";

export function ResourceBoundary({state,ambient,children,errorFallback=null}:{state:WorkingSetState;ambient:ReactNode;children:ReactNode;errorFallback?:ReactNode}){
  if(state==="error")return <>{ambient}{errorFallback}</>;
  const resident=state==="preparing"||state==="active"||state==="sleeping";
  return <>{ambient}{resident?children:null}</>;
}
