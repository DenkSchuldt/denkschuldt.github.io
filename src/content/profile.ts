export interface Profile {
  name: string;
  headline: string;
  location: string;
  bio: readonly string[];
  bioShort: readonly string[];
  languages: string;
  onlineHandle: string;
}

export const PROFILE: Profile = {
  name: "Denny K. Schuldt",
  headline: "About me",
  location: "Guayaquil, Ecuador",
  bio: [
    "I build products that think clearly and experiences that move with purpose.",
    "For over a decade, I’ve worked at the intersection of software engineering, UX, and " +
      "product strategy, turning complex systems into experiences that feel intuitive, " +
      "scalable, and human. My background spans hands-on development, real-time systems, and " +
      "leading product strategy for technology used in complex operations.",
    "I’ve also taught UX/UI at Coding Bootcamps ESPOL, sharing what I’ve learned about " +
      "usability, analytics, and the creative possibilities of generative AI.",
    "Curiosity and precision guide what I build. I care about understanding how things work, " +
      "why people use them, and how technology can serve them better.",
  ],
  bioShort: [
    "I build products that think clearly and experiences that feel human.",
    "For over a decade, I’ve worked at the intersection of software engineering, UX, and " +
      "product strategy—turning complex systems into intuitive, scalable experiences that " +
      "create real impact.",
    "I care about understanding how things work, why people use them, and how technology can " +
      "serve them better.",
    "I’ve also taught UX/UI, shared what I’ve learned in bootcamps, and explored the creative " +
      "possibilities of generative AI.",
  ],
  languages:
    "Hablante nativo de Español, fluent in English, and conversational in Brazilian Portuguese.",
  onlineHandle: "@DenkSchuldt",
};
