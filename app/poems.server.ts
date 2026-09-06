import fs from "node:fs/promises";
import path from "node:path";

import {
  normalizePoemSlug,
  parsePoemFrontmatter,
  parsePoemMarkdown,
} from "../src/scene/content/poems.ts";
import { canonicalUrl, clip, escapeXml } from "./site-url.ts";

import type { Dirent } from "node:fs";
import type { PoemManifestEntry, PoemRecord } from "../src/scene/content/poems.ts";

const IMAGE_FILE = /^image\.(?:avif|gif|jpe?g|png|webp)$/i;

export interface StaticPoemPreview extends PoemRecord {
  slug: string;
  folder: string;
  imagePath: string;
}

export async function getStaticPoemPreviews(): Promise<StaticPoemPreview[]> {
  const root = path.resolve(process.cwd(), "public/poems");
  let folders: Dirent[];
  try {
    folders = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const poems = (
    await Promise.all(
      folders
        .filter((entry) => entry.isDirectory())
        .map(async (entry): Promise<StaticPoemPreview | null> => {
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
    ({ slug, date, title, imageUrl, contentUrl, language, sourceRef }) => ({
      slug,
      date,
      title,
      imageUrl,
      contentUrl,
      language,
      sourceRef,
    }),
  );
}

export async function getPoemsAtomFeed() {
  const poems = await getStaticPoemPreviews();
  const collectionUrl = canonicalUrl("/poems"),
    feedUrl = canonicalUrl("/poems/feed.xml");
  const updated = `${poems[0]?.date ?? "2023-01-01"}T00:00:00Z`;
  const entries = poems
    .map((poem) => {
      const url = canonicalUrl(`/poems/${poem.slug}`),
        published = `${poem.date}T00:00:00Z`;
      return `  <entry>\n    <title>${escapeXml(poem.title)}</title>\n    <id>${escapeXml(url)}</id>\n    <link href="${escapeXml(url)}"/>\n    <published>${published}</published>\n    <updated>${published}</updated>\n    <author><name>Denny K. Schuldt</name></author>\n    <summary>${escapeXml(clip(poem.body, 240))}</summary>\n    <content type="text">${escapeXml(poem.body)}</content>\n  </entry>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="es">\n  <title>Poems by Denny K. Schuldt</title>\n  <id>${escapeXml(collectionUrl)}</id>\n  <link href="${escapeXml(collectionUrl)}"/>\n  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml"/>\n  <updated>${updated}</updated>\n  <author><name>Denny K. Schuldt</name></author>\n${entries}\n</feed>\n`;
}
