import {
  CERTIFICATES,
  certificateImagePath,
  certificateIssuer,
} from "../src/content/certificates.ts";
import { CAREER_CHAPTERS, EXPERIENCE } from "../src/content/experience.ts";
import { PUBLIC_LINKS } from "../src/content/links.ts";
import { PHONE_SUMMARY } from "../src/content/phone.ts";
import { PROFILE } from "../src/content/profile.ts";
import { PROJECTS, SELECTED_WORK } from "../src/content/projects.ts";
import { SITE, SITE_ROUTES, SITE_SECTIONS } from "../src/content/site.ts";
import { getStaticPoemPreviews } from "./poems.server.ts";
import { canonicalUrl, clip, escapeXml } from "./site-url.ts";

import type { CareerChapter, ExperienceEntry } from "../src/content/experience.ts";
import type { PublicLink } from "../src/content/links.ts";
import type { StaticPoemPreview } from "./poems.server.ts";

export interface SiteContentPoem {
  slug: string;
  title: string;
  date: string;
  language: string;
  url: string;
  markdownUrl: string;
  imageUrl: string;
  body: string;
}

export interface SiteContentCertificate {
  title: string;
  slug: string;
  date: string;
  issuer: string | null;
  credentialUrl: string;
  imageUrl: string;
}

export interface SiteContentProject {
  title: string;
  dates: string;
  description: string;
  url: string;
  imageUrl: string;
}

export interface SiteContentRoute {
  path: string;
  url: string;
  title: string;
  description: string;
  indexable: boolean;
  ogImage: string;
}

export interface SiteContent {
  origin: string;
  site: {
    name: string;
    owner: string;
    tagline: string;
    description: string;
    summary: string;
    url: string;
    locale: string;
  };
  person: {
    name: string;
    headline: string;
    location: string;
    tagline: string;
    bio: readonly string[];
    bioShort: readonly string[];
    languages: string;
    links: readonly PublicLink[];
    url: string;
  };
  sections: readonly { id: string; label: string; path: string; url: string; summary: string }[];
  experience: readonly ExperienceEntry[];
  careerChapters: readonly CareerChapter[];
  selectedWork: typeof SELECTED_WORK;
  projects: readonly SiteContentProject[];
  certificates: readonly SiteContentCertificate[];
  phone: {
    summary: string;
    poemsUrl: string;
  };
  poems: {
    collectionUrl: string;
    feedUrl: string;
    items: readonly SiteContentPoem[];
  };
  routes: readonly SiteContentRoute[];
  resources: {
    sitemap: string;
    robots: string;
    llms: string;
    llmsFull: string;
    siteJson: string;
    poemsFeed: string;
    poemsManifest: string;
    aboutMarkdown: string;
    projectsMarkdown: string;
    certificatesMarkdown: string;
  };
}

