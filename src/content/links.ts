export interface PublicLink {
  label: string;
  href: string;
}

export const PUBLIC_LINKS: readonly PublicLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/denny-schuldt/" },
  { label: "GitHub", href: "https://github.com/DenkSchuldt" },
  { label: "Instagram", href: "https://www.instagram.com/denkschuldt/" },
  { label: "X", href: "https://twitter.com/DenkSchuldt" },
  { label: "Medium", href: "https://medium.com/@DenkSchuldt" },
];

export function publicLink(label: PublicLink["label"]): PublicLink {
  const match = PUBLIC_LINKS.find((link) => link.label === label);
  if (!match) throw new Error(`No public link labelled "${label}".`);
  return match;
}
