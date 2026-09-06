export interface Project {
  title: string;
  dates: string;
  description: string;
  url: string;
  previewImage: string;
  previewAlt: string;
}

export const PROJECTS: readonly Project[] = [
  {
    title: "Aventuras en 360°",
    dates: "2016 – Present",
    description:
      "A collection of interactive spherical photography from touristic places, captured and " +
      "shared through React.",
    url: "https://denkschuldt.github.io/360",
    previewImage: "/projects/360.png",
    previewAlt: "Aventuras en 360° project preview",
  },
  {
    title: "@denkschuldt/react-dialog",
    dates: "2021 – Present",
    description: "A simple to use and customizable React dialog implementation.",
    url: "https://www.npmjs.com/package/@denkschuldt/react-dialog",
    previewImage: "/projects/react-dialog.png",
    previewAlt: "@denkschuldt/react-dialog project preview",
  },
];

export const SELECTED_WORK = {
  eyebrow: "Denny K. Schuldt",
  title: "Selected Work",
  independentExperiments: {
    heading: "Independent Experiments",
    paragraphs: [
      "A space to build without organizational constraints.",
      "Product, interaction, engineering and visual direction — all in one place.",
    ],
  },
} as const;
