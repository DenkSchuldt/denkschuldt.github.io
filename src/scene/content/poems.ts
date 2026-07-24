export interface PoemManifestEntry {
  slug:string;
  date:string;
  title:string;
  imageUrl:string|null;
  contentUrl:string;
  language:string;
  sourceRef:string;
}

export interface PoemRecord extends PoemManifestEntry {body:string;}

export interface PoemFrontmatter {
  slug:string|null;
  title:string|null;
  date:string|null;
  language:string|null;
}

const unquote=(value:string)=>value.trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/,"$1$2").trim();

export function normalizePoemSlug(value:string,fallback:string){
  const normalized=value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  return normalized||fallback;
}

export function parsePoemFrontmatter(markdown:string,fallbackSlug:string):PoemFrontmatter {
  const match=markdown.replace(/\r\n?/g,"\n").match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  const scalar=(key:string)=>{
    const value=match?.[1].match(new RegExp(`^${key}:\\s*(.+)$`,"mi"))?.[1];
    return value?unquote(value):null;
  };
  const rawSlug=scalar("slug");
  return {slug:rawSlug?normalizePoemSlug(rawSlug,fallbackSlug):null,title:scalar("title"),date:scalar("date"),language:scalar("lang")};
}

export function parsePoemMarkdown(markdown:string,fallbackTitle:string){
  const normalized=markdown.replace(/\r\n?/g,"\n").replace(/^---\n[\s\S]*?\n---\n?/,"").trim();
  const pageContent=normalized.split(/\n---\n/)[0].trim();
  const heading=pageContent.match(/^#\s+(.+)$/m);
  const title=(heading?.[1]??fallbackTitle).replace(/[*_`]/g,"").trim();
  const withoutTitle=heading?pageContent.replace(heading[0],"").trim():pageContent;
  const body=withoutTitle
    .replace(/!\[([^\]]*)\]\([^)]*\)/g,"$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g,"$1")
    .replace(/^#{1,6}\s+/gm,"")
    .replace(/^>\s?/gm,"")
    .replace(/^---$/gm,"")
    .replace(/\*\*([^*]+)\*\*/g,"$1")
    .replace(/__([^_]+)__/g,"$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,"$1")
    .replace(/(?<!_)_([^_]+)_(?!_)/g,"$1")
    .replace(/`([^`]+)`/g,"$1")
    .replace(/<[^>]+>/g,"")
    .replace(/\n{3,}/g,"\n\n")
    .trim();
  return {title,body};
}

export async function loadPoemManifest(fetcher:typeof fetch=fetch,endpoint="/poems-manifest.json"):Promise<PoemManifestEntry[]> {
  const response=await fetcher(endpoint,{cache:"no-store"});
  if(!response.ok)throw new Error(`Unable to load the poems manifest (${response.status}).`);
  const payload=await response.json() as {poems?:PoemManifestEntry[]};
  return payload.poems??[];
}

export async function loadPoemContent(poem:PoemManifestEntry,fetcher:typeof fetch=fetch):Promise<PoemRecord> {
  const response=await fetcher(poem.contentUrl,{cache:"force-cache"});
  if(!response.ok)throw new Error(`Unable to load poem '${poem.slug}' (${response.status}).`);
  const markdown=await response.text();
  const frontmatter=parsePoemFrontmatter(markdown,poem.slug);
  const content=parsePoemMarkdown(markdown,poem.title);
  return {...poem,title:frontmatter.title??content.title,body:content.body};
}
