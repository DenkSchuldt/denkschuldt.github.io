import { PHONE_SUMMARY } from "./phone.ts";

export const POEMS_DESCRIPTION =
  "A collection of original poems curated by the German-Ecuadorian poet Denny K. Schuldt.";

export const SITE = {
  name: "Denny's Workspace",
  owner: "Denny K. Schuldt",
  tagline: "I turn complex things into experiences people can feel.",
  description:
    "The portfolio of Denny K. Schuldt: software engineering, UX, product strategy, " +
    "original poetry, and professional certifications.",
  summary:
    "Explore Denny K. Schuldt's work, professional background, certifications, and " +
    "original poetry.",
  defaultOrigin: "https://denkschuldt.github.io",
  locale: "en_US",
} as const;

export interface SiteSection {
  id: string;
  label: string;
  path: string;
  summary: string;
}

export const SITE_SECTIONS: readonly SiteSection[] = [
  {
    id: "about",
    label: "About",
    path: "/about",
    summary: "Denny K. Schuldt's background in software engineering, UX, and product strategy.",
  },
  {
    id: "projects",
    label: "Projects",
    path: "/projects",
    summary:
      "Product and engineering work, from logistics platforms to AI and independent projects.",
  },
  {
    id: "certificates",
    label: "Certificates",
    path: "/certificates",
    summary: "Credentials in UX, AI, accessibility, business analytics, and product management.",
  },
  {
    id: "poems",
    label: "Poems",
    path: "/poems",
    summary: POEMS_DESCRIPTION,
  },
  {
    id: "phone",
    label: "Phone",
    path: "/phone",
    summary: PHONE_SUMMARY,
  },
];

export interface SiteRoute {
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  ogImage: string;
}

export const SITE_ROUTES: readonly SiteRoute[] = [
  {
    path: "/",
    title: "Denny K. Schuldt",
    description: SITE.description,
    indexable: true,
    ogImage: "/preview.png",
  },
  {
    path: "/about",
    title: "About — Denny K. Schuldt",
    description:
      "Denny K. Schuldt brings over a decade of experience in software engineering, UX, " +
      "and product strategy to building intuitive, human experiences.",
    indexable: true,
    ogImage: "/og/about.jpg",
  },
  {
    path: "/projects",
    title: "Projects — Denny K. Schuldt",
    description:
      "Selected work by Denny K. Schuldt across product strategy, software engineering, " +
      "logistics platforms, AI-enabled products, and independent experiments.",
    indexable: true,
    ogImage: "/og/projects.jpg",
  },
  {
    path: "/certificates",
    title: "Certificates — Denny K. Schuldt",
    description:
      "Professional certifications earned by Denny K. Schuldt in UX, AI, accessibility, " +
      "business analytics, and product management.",
    indexable: true,
    ogImage: "/og/certificates.jpg",
  },
  {
    path: "/phone",
    title: "Phone — Denny K. Schuldt",
    description: PHONE_SUMMARY,
    indexable: true,
    ogImage: "/og/phone.jpg",
  },
  {
    path: "/poems",
    title: "Poems — Denny K. Schuldt",
    description: POEMS_DESCRIPTION,
    indexable: true,
    ogImage: "/og/poems.jpg",
  },
];
