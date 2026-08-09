export interface CertificateRecord {
  url: string;
  image: string;
  title: string;
  date: string;
  slug: string;
}

type CertificateSource = Omit<CertificateRecord, "slug">;
const slugifyCertificate = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const CERTIFICATE_SOURCES: CertificateSource[] = [
  {
    url: "https://online.hbs.edu/verify-certificate?dvid=PTKC6R24",
    image: "business-analytics.jpeg",
    title: "Business Analytics",
    date: "November 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/aab8be7b-092b-4381-9ad4-c6c6388b1196?r=denny-k-schuldt",
    image: "course-certificate-ux-management-strategy-and-tactics.jpg",
    title: "UX Management: Strategy and Tactics",
    date: "October 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/masterclass/mcc_39bb830818de407cb288495443738fcc?r=denny-k-schuldt",
    image:
      "masterclass-certificate-how-to-design-engaging-products-insights-from-fortnite-ux-strategy.jpg",
    title: "How to Design Engaging Products: Insights from Fortnite's UX",
    date: "August 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/masterclass/mcc_9e87d165ea6d4e53b3c42bf85e185671?r=denny-k-schuldt",
    image: "masterclass-certificate-design-patterns-for-ai-ux.jpg",
    title: "How to Elevate the User Experience of AI with Design Patterns",
    date: "August 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/bdcc9ca0-c9fd-43e1-bdf4-35a162d73deb?certificateType=course&r=denny-k-schuldt",
    image: "course-certificate-hci-thought-and-emotion.jpg",
    title: "Design for Thought and Emotion",
    date: "May 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/674a675b-00e1-4554-8286-66a9acd802ac?certificateType=course&r=denny-k-schuldt",
    image: "course-certificate-design-for-a-better-world-with-don-norman-course.jpg",
    title: "Design for a Better World with Don Norman",
    date: "May 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/masterclass/mcc_b7228b61c46b4920a174be130ce321f9?r=denny-k-schuldt",
    image:
      "masterclass-certificate-learning-experience-design-that-delivers-impact-a-step-by-step-guide.jpg",
    title: "Learning Experience Design That Delivers Impact: A Step-by-Step Guide",
    date: "May 2025",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/cd130101-b4a3-4a80-a4a3-54a992d4fbd5?r=denny-k-schuldt",
    image: "course-certificate-ai-for-designers.jpg",
    title: "AI for Designers",
    date: "April 2024",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/masterclass/mcc_22661bf7b1aa41b599672ea7eb8453b9?r=denny-k-schuldt",
    image: "masterclass-certificate-the-importance-of-emotional-intelligence-in-ux.jpg",
    title: "The Importance of Emotional Intelligence in UX",
    date: "March 2024",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/cd917770-e411-41d1-bb96-c910b9feb3ab?r=denny-k-schuldt",
    image: "course-certificate-hci-perception-and-memory.jpg",
    title: "Perception and Memory in HCI and UX",
    date: "March 2024",
  },
  {
    url: "https://www.credential.net/05270819-3832-4321-883e-b401c38de4a5#gs.6bjgtw?r=denny-k-schuldt",
    image: "certificate-pm-colectivo23.54bf54a8.png",
    title: "Product Management",
    date: "January 2024",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/309f9f8f-5977-4f10-a3c9-405ca32af763?r=denny-k-schuldt",
    image: "course-certificate-journey-mapping.jpg",
    title: "Journey Mapping",
    date: "December 2023",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/1dc1d6bb-f2f3-453f-a50b-6207feb12c82?r=denny-k-schuldt",
    image: "course-certificate-accessibility-how-to-design-for-all.jpg",
    title: "Accessibility: How to Design for All",
    date: "October 2021",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/53376127-fcaa-4ae4-8b76-6e5073a48b67?r=denny-k-schuldt",
    image: "course-certificate-information-visualization-getting-dashboards-right.jpg",
    title: "Information Visualization: Getting Dashboards Right",
    date: "October 2021",
  },
  {
    url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/4d50e6f2-10d5-4212-8f3b-371475323472?r=denny-k-schuldt",
    image: "course-certificate-data-driven-design-quantitative-research-for-ux.jpg",
    title: "Data-Driven Design: Quantitative Research for UX",
    date: "September 2021",
  },
];

