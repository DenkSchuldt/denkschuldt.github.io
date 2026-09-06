export const SITE = {
  name: "Denny's Workspace",
  owner: "Denny K. Schuldt",
  tagline: "I turn complex things into experiences people can feel.",
  description:
    "Denny K. Schuldt's portfolio, rendered as an interactive 3D room — software " +
    "engineering and product work, poetry, and certificates to explore.",
  summary:
    "Denny's Workspace is a personal portfolio built as one persistent 3D room. " +
    "Each section — About, Projects, Certificates, and Poems — is a place in that " +
    "room with its own canonical URL.",
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
    summary: "Who Denny K. Schuldt is, how he works, and where to find him.",
  },
  {
    id: "projects",
    label: "Projects",
    path: "/projects",
    summary: "Selected work, professional experience, and independent experiments.",
  },
  {
    id: "certificates",
    label: "Certificates",
    path: "/certificates",
    summary: "Professional certifications and credentials, most recent first.",
  },
  {
    id: "poems",
    label: "Poems",
    path: "/poems",
    summary: "Original poetry by Denny K. Schuldt, newest first.",
  },
  {
    id: "phone",
    label: "Phone",
    path: "/phone",
    summary: "denkOS, the workspace phone — a pointer to the latest poem.",
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
      "Denny K. Schuldt builds products that think clearly and experiences that move " +
      "with purpose, working at the intersection of software engineering, UX, and " +
      "product strategy.",
    indexable: true,
    ogImage: "/og/about.jpg",
  },
  {
    path: "/projects",
    title: "Projects — Denny K. Schuldt",
    description:
      "Selected work by Denny K. Schuldt: a decade of product and engineering across " +
      "logistics platforms, plus independent experiments.",
    indexable: true,
    ogImage: "/og/projects.jpg",
  },
  {
    path: "/certificates",
    title: "Certificates — Denny K. Schuldt",
    description:
      "Professional certifications held by Denny K. Schuldt, covering UX management, " +
      "AI design, HCI, accessibility, and product management.",
    indexable: true,
    ogImage: "/og/certificates.jpg",
  },
  {
    path: "/phone",
    title: "Phone — Denny K. Schuldt",
    description:
      "denkOS, the workspace phone. Its lock screen surfaces the latest poem. No private " +
      "data lives here.",
    indexable: true,
    ogImage: "/og/phone.jpg",
  },
  {
    path: "/poems",
    title: "Poems — Denny K. Schuldt",
    description: "Original poetry by Denny K. Schuldt, presented as a cinematic writing portfolio.",
    indexable: true,
    ogImage: "/og/poems.jpg",
  },
];