function toContentPoem(poem: StaticPoemPreview): SiteContentPoem {
  return {
    slug: poem.slug,
    title: poem.title,
    date: poem.date,
    language: poem.language,
    url: canonicalUrl(`/poems/${poem.slug}`),
    markdownUrl: canonicalUrl(poem.contentUrl),
    imageUrl: canonicalUrl(poem.imagePath),
    body: poem.body,
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  const poemPreviews = await getStaticPoemPreviews();
  const poems = poemPreviews.map(toContentPoem);

  return {
    origin: canonicalUrl("/"),
    site: {
      name: SITE.name,
      owner: SITE.owner,
      tagline: SITE.tagline,
      description: SITE.description,
      summary: SITE.summary,
      url: canonicalUrl("/"),
      locale: SITE.locale,
    },
    person: {
      name: PROFILE.name,
      headline: PROFILE.headline,
      location: PROFILE.location,
      tagline: SITE.tagline,
      bio: PROFILE.bio,
      bioShort: PROFILE.bioShort,
      languages: PROFILE.languages,
      links: PUBLIC_LINKS,
      url: canonicalUrl("/about"),
    },
    sections: SITE_SECTIONS.map((section) => ({
      ...section,
      url: canonicalUrl(section.path),
    })),
    experience: EXPERIENCE,
    careerChapters: CAREER_CHAPTERS,
    selectedWork: SELECTED_WORK,
    projects: PROJECTS.map((project) => ({
      title: project.title,
      dates: project.dates,
      description: project.description,
      url: project.url,
      imageUrl: canonicalUrl(project.previewImage),
    })),
    certificates: CERTIFICATES.map((certificate) => ({
      title: certificate.title,
      slug: certificate.slug,
      date: certificate.date,
      issuer: certificateIssuer(certificate),
      credentialUrl: certificate.url,
      imageUrl: canonicalUrl(certificateImagePath(certificate)),
    })),
    phone: {
      summary: PHONE_SUMMARY,
      poemsUrl: canonicalUrl("/poems"),
    },
    poems: {
      collectionUrl: canonicalUrl("/poems"),
      feedUrl: canonicalUrl("/poems/feed.xml"),
      items: poems,
    },
    routes: [
      ...SITE_ROUTES.map((route) => ({
        ...route,
        url: canonicalUrl(route.path),
        ogImage: canonicalUrl(route.ogImage),
      })),
      ...poems.map((poem) => ({
        path: `/poems/${poem.slug}`,
        url: poem.url,
        title: `${poem.title} — Denny K. Schuldt`,
        description: clip(poem.body, 180),
        indexable: true,
        ogImage: poem.imageUrl,
      })),
    ],
    resources: {
      sitemap: canonicalUrl("/sitemap.xml"),
      robots: canonicalUrl("/robots.txt"),
      llms: canonicalUrl("/llms.txt"),
      llmsFull: canonicalUrl("/llms-full.txt"),
      siteJson: canonicalUrl("/site.json"),
      poemsFeed: canonicalUrl("/poems/feed.xml"),
      poemsManifest: canonicalUrl("/poems-manifest.json"),
      aboutMarkdown: canonicalUrl("/about.md"),
      projectsMarkdown: canonicalUrl("/projects.md"),
      certificatesMarkdown: canonicalUrl("/certificates.md"),
    },
  };
}

export async function getRobotsText(): Promise<string> {
  const { resources } = await getSiteContent();
  return [
    "User-agent: *",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    `Sitemap: ${resources.sitemap}`,
    "",
  ].join("\n");
}

export async function getSitemapXml(): Promise<string> {
  const content = await getSiteContent();
  const latestPoemDate = content.poems.items[0]?.date;
  const entries = content.routes
    .filter((route) => route.indexable)
    .map((route) => {
      const lastmod =
        route.path === "/poems"
          ? latestPoemDate
          : route.path.startsWith("/poems/")
            ? content.poems.items.find((poem) => poem.url === route.url)?.date
            : undefined;
      return `  <url>\n    <loc>${escapeXml(route.url)}</loc>${
        lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""
      }\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export async function getLlmsText(): Promise<string> {
  const c = await getSiteContent();
  const lines: string[] = [
    `# ${c.site.name}`,
    "",
    `> ${c.site.description}`,
    "",
    c.site.summary,
    "",
    "## Sections",
    "",
    ...c.sections.map((section) => `- [${section.label}](${section.url}) — ${section.summary}`),
    "",
    "## About",
    "",
    `${c.person.name} — ${c.person.tagline}`,
    "",
    c.person.bio[0],
    "",
    `Based in ${c.person.location}. ${c.person.languages}`,
    "",
    "### Links",
    "",
    ...c.person.links.map((link) => `- [${link.label}](${link.href})`),
    "",
    "## Selected Work",
    "",
    ...c.careerChapters.map(
      (chapter) => `- **${chapter.years} · ${chapter.heading}** — ${chapter.paragraphs[0]}`,
    ),
    "",
    "### Experience",
    "",
    ...c.experience.map(
      (entry) => `- ${entry.role}, ${entry.company} (${entry.dates}, ${entry.location})`,
    ),
    "",
    "### Projects",
    "",
    ...c.projects.map((project) => `- [${project.title}](${project.url}) — ${project.description}`),
    "",
    "## Certificates",
    "",
    ...c.certificates.map(
      (certificate) =>
        `- [${certificate.title}](${certificate.credentialUrl})${
          certificate.issuer ? ` — ${certificate.issuer}` : ""
        } (${certificate.date})`,
    ),
    "",
    "## Poems",
    "",
    `Original poetry by ${c.site.owner}. Copyright remains with the author.`,
    "",
    `- [All poems](${c.poems.collectionUrl})`,
    `- [Atom feed](${c.poems.feedUrl})`,
    "",
    ...c.poems.items.map(
      (poem) =>
        `- [${poem.title}](${poem.url}) — [Markdown](${poem.markdownUrl}) (${poem.date}, ${poem.language})`,
    ),
    "",
    "## Machine-readable resources",
    "",
    `- [Full text](${c.resources.llmsFull})`,
    `- [Site manifest](${c.resources.siteJson})`,
    `- [Sitemap](${c.resources.sitemap})`,
    `- [Poems feed](${c.resources.poemsFeed})`,
    `- [Poems manifest](${c.resources.poemsManifest})`,
    "",
  ];
  return `${lines.join("\n")}`;
}

export async function getLlmsFullText(): Promise<string> {
  const c = await getSiteContent();
  const blocks: string[] = [
    `# ${c.site.name}`,
    "",
    `> ${c.site.description}`,
    "",
    c.site.summary,
    "",
    `Canonical site: ${c.site.url}`,
    "",
    "---",
    "",
    "## About",
    "",
    `# ${c.person.name}`,
    "",
    ...c.person.bio.flatMap((paragraph) => [paragraph, ""]),
    `Based in ${c.person.location}. ${c.person.languages}`,
    "",
    "Links:",
    ...c.person.links.map((link) => `- ${link.label}: ${link.href}`),
    "",
    "---",
    "",
    "## Selected Work",
    "",
    ...c.careerChapters.flatMap((chapter) => [
      `### ${chapter.years} — ${chapter.heading} (${chapter.label})`,
      "",
      ...chapter.paragraphs,
      "",
    ]),
    "### Experience",
    "",
    ...c.experience.flatMap((entry) => [
      `#### ${entry.role} — ${entry.company}`,
      `${entry.dates} · ${entry.location}`,
      "",
      ...(entry.bullets ?? []).map((bullet) => `- ${bullet}`),
      ...(entry.bullets ? [""] : []),
    ]),
    `### ${c.selectedWork.independentExperiments.heading}`,
    "",
    ...c.selectedWork.independentExperiments.paragraphs,
    "",
    ...c.projects.flatMap((project) => [
      `#### ${project.title} (${project.dates})`,
      project.description,
      `Link: ${project.url}`,
      "",
    ]),
    "---",
    "",
    "## Certificates",
    "",
    ...c.certificates.map(
      (certificate) =>
        `- ${certificate.title}${certificate.issuer ? ` — ${certificate.issuer}` : ""} (${
          certificate.date
        }) — ${certificate.credentialUrl}`,
    ),
    "",
    "---",
    "",
    "## Phone",
    "",
    c.phone.summary,
    "",
    "---",
    "",
    "## Poems",
    "",
    `Original poetry by ${c.site.owner}. Copyright remains with the author.`,
    "",
    ...c.poems.items.flatMap((poem) => [
      `### ${poem.title}`,
      `${poem.date} · ${poem.language} · ${poem.url}`,
      "",
      poem.body,
      "",
    ]),
  ];
  return `${blocks.join("\n")}\n`;
}

export async function getSiteJson(): Promise<string> {
  const c = await getSiteContent();
  const manifest = {
    schemaVersion: 1,
    generatedFrom: "src/content + public/poems",
    site: {
      name: c.site.name,
      description: c.site.description,
      summary: c.site.summary,
      url: c.site.url,
      locale: c.site.locale,
    },
    person: {
      name: c.person.name,
      headline: c.person.tagline,
      location: c.person.location,
      bio: c.person.bio,
      languages: c.person.languages,
      url: c.person.url,
      links: c.person.links,
    },
    routes: c.routes.map((route) => ({
      path: route.path,
      url: route.url,
      title: route.title,
      description: route.description,
      indexable: route.indexable,
    })),
    sections: c.sections.map((section) => ({
      id: section.id,
      label: section.label,
      url: section.url,
      summary: section.summary,
    })),
    experience: c.experience.map((entry) => ({
      role: entry.role,
      company: entry.company,
      dates: entry.dates,
      location: entry.location,
      highlights: entry.bullets ?? [],
    })),
    projects: c.projects.map((project) => ({
      title: project.title,
      dates: project.dates,
      description: project.description,
      url: project.url,
      image: project.imageUrl,
    })),
    certificates: c.certificates.map((certificate) => ({
      title: certificate.title,
      issuer: certificate.issuer,
      date: certificate.date,
      credentialUrl: certificate.credentialUrl,
      image: certificate.imageUrl,
      url: `${c.site.url.replace(/\/$/, "")}/certificates/${certificate.slug}`,
    })),
    poems: {
      collection: c.poems.collectionUrl,
      feed: c.poems.feedUrl,
      items: c.poems.items.map((poem) => ({
        slug: poem.slug,
        title: poem.title,
        date: poem.date,
        language: poem.language,
        url: poem.url,
        markdown: poem.markdownUrl,
        image: poem.imageUrl,
      })),
    },
    links: c.person.links,
    resources: c.resources,
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function getAboutMarkdown(): Promise<string> {
  const c = await getSiteContent();
  return [
    `# ${c.person.name}`,
    "",
    ...c.person.bio.flatMap((paragraph) => [paragraph, ""]),
    `Based in ${c.person.location}. ${c.person.languages}`,
    "",
    "## Links",
    "",
    ...c.person.links.map((link) => `- [${link.label}](${link.href})`),
    "",
    `Canonical page: ${c.person.url}`,
    "",
  ].join("\n");
}

export async function getProjectsMarkdown(): Promise<string> {
  const c = await getSiteContent();
  return [
    `# ${c.selectedWork.title}`,
    "",
    `By ${c.site.owner}.`,
    "",
    "## Career",
    "",
    ...c.careerChapters.flatMap((chapter) => [
      `### ${chapter.years} — ${chapter.heading}`,
      "",
      ...chapter.paragraphs,
      "",
    ]),
    "## Experience",
    "",
    ...c.experience.flatMap((entry) => [
      `### ${entry.role} — ${entry.company}`,
      `${entry.dates} · ${entry.location}`,
      "",
      ...(entry.bullets ?? []).map((bullet) => `- ${bullet}`),
      ...(entry.bullets ? [""] : []),
    ]),
    `## ${c.selectedWork.independentExperiments.heading}`,
    "",
    ...c.selectedWork.independentExperiments.paragraphs,
    "",
    ...c.projects.map(
      (project) =>
        `- [${project.title}](${project.url}) — ${project.description} (${project.dates})`,
    ),
    "",
    `Canonical page: ${canonicalUrl("/projects")}`,
    "",
  ].join("\n");
}

export async function getCertificatesMarkdown(): Promise<string> {
  const c = await getSiteContent();
  return [
    "# Certificates",
    "",
    `Professional certifications held by ${c.site.owner}, most recent first.`,
    "",
    ...c.certificates.map((certificate) => {
      const issuer = certificate.issuer ? `, ${certificate.issuer}` : "";
      return `- [${certificate.title}](${certificate.credentialUrl}) — ${certificate.date}${issuer}`;
    }),
    "",
    `Canonical page: ${canonicalUrl("/certificates")}`,
    "",
  ].join("\n");
}
