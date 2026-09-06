import { SITE } from "../src/content/site.ts";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const siteOrigin = () =>
  trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? SITE.defaultOrigin);

export const basePath = () => trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_PATH ?? "");

const withLeadingSlash = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const canonicalUrl = (path: string) => {
  const normalized = withLeadingSlash(path);
  return normalized === "/" ? `${siteOrigin()}/` : `${siteOrigin()}${normalized}`;
};

export const hrefFor = (path: string) => `${basePath()}${withLeadingSlash(path)}`;

export const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const clip = (text: string, limit: number) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= limit
    ? normalized
    : `${normalized.slice(0, limit).replace(/\s+\S*$/, "")}…`;
};
