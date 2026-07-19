import SceneShell from "../SceneShell";
import { SCENE_ROUTES, STATIC_FOCUS_ROUTES } from "@/src/scene/camera";
import type { Metadata } from "next";
import { getStaticPoemPreviews } from "../poems.server";

const SITE_ORIGIN=(process.env.NEXT_PUBLIC_SITE_URL??"https://denkschuldt.github.io").replace(/\/$/,"");
const BASE_PATH=(process.env.NEXT_PUBLIC_BASE_PATH??"").replace(/\/$/,"");
const absoluteUrl=(pathname:string)=>`${SITE_ORIGIN}${BASE_PATH}${pathname.startsWith("/")?pathname:`/${pathname}`}`;
const excerpt=(body:string)=>body.replace(/\s+/g," ").trim().slice(0,180).replace(/\s+\S*$/,"").concat(body.replace(/\s+/g," ").trim().length>180?"…":"");

export async function generateStaticParams() {
  const poemRoutes=(await getStaticPoemPreviews()).map(({slug})=>`/poems/${slug}`);
  const routes=new Set([...STATIC_FOCUS_ROUTES,...poemRoutes]);
  return [
    { route: [] },
    ...Object.values(SCENE_ROUTES).map(({path})=>({route:[path.slice(1)]})),
    ...[...routes].map((path)=>({route:path.split("/").filter(Boolean)})),
  ];
}

export async function generateMetadata({params}:{params:Promise<{route?:string[]}>}):Promise<Metadata> {
  const {route=[]}=await params;
  if(route[0]!=="poems")return {};
  if(!route[1]){
    const title="Poems — Denny K. Schuldt",description="Original poetry by Denny K. Schuldt, presented as a cinematic writing portfolio.",url=absoluteUrl("/poems");
    return {title,description,alternates:{canonical:url},robots:{index:true,follow:true},openGraph:{type:"website",title,description,url},twitter:{card:"summary",title,description}};
  }
  const poem=(await getStaticPoemPreviews()).find(({slug})=>slug===route[1])??null;
  if(!poem)return {};
  const title=`${poem.title} — Denny K. Schuldt`;
  const description=excerpt(poem.body);
  const url=absoluteUrl(`/poems/${poem.slug}`);
  const image=absoluteUrl(poem.imagePath);
  return {
    title,description,alternates:{canonical:url},
    robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1}},
    keywords:[poem.title,"poetry","poem","poesía","poema","Denny K. Schuldt"],
    openGraph:{type:"article",title,description,url,images:[{url:image,alt:`Preview of ${poem.title}`}],publishedTime:poem.date,authors:["Denny K. Schuldt"]},
    twitter:{card:"summary_large_image",title,description,images:[image]},
  };
}

export default async function WorldPage({params}:{params:Promise<{route?:string[]}>}) {
  const {route=[]}=await params;
  const poems=route[0]==="poems"?await getStaticPoemPreviews():[];
  const poem=route[1]?poems.find(({slug})=>slug===route[1])??null:null;
  const poemIndex=poem?poems.findIndex(({slug})=>slug===poem.slug):-1;
  const initialPath=route.length?`/${route.join("/")}`:"/";
  const poemUrl=poem?absoluteUrl(`/poems/${poem.slug}`):null;
  const structuredData=poem?JSON.stringify({"@context":"https://schema.org","@type":"CreativeWork","@id":poemUrl,url:poemUrl,name:poem.title,headline:poem.title,text:poem.body,genre:"Poetry",inLanguage:poem.language,datePublished:poem.date,image:absoluteUrl(poem.imagePath),author:{"@type":"Person",name:"Denny K. Schuldt",url:"https://denkschuldt.github.io/"},copyrightHolder:{"@type":"Person",name:"Denny K. Schuldt"},copyrightYear:Number(poem.date.slice(0,4)),isPartOf:{"@type":"CollectionPage",name:"Poems by Denny K. Schuldt",url:absoluteUrl("/poems")}}).replace(/</g,"\\u003c"):null;
  return <>
    <SceneShell initialPath={initialPath}/>
    {route[0]==="poems"&&!poem&&<section className="poem-share-preview" aria-label="Poems by Denny K. Schuldt">
      <h1>Poems by Denny K. Schuldt</h1><p>Original poetry, newest first.</p>
      <ol>{poems.map((entry)=><li key={entry.slug}><a href={`${BASE_PATH}/poems/${entry.slug}`}>{entry.title}</a> <time dateTime={entry.date}>{entry.date}</time></li>)}</ol>
      <a href={`${BASE_PATH}/poems/feed.xml`} type="application/atom+xml">Subscribe to the poetry feed</a>
    </section>}
    {poem&&<article className="poem-share-preview" aria-label={`Poem: ${poem.title}`} lang={poem.language}>
      <h1>{poem.title}</h1><p>{poem.body}</p><img src={`${BASE_PATH}${poem.imagePath}`} alt={`Artwork for ${poem.title}`}/>
      <nav aria-label="Poem navigation">
        {poems[poemIndex-1]&&<a rel="prev" href={`${BASE_PATH}/poems/${poems[poemIndex-1].slug}`}>{poems[poemIndex-1].title}</a>}
        <a href={`${BASE_PATH}/poems`}>All poems</a>
        {poems[poemIndex+1]&&<a rel="next" href={`${BASE_PATH}/poems/${poems[poemIndex+1].slug}`}>{poems[poemIndex+1].title}</a>}
      </nav>
      <a rel="alternate" type="text/markdown" href={`${BASE_PATH}${poem.contentUrl}`}>Read the Markdown source</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:structuredData!}}/>
    </article>}
  </>;
}
