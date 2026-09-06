import { SCENE_ROUTES, STATIC_FOCUS_ROUTES } from "@/src/scene/camera";

import { getStaticPoemPreviews } from "../poems.server";
import SceneShell from "../SceneShell";
import { SemanticLayer } from "../SemanticLayer";
import { getSiteContent } from "../site.server";
import { clip } from "../site-url";

import type { Metadata } from "next";

export async function generateStaticParams() {
  const poemRoutes = (await getStaticPoemPreviews()).map(({ slug }) => `/poems/${slug}`);
  const routes = new Set([...STATIC_FOCUS_ROUTES, ...poemRoutes]);
  return [
    { route: [] },
    ...Object.values(SCENE_ROUTES).map(({ path }) => ({ route: [path.slice(1)] })),
    ...[...routes].map((path) => ({ route: path.split("/").filter(Boolean) })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ route?: string[] }>;
}): Promise<Metadata> {
  const { route = [] } = await params;
  const [section, slug] = route;
  if (!section) return {};

  const content = await getSiteContent();

  if (section === "poems" && slug) {
    const poem = content.poems.items.find((entry) => entry.slug === slug);
    if (!poem) return {};
    const title = `${poem.title} — Denny K. Schuldt`;
    const description = clip(poem.body, 180);
    return {
      title,
      description,
      alternates: { canonical: poem.url },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
      },
      keywords: [poem.title, "poetry", "poem", "poesía", "poema", "Denny K. Schuldt"],
      openGraph: {
        type: "article",
        title,
        description,
        url: poem.url,
        images: [{ url: poem.imageUrl, alt: `Preview of ${poem.title}` }],
        publishedTime: poem.date,
        authors: ["Denny K. Schuldt"],
      },
      twitter: { card: "summary_large_image", title, description, images: [poem.imageUrl] },
    };
  }

  if (section === "wall" || section === "socials") {
    const parent = content.routes.find(
      (entry) => entry.path === (section === "socials" ? "/about" : "/"),
    );
    return {
      title: parent?.title ?? "Denny K. Schuldt",
      alternates: { canonical: parent?.url ?? content.site.url },
      robots: { index: false, follow: true },
    };
  }

  const routeMeta = content.routes.find((entry) => entry.path === `/${section}`);
  if (!routeMeta) return {};
  const { title, description, url, ogImage } = routeMeta;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: content.site.owner,
      locale: content.site.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function WorldPage({ params }: { params: Promise<{ route?: string[] }> }) {
  const { route = [] } = await params;
  const initialPath = route.length ? `/${route.join("/")}` : "/";
  return (
    <>
      <SceneShell initialPath={initialPath} />
      <SemanticLayer route={route} />
    </>
  );
}
