import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";

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

const primitives = await readFile(
  new URL("../src/scene/objects/Primitives.tsx", import.meta.url),
  "utf8",
);
assert.doesNotMatch(
  primitives,
  /raw\.githubusercontent\.com/,
  "Runtime fonts must be self-hosted.",
);
assert.match(primitives, /\/certificates\/thumbs\//, "The certificate shelf must use thumbnails.");

console.log(
  `Performance budget passed: ${(initialJavaScriptBytes / 1024).toFixed(1)} KiB initial JS, ${(thumbnailBytes / 1024).toFixed(1)} KiB certificate thumbnails.`,
);
