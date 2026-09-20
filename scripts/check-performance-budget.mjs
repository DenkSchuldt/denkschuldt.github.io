import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const client = new URL("../dist/client/", import.meta.url);
const html = await readFile(new URL("index.html", client), "utf8");
const initialAssetNames = [
  ...new Set([...html.matchAll(/\/assets\/([^\"'?#]+)/g)].map((match) => match[1])),
];
const initialJavaScript = initialAssetNames.filter((name) => name.endsWith(".js"));
const sizes = await Promise.all(
  initialJavaScript.map(async (name) => (await stat(new URL(`assets/${name}`, client))).size),
);
const initialJavaScriptBytes = sizes.reduce((sum, size) => sum + size, 0);
const initialJavaScriptBudget = 350 * 1024;
assert.ok(
  initialJavaScriptBytes <= initialJavaScriptBudget,
  `Initial JavaScript is ${initialJavaScriptBytes} bytes; budget is ${initialJavaScriptBudget}.`,
);

const manifest = JSON.parse(await readFile(new URL("performance-manifest.json", client), "utf8"));
assert.ok(
  Array.isArray(manifest.sceneJavaScript) && manifest.sceneJavaScript.length > 0,
  "The 3D dependency manifest must not be empty.",
);
const sceneSources = await Promise.all(
  manifest.sceneJavaScript.map((name) => readFile(new URL(name, client))),
);
const sceneBytes = sceneSources.reduce((sum, source) => sum + source.length, 0);
const sceneGzipBytes = sceneSources.reduce((sum, source) => sum + gzipSync(source).length, 0);
assert.ok(sceneBytes <= 2100 * 1024, `3D JavaScript exceeds 2100 KiB: ${sceneBytes} bytes.`);
assert.ok(
  sceneGzipBytes <= 650 * 1024,
  `3D JavaScript exceeds 650 KiB gzip: ${sceneGzipBytes} bytes.`,
);
const polaroidBytes = (await stat(new URL("../public/me-polaroid.jpg", import.meta.url))).size;
assert.ok(polaroidBytes <= 220 * 1024, "The dedicated polaroid texture exceeds 220 KiB.");

const thumbnailDirectory = new URL("../public/certificates/thumbs/", import.meta.url);
const thumbnailNames = (await readdir(thumbnailDirectory)).filter((name) =>
  /\.(?:jpe?g|png|webp|avif)$/i.test(name),
);
const thumbnailSizes = await Promise.all(
  thumbnailNames.map(async (name) => (await stat(new URL(name, thumbnailDirectory))).size),
);
const thumbnailBytes = thumbnailSizes.reduce((sum, size) => sum + size, 0);
assert.equal(thumbnailNames.length, 15, "Every certificate must have one shelf thumbnail.");
assert.ok(
  Math.max(...thumbnailSizes) <= 50 * 1024,
  "A certificate thumbnail exceeds the 50 KiB per-file budget.",
);
assert.ok(
  thumbnailBytes <= 550 * 1024,
  "Certificate thumbnails exceed the 550 KiB collection budget.",
);

const objectsDirectory = new URL("../src/scene/objects/", import.meta.url);
const objectSourceNames = (await readdir(objectsDirectory)).filter((name) => name.endsWith(".tsx"));
const objectSources = (
  await Promise.all(
    objectSourceNames.map((name) => readFile(new URL(name, objectsDirectory), "utf8")),
  )
).join("\n");
assert.doesNotMatch(
  objectSources,
  /raw\.githubusercontent\.com/,
  "Runtime fonts must be self-hosted.",
);
assert.match(
  objectSources,
  /\/certificates\/thumbs\//,
  "The certificate shelf must use thumbnails.",
);

console.log(
  `Performance budget passed: ${(initialJavaScriptBytes / 1024).toFixed(1)} KiB initial JS, ${(sceneBytes / 1024).toFixed(1)} KiB 3D JS (${(sceneGzipBytes / 1024).toFixed(1)} KiB gzip), ${(thumbnailBytes / 1024).toFixed(1)} KiB certificate thumbnails.`,
);
