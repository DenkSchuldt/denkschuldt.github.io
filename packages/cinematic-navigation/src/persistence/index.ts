import type { PersistenceAdapter } from "../core/index.js";

export function createWebStoragePersistence(storage:Pick<Storage,"getItem"|"setItem"|"removeItem">):PersistenceAdapter{
  return {read:(key)=>storage.getItem(key),write:(key,value)=>storage.setItem(key,value),remove:(key)=>storage.removeItem(key)};
}

export function createMemoryPersistence(initial:Readonly<Record<string,string>>={}):PersistenceAdapter{
  const values=new Map(Object.entries(initial));
  return {read:(key)=>values.get(key)??null,write:(key,value)=>{values.set(key,value);},remove:(key)=>{values.delete(key);}};
}
