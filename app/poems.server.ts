import fs from "node:fs/promises";
import path from "node:path";
import {
  normalizePoemSlug,
  parsePoemFrontmatter,
  parsePoemMarkdown,
} from "../src/scene/content/poems.ts";
import type { PoemManifestEntry, PoemRecord } from "../src/scene/content/poems.ts";

const IMAGE_FILE = /^image\.(?:avif|gif|jpe?g|png|webp)$/i;

export interface StaticPoemPreview extends PoemRecord {
  slug: string;
  folder: string;
  imagePath: string;
}

export async function getStaticPoemPreviews(): Promise<StaticPoemPreview[]> {
  const root = path.resolve(process.cwd(), "public/poems");
  let folders: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    folders = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const poems = (
    await Promise.all(
      folders
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const directory = path.join(root, entry.name);
          try {
            const files = await fs.readdir(directory);
            const image = files.find((file) => IMAGE_FILE.test(file));
            if (!image) return null;
            const markdown = await fs.readFile(path.join(directory, "poem.md"), "utf8");
            const frontmatter = parsePoemFrontmatter(markdown, entry.name);
            const content = parsePoemMarkdown(markdown, entry.name);
            const imagePath = `/poems/${encodeURIComponent(entry.name)}/${encodeURIComponent(image)}`;
            const contentUrl = `/poems/${encodeURIComponent(entry.name)}/poem.md`;
            return {
              slug: frontmatter.slug ?? normalizePoemSlug(entry.name, entry.name),
              folder: entry.name,
              date: frontmatter.date ?? entry.name,
              title: frontmatter.title ?? content.title,
              body: content.body,
              imagePath,
              imageUrl: imagePath,
              contentUrl,
              language: frontmatter.language ?? "es",
              sourceRef: "master",
            } satisfies StaticPoemPreview;
          } catch {
            return null;
          }
        }),
    )
  ).filter((poem): poem is StaticPoemPreview => poem !== null);
  return poems.sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date) || b.date.localeCompare(a.date),
  );
}

export async function getStaticPoemManifest(): Promise<PoemManifestEntry[]> {
  return (await getStaticPoemPreviews()).map(
    ({ folder: _folder, imagePath: _imagePath, body: _body, ...poem }) => poem,
  );
}

// Machine-readable discovery files are published at the canonical root site.
const siteOrigin = () =>
  `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://denkschuldt.github.io").replace(/\/$/, "")}`;
const absoluteUrl = (pathname: string) =>
  `${siteOrigin()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const summary = (body: string, limit = 240) => {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
};

export async function getPoemsSitemapXml() {
  const poems = await getStaticPoemPreviews();
  const scenes = ["/", "/about", "/certificates", "/projects", "/phone", "/poems"];
  const urls = [
    ...scenes.map((pathname) => ({
      url: absoluteUrl(pathname),
      lastmod: pathname === "/poems" ? poems[0]?.date : undefined,
    })),
    ...poems.map((poem) => ({ url: absoluteUrl(`/poems/${poem.slug}`), lastmod: poem.date })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ url, lastmod }) => `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""}\n  </url>`).join("\n")}\n</urlset>\n`;
}

export async function getPoemsAtomFeed() {
  const poems = await getStaticPoemPreviews();
  const collectionUrl = absoluteUrl("/poems"),
    feedUrl = absoluteUrl("/poems/feed.xml");
  const updated = `${poems[0]?.date ?? "2023-01-01"}T00:00:00Z`;
  const entries = poems
    .map((poem) => {
      const url = absoluteUrl(`/poems/${poem.slug}`),
        published = `${poem.date}T00:00:00Z`;
      return `  <entry>\n    <title>${escapeXml(poem.title)}</title>\n    <id>${escapeXml(url)}</id>\n    <link href="${escapeXml(url)}"/>\n    <published>${published}</published>\n    <updated>${published}</updated>\n    <author><name>Denny K. Schuldt</name></author>\n    <summary>${escapeXml(summary(poem.body))}</summary>\n    <content type="text">${escapeXml(poem.body)}</content>\n  </entry>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="es">\n  <title>Poems by Denny K. Schuldt</title>\n  <id>${escapeXml(collectionUrl)}</id>\n  <link href="${escapeXml(collectionUrl)}"/>\n  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml"/>\n  <updated>${updated}</updated>\n  <author><name>Denny K. Schuldt</name></author>\n${entries}\n</feed>\n`;
}

export async function getLlmsText() {
  const poems = await getStaticPoemPreviews();
  return `# Denny K. Schuldt — Poems\n\nOriginal poetry by Denny K. Schuldt. Copyright remains with the author.\n\n## Collection\n\n- [Poems](${absoluteUrl("/poems")})\n- [Atom feed](${absoluteUrl("/poems/feed.xml")})\n- [Sitemap](${absoluteUrl("/sitemap.xml")})\n\n## Poems\n\n${poems.map((poem) => `- [${poem.title}](${absoluteUrl(`/poems/${poem.slug}`)}) — [Markdown](${absoluteUrl(poem.contentUrl)}) (${poem.date}, ${poem.language})`).join("\n")}\n`;
}

export function getRobotsText() {
  return `User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`;
}
