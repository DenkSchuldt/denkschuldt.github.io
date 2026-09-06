import test from "node:test";
import assert from "node:assert/strict";
import {
  loadPoemContent,
  loadPoemManifest,
  normalizePoemSlug,
  parsePoemFrontmatter,
  parsePoemMarkdown,
} from "../src/scene/content/poems.ts";
import { getPoemsAtomFeed, getStaticPoemManifest } from "../app/poems.server.ts";
import { getLlmsText, getRobotsText, getSitemapXml } from "../app/site.server.ts";

test("Markdown becomes safe plain text suitable for a physical poem page", () => {
  const markdown = `---\nlang: es\n---\n# La noche\n\n***\n\n**Queda** la luz,\n[y la memoria](https://example.com).\n\n<img src=x onerror=alert(1)>\n\n***\n\nCopyright © Denny K. Schuldt 2025`;
  assert.deepEqual(parsePoemMarkdown(markdown, "2025-01-03"), {
    title: "La noche",
    body: "***\n\nQueda la luz,\ny la memoria.\n\n***\n\nCopyright © Denny K. Schuldt 2025",
  });
});

test("frontmatter owns the public poem slug", () => {
  const markdown = `---\ntitle: "Quiero"\ndate: 2023-12-30\nslug: Un Día Más\n---\n\n# Quiero\n\nTexto.`;
  assert.deepEqual(parsePoemFrontmatter(markdown, "2023-12-30"), {
    slug: "un-dia-mas",
    title: "Quiero",
    date: "2023-12-30",
    language: null,
  });
  assert.equal(normalizePoemSlug("Canción para ti", "fallback"), "cancion-para-ti");
});

test("the built manifest is the only client poem source", async () => {
  const poems = [
    {
      slug: "quiero",
      date: "2023-12-30",
      title: "Quiero",
      imageUrl: "/poems/2023-12-30/image.webp",
      contentUrl: "/poems/2023-12-30/poem.md",
      language: "es",
      sourceRef: "master",
    },
  ];
  const fetcher = async () =>
    new Response(JSON.stringify({ poems }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  assert.deepEqual(await loadPoemManifest(fetcher), poems);
});

test("poem bodies are fetched lazily from their Markdown source", async () => {
  const poem = {
    slug: "quiero",
    date: "2023-12-30",
    title: "Quiero",
    imageUrl: null,
    contentUrl: "/poems/2023-12-30/poem.md",
    language: "es",
    sourceRef: "master",
  };
  let requestCache;
  const fetcher = async (_url, init) => {
    requestCache = init?.cache;
    return new Response(`---\nslug: quiero\n---\n# Quiero\n\nQuiero escribir.`, { status: 200 });
  };
  assert.deepEqual(await loadPoemContent(poem, fetcher), { ...poem, body: "Quiero escribir." });
  assert.equal(requestCache, "no-cache");
});

test("generated discovery assets expose canonical poem URLs without bloating the manifest", async () => {
  const [manifest, sitemap, feed, llms] = await Promise.all([
    getStaticPoemManifest(),
    getSitemapXml(),
    getPoemsAtomFeed(),
    getLlmsText(),
  ]);
  const slugs = manifest.map(({ slug }) => slug);
  assert.ok(slugs.length >= 5);
  assert.deepEqual([...new Set(slugs)], slugs);
  assert.ok(slugs.includes("dear-candidate"));
  assert.ok(slugs.includes("quimica-accidental"));
  assert.deepEqual(
    manifest.map(({ date }) => Date.parse(date)),
    [...manifest]
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .map(({ date }) => Date.parse(date)),
  );
  assert.equal("body" in manifest[0], false);
  assert.match(sitemap, /https:\/\/denkschuldt\.github\.io\/poems\/the-strategy-of-the-mystery/);
  assert.match(sitemap, /https:\/\/denkschuldt\.github\.io\/poems\/quiero/);
  assert.match(feed, /<entry>[\s\S]*<title>Into the blue<\/title>/);
  assert.match(feed, /<entry>[\s\S]*<title>The strategy of the mystery<\/title>/);
  assert.match(feed, /<entry>[\s\S]*<title>Quiero<\/title>/);
  assert.match(
    llms,
    /\[Markdown\]\(https:\/\/denkschuldt\.github\.io\/poems\/2024-01-08\/poem\.md\)/,
  );
  assert.match(
    llms,
    /\[Markdown\]\(https:\/\/denkschuldt\.github\.io\/poems\/2023-12-30\/poem\.md\)/,
  );
  assert.match(await getRobotsText(), /User-agent: OAI-SearchBot\nAllow: \//);
});
