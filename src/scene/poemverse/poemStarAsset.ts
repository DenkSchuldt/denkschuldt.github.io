const POEM_STAR_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100">',
  "<defs>",
  '<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">',
  '<stop offset="0.38" stop-color="#e2bf98" stop-opacity="0.5"/>',
  '<stop offset="0.66" stop-color="#d7ae83" stop-opacity="0.16"/>',
  '<stop offset="1" stop-color="#d7ae83" stop-opacity="0"/>',
  "</radialGradient>",
  '<radialGradient id="orb" cx="0.35" cy="0.28" r="0.97">',
  '<stop offset="0" stop-color="#858ba8"/>',
  '<stop offset="0.52" stop-color="#ab8eb8"/>',
  '<stop offset="0.93" stop-color="#d7ae83"/>',
  "</radialGradient>",
  "</defs>",
  '<circle cx="50" cy="50" r="50" fill="url(#glow)"/>',
  '<circle cx="50" cy="50" r="30" fill="url(#orb)"/>',
  "</svg>",
].join("");

export const POEM_STAR_IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(POEM_STAR_SVG)}`;

export const POEM_STAR_ORB_RATIO = 0.6;

export const POEM_STAR_COLORS = {
  highlight: "#858ba8",
  body: "#ab8eb8",
  rim: "#d7ae83",
} as const;
