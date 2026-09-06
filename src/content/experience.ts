export interface ExperienceEntry {
  role: string;
  company: string;
  dates: string;
  location: string;
  bullets?: readonly string[];
}

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    role: "Product Manager for Brain Studio & Connect",
    company: "Jelou",
    dates: "December 2025 – Present",
    location: "Guayaquil, Ecuador",
  },
  {
    role: "VP of Product (previously Software Developer → UX Director → VP of Product)",
    company: "Shippify",
    dates: "June 2017 – November 2025",
    location: "Ecuador, Brazil",
    bullets: [
      "Scaled Shippify’s product ecosystem from a single logistics dashboard into a " +
        "multi-module platform spanning routing, fleet management, reporting, analytics, and " +
        "delivery tracking.",
      "Evolved from hands-on developer to product leader, overseeing all web experiences " +
        "across multiple operational regions.",
      "Defined and deployed a unified design system and dark mode across the entire product " +
        "suite, improving interface consistency and usability for 24/7 logistics operations.",
      "Launched Fleet, a driver onboarding and validation module built and deployed in record " +
        "time, reducing manual verification efforts.",
      "Re-engineered the Routing Tool to handle high-volume orders through optimized " +
        "algorithms and an intuitive map-based workflow.",
      "Built and scaled Dashboards to deliver fully customizable KPI visualization with " +
        "different data sources and filters.",
      "Led UX strategy for the Tracking Page, enhancing real-time delivery transparency and " +
        "increasing customer satisfaction metrics.",
      "Managed and mentored a cross-functional team of developers and interns, fostering " +
        "ownership, experimentation, and user empathy.",
      "Partnered directly with C-level executives to align product roadmap with growth goals, " +
        "improving delivery accuracy and operational productivity.",
      "Championed accessibility, data-driven decisions, and design excellence across every " +
        "stage of the product lifecycle.",
    ],
  },
  {
    role: "UX/UI Instructor",
    company: "Coding Bootcamps, Escuela Superior Politécnica del Litoral",
    dates: "March 2023 – Present",
    location: "Guayaquil",
    bullets: [
      "Taught UX/UI fundamentals, information visualization, accessibility, and Figma.",
      "Designed and led hands-on workshops integrating Google Analytics into UX " +
        "decision-making.",
    ],
  },
  {
    role: "Software Engineer",
    company: "Pacificsoft S.A.",
    dates: "May 2017 – June 2017",
    location: "Guayaquil",
    bullets: ["Used Angular and .NET to develop a module for an airline reservation system."],
  },
  {
    role: "Software Engineer",
    company: "Datilmedia S.A.",
    dates: "March 2015 – March 2017",
    location: "Guayaquil",
    bullets: [
      "Developed Android point-of-sale (POS) app for tablets: sales process, product " +
        "management, client administration, and portable printer integration.",
      "Designed and implemented Dátil Market v1.0 using React and Redux.",
      "Built core web features in Django and React including client registration, account " +
        "receivables reports, and invoice visualization.",
    ],
  },
  {
    role: "Academic Assistant – HCI Course",
    company: "Escuela Superior Politécnica del Litoral",
    dates: "November 2014 – March 2015",
    location: "Guayaquil",
    bullets: [
      "Assisted in Android development labs covering UI layouts, SQLite, Google Maps API v2, " +
        "and activity transitions.",
    ],
  },
  {
    role: "Technical Support Assistant",
    company: "Centro de Emprendedores, Escuela Superior Politécnica del Litoral",
    dates: "June 2014 – March 2015",
    location: "Guayaquil",
    bullets: [
      "Implemented multi-site WordPress platform for Student Clubs and Professional " +
        "Associations.",
    ],
  },
  {
    role: "Intern",
    company: "Blindside Networks",
    dates: "March 2014 – May 2014",
    location: "Guayaquil",
    bullets: [
      "Built prototypes for real-time chat and video-streaming tests using Node.js, " +
        "Socket.io, and Kurento Media Framework.",
    ],
  },
  {
    role: "Intern",
    company: "Blindside Networks",
    dates: "March 2013 – May 2013",
    location: "Guayaquil",
    bullets: [
      "Enhanced platform usability by updating user interface components and refining " +
        "front-end interactions based on user feedback and platform standards.",
    ],
  },
];

export interface CareerChapter {
  id: string;
  years: string;
  label: string;
  heading: string;
  paragraphs: readonly string[];
}

export const CAREER_CHAPTERS: readonly CareerChapter[] = [
  {
    id: "now",
    years: "2025—Now",
    label: "Now",
    heading: "Product, systems and AI",
    paragraphs: [
      "I work across product strategy, technology and user experience, currently building " +
        "AI-enabled products at Jelou.",
      "My role is to connect complex systems with experiences people can actually use.",
    ],
  },
  {
    id: "leadership",
    years: "2017—2025",
    label: "Product Leadership",
    heading: "From products to ecosystems",
    paragraphs: [
      "At Shippify, my scope grew from individual product decisions to product strategy, " +
        "platforms and teams.",
      "I worked across routing, fleet management, scheduling, automations, operational tools " +
        "and driver experiences.",
      "Over time, the question became less “what should we build?” and more “what problem is " +
        "worth solving?”",
    ],
  },
  {
    id: "product",
    years: "2017—2025",
    label: "Product & UX",
    heading: "Making complexity usable",
    paragraphs: [
      "I moved from building systems to shaping how people interact with them.",
      "That meant understanding workflows, simplifying complexity and questioning what should " +
        "exist before deciding how to build it.",
    ],
  },
  {
    id: "engineering",
    years: "2015—2017",
    label: "Engineering",
    heading: "Understanding systems from the inside",
    paragraphs: [
      "I started as a software engineer.",
      "That foundation still shapes how I think about products: through constraints, " +
        "dependencies and the systems beneath the interface.",
    ],
  },
  {
    id: "foundations",
    years: "2013—2015",
    label: "Foundations",
    heading: "Where it started",
    paragraphs: [
      "Computer Science, early technical roles and a lot of curiosity.",
      "The tools changed.",
      "The questions got bigger.",
    ],
  },
];