export const CERTIFICATES: CertificateRecord[] = CERTIFICATE_SOURCES.map((record) => ({
  ...record,
  slug: slugifyCertificate(record.title),
}));
export const CERTIFICATE_LAYOUT = [
  {
    index: 0,
    row: 0,
    column: 0,
    x: -0.825,
    y: 1.275,
    rotation: -0.026,
    tiltY: 0.018,
    scale: 1.04,
    depth: 0.372,
  },
  {
    index: 1,
    row: 0,
    column: 1,
    x: -0.275,
    y: 1.275,
    rotation: 0.014,
    tiltY: -0.012,
    scale: 0.93,
    depth: 0.36,
  },
  {
    index: 2,
    row: 0,
    column: 2,
    x: 0.275,
    y: 1.275,
    rotation: -0.008,
    tiltY: 0.015,
    scale: 0.97,
    depth: 0.368,
  },
  {
    index: 3,
    row: 0,
    column: 3,
    x: 0.825,
    y: 1.275,
    rotation: 0.032,
    tiltY: -0.02,
    scale: 0.88,
    depth: 0.354,
  },
  {
    index: 4,
    row: 1,
    column: 0,
    x: -0.825,
    y: 0.425,
    rotation: 0.018,
    tiltY: -0.014,
    scale: 0.91,
    depth: 0.362,
  },
  {
    index: 5,
    row: 1,
    column: 1,
    x: -0.275,
    y: 0.425,
    rotation: -0.022,
    tiltY: 0.012,
    scale: 0.99,
    depth: 0.374,
  },
  {
    index: 6,
    row: 1,
    column: 2,
    x: 0.275,
    y: 0.425,
    rotation: 0.026,
    tiltY: -0.016,
    scale: 0.92,
    depth: 0.358,
  },
  {
    index: 7,
    row: 1,
    column: 3,
    x: 0.825,
    y: 0.425,
    rotation: -0.012,
    tiltY: 0.02,
    scale: 0.86,
    depth: 0.37,
  },
  {
    index: 8,
    row: 2,
    column: 0,
    x: -0.62,
    y: -0.425,
    rotation: -0.024,
    tiltY: 0.016,
    scale: 0.96,
    depth: 0.368,
  },
  {
    index: 9,
    row: 2,
    column: 1,
    x: 0,
    y: -0.425,
    rotation: 0.012,
    tiltY: -0.012,
    scale: 1.06,
    depth: 0.38,
  },
  {
    index: 10,
    row: 2,
    column: 2,
    x: 0.62,
    y: -0.425,
    rotation: 0.028,
    tiltY: 0.018,
    scale: 0.93,
    depth: 0.36,
  },
  {
    index: 11,
    row: 3,
    column: 0,
    x: -0.825,
    y: -1.275,
    rotation: 0.026,
    tiltY: -0.016,
    scale: 0.89,
    depth: 0.36,
  },
  {
    index: 12,
    row: 3,
    column: 1,
    x: -0.275,
    y: -1.275,
    rotation: -0.016,
    tiltY: 0.012,
    scale: 0.97,
    depth: 0.374,
  },
  {
    index: 13,
    row: 3,
    column: 2,
    x: 0.275,
    y: -1.275,
    rotation: 0.018,
    tiltY: -0.018,
    scale: 0.91,
    depth: 0.362,
  },
  {
    index: 14,
    row: 3,
    column: 3,
    x: 0.825,
    y: -1.275,
    rotation: -0.022,
    tiltY: 0.02,
    scale: 0.94,
    depth: 0.366,
  },
] as const;
export interface CertificateFocus {
  x: number;
  y: number;
  slug: string;
}
export function getCertificateFocusBySlug(slug?: string | null): CertificateFocus | null {
  if (!slug) return null;
  const index = CERTIFICATES.findIndex((certificate) => certificate.slug === slug);
  const position = CERTIFICATE_LAYOUT.find((item) => item.index === index);
  return index < 0 || !position ? null : { x: position.x, y: position.y, slug };
}
