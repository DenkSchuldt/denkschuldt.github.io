import type { SiteContent, SiteContentPoem } from "./site.server.ts";

type JsonLdNode = Record<string, unknown>;

const personId = (content: SiteContent) => `${content.site.url}#person`;
const websiteId = (content: SiteContent) => `${content.site.url}#website`;
const routeImage = (content: SiteContent, path: string) =>
  content.routes.find((route) => route.path === path)?.ogImage;

function personNode(content: SiteContent): JsonLdNode {
  return {
    "@type": "Person",
    "@id": personId(content),
    name: content.person.name,
    url: content.person.url,
    description: content.person.tagline,
    homeLocation: { "@type": "Place", name: content.person.location },
    knowsLanguage: ["Spanish", "English", "Portuguese"],
    sameAs: content.person.links.map((link) => link.href),
  };
}

function websiteNode(content: SiteContent): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": websiteId(content),
    name: content.site.name,
    url: content.site.url,
    description: content.site.description,
    inLanguage: "en",
    author: { "@id": personId(content) },
    publisher: { "@id": personId(content) },
  };
}

function collectionPageNode(
  content: SiteContent,
  path: string,
  name: string,
  description: string,
  items: JsonLdNode[],
): JsonLdNode {
  const url = `${content.site.url.replace(/\/$/, "")}${path}`;
  const image = routeImage(content, path);
  return {
    "@type": "CollectionPage",
    "@id": url,
    url,
    name,
    description,
    ...(image ? { primaryImageOfPage: image } : {}),
    isPartOf: { "@id": websiteId(content) },
    about: { "@id": personId(content) },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item,
      })),
    },
  };
}

function projectNode(project: SiteContent["projects"][number]): JsonLdNode {
  const isSourceCode = project.url.includes("npmjs.com");
  return {
    "@type": isSourceCode ? "SoftwareSourceCode" : "CreativeWork",
    name: project.title,
    description: project.description,
    url: project.url,
    ...(project.imageUrl ? { image: project.imageUrl } : {}),
  };
}

function certificateNode(certificate: SiteContent["certificates"][number]): JsonLdNode {
  return {
    "@type": "EducationalOccupationalCredential",
    name: certificate.title,
    credentialCategory: "certificate",
    url: certificate.credentialUrl,
    ...(certificate.issuer
      ? { recognizedBy: { "@type": "Organization", name: certificate.issuer } }
      : {}),
  };
}

function poemNode(content: SiteContent, poem: SiteContentPoem): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": poem.url,
    url: poem.url,
    name: poem.title,
    headline: poem.title,
    text: poem.body,
    genre: "Poetry",
    inLanguage: poem.language,
    datePublished: poem.date,
    image: poem.imageUrl,
    author: { "@type": "Person", name: content.site.owner, url: content.site.url },
    copyrightHolder: { "@type": "Person", name: content.site.owner },
    copyrightYear: Number(poem.date.slice(0, 4)),
    isPartOf: {
      "@type": "CollectionPage",
      name: "Poems by Denny K. Schuldt",
      url: content.poems.collectionUrl,
    },
  };
}

export function buildStructuredData(
  content: SiteContent,
  routeParts: readonly string[],
): JsonLdNode | JsonLdNode[] | null {
  const [section, slug] = routeParts;

  if (section === "poems" && slug) {
    const poem = content.poems.items.find((entry) => entry.slug === slug);
    return poem ? poemNode(content, poem) : null;
  }

  const graph: JsonLdNode[] = [personNode(content), websiteNode(content)];

  if (!section) {
    graph.push({
      "@type": "WebPage",
      "@id": content.site.url,
      url: content.site.url,
      name: content.site.name,
      description: content.site.description,
      primaryImageOfPage: routeImage(content, "/"),
      isPartOf: { "@id": websiteId(content) },
      about: { "@id": personId(content) },
      hasPart: content.sections.map((entry) => ({
        "@type": "WebPage",
        name: entry.label,
        url: entry.url,
        description: entry.summary,
      })),
    });
  } else if (section === "about") {
    graph.push({
      "@type": "ProfilePage",
      "@id": content.person.url,
      url: content.person.url,
      name: `About ${content.person.name}`,
      primaryImageOfPage: routeImage(content, "/about"),
      isPartOf: { "@id": websiteId(content) },
      mainEntity: { "@id": personId(content) },
    });
  } else if (section === "projects") {
    graph.push(
      collectionPageNode(
        content,
        "/projects",
        content.selectedWork.title,
        content.routes.find((route) => route.path === "/projects")?.description ?? "",
        content.projects.map(projectNode),
      ),
    );
  } else if (section === "certificates" && !slug) {
    graph.push(
      collectionPageNode(
        content,
        "/certificates",
        "Certificates",
        content.routes.find((route) => route.path === "/certificates")?.description ?? "",
        content.certificates.map(certificateNode),
      ),
    );
  } else if (section === "poems" && !slug) {
    graph.push(
      collectionPageNode(
        content,
        "/poems",
        "Poems by Denny K. Schuldt",
        content.routes.find((route) => route.path === "/poems")?.description ?? "",
        content.poems.items.map((poem) => ({
          "@type": "CreativeWork",
          "@id": poem.url,
          name: poem.title,
          url: poem.url,
          genre: "Poetry",
          inLanguage: poem.language,
          datePublished: poem.date,
        })),
      ),
    );
  } else if (section === "phone") {
    graph.push({
      "@type": "WebPage",
      "@id": `${content.site.url.replace(/\/$/, "")}/phone`,
      url: `${content.site.url.replace(/\/$/, "")}/phone`,
      name: "Phone",
      description: content.phone.summary,
      primaryImageOfPage: routeImage(content, "/phone"),
      isPartOf: { "@id": websiteId(content) },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeJsonLd(data: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
