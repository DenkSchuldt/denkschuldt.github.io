import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const OBJECT_SOURCE_PATHS = [
  "Chair.tsx",
  "Desk.tsx",
  "DeskObjects.tsx",
  "Laptop.tsx",
  "MiniProjector.tsx",
  "Plant.tsx",
  "Posters.tsx",
  "Room.tsx",
  "Shelf.tsx",
];

async function readObjectSources() {
  const sources = await Promise.all(
    OBJECT_SOURCE_PATHS.map((file) =>
      readFile(new URL(`../src/scene/objects/${file}`, import.meta.url), "utf8"),
    ),
  );
  return sources.join("\n");
}

// globals.css is an @import manifest; inline the partials so assertions see the full sheet.
async function readGlobalCss() {
  const entryUrl = new URL("../app/globals.css", import.meta.url);
  const entry = await readFile(entryUrl, "utf8");
  const partials = await Promise.all(
    [...entry.matchAll(/@import\s+"(\.\/[^"]+)"/g)].map(([, ref]) =>
      readFile(new URL(ref, entryUrl), "utf8"),
    ),
  );
  return [entry, ...partials].join("\n");
}

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function html(path) {
  const response = await render(path);
  assert.equal(response.status, 200, `${path} should render`);
  return response.text();
}

function jsonLdBlocks(markup) {
  return [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    ([, body]) => JSON.parse(body.replace(/\\u003c/g, "<")),
  );
}

async function clientAsset(name) {
  return readFile(new URL(`../dist/client/${name}`, import.meta.url), "utf8");
}

test("server-renders the cinematic experience shell", async () => {
  const markup = await html("/");
  assert.match(markup, /<title>Denny K\. Schuldt<\/title>/i);
  assert.match(markup, /class="experience-shell"/);
  assert.match(markup, /<canvas/);
  assert.match(markup, /class="scene-navigation"/);
  assert.match(markup, /class="experience-loading"/);
  assert.match(markup, /Entering workspace/);
  assert.match(markup, /class="scene-navigation-current camera-location/);
  assert.doesNotMatch(markup, />Opening<\/div>/);
  assert.doesNotMatch(markup, /mobile-camera-nav/);
  assert.match(markup, /class="cinematic-fade"/);
  assert.match(markup, /class="grain"/);
  assert.doesNotMatch(markup, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.doesNotMatch(markup, /rendering-diagnostics|Render diagnostics/i);
});

test("keeps the cinematic shell and fallback scoped", async () => {
  const [shell, layout, css] = await Promise.all([
    readFile(new URL("../app/SceneShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readGlobalCss(),
  ]);
  assert.match(shell, /<Experience initialPath=\{initialPath\} \/>/);
  assert.match(shell, /className="grain"/);
  assert.match(shell, /className="fallback" aria-hidden="true"/);
  assert.match(layout, /SITE_TITLE = "Denny K\. Schuldt"/);
  assert.match(layout, /title:\s*SITE_TITLE/);
  assert.match(css, /\.experience-shell\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.fallback\s*\{[^}]*clip-path:\s*inset\(50%\)/);
  assert.match(css, /\.semantic-layer\s*\{[^}]*clip-path:\s*inset\(50%\)/);
  assert.match(css, /canvas\s*\{\s*touch-action:\s*none/);
});

test("keeps heavy WebGL resources outside the initial loading boundary", async () => {
  const [shell, experience, scene, primitives, camera] = await Promise.all([
    readFile(new URL("../app/SceneShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/Experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/Scene.tsx", import.meta.url), "utf8"),
    readObjectSources(),
    readFile(new URL("../src/scene/camera/useCinematicCamera.ts", import.meta.url), "utf8"),
  ]);
  assert.match(shell, /lazy\(\(\) => import\("@\/src\/scene\/Experience"\)\)/);
  assert.match(experience, /import \{ Scene \} from "\.\/Scene"/);
  assert.doesNotMatch(experience, /lazy\(\(\)=>import\("\.\/Scene"\)/);
  const effects = await readFile(
    new URL("../src/scene/effects/CinematicEffects.tsx", import.meta.url),
    "utf8",
  );
  assert.match(effects, /multisampling=\{0\}/);
  assert.doesNotMatch(scene, /loadCertificates|loadTextures/);
  assert.match(primitives, /<CertificateGallery\s+illuminated=\{illuminated\}/);
  assert.match(primitives, /<PortfolioPhoto materialRef=\{photoMaterialRef\} \/>/);
  assert.match(primitives, /\/certificates\/thumbs\//);
  assert.match(primitives, /\/fonts\/PatrickHand-Regular\.ttf/);
  assert.doesNotMatch(`${experience}\n${camera}`, /from "leva"/);
});

test("responsive scene navigation stays scene-based and keyboard-exitable", async () => {
  const [navigation, css] = await Promise.all([
    readFile(new URL("../src/scene/camera/SceneNavigation.tsx", import.meta.url), "utf8"),
    readGlobalCss(),
  ]);
  assert.match(navigation, /aria-keyshortcuts="Escape"/);
  assert.match(
    navigation,
    /aria-label=\{`Exit \$\{collection\?\.label \?\? "collection"\} collection`\}/,
  );
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*?\.scene-navigation\s*\{\s*display: flex;/);
  assert.match(
    css,
    /@media \(max-width: 640px\)[\s\S]*?\.scene-navigation-target\s*\{[\s\S]*?border-radius: 999px/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)[\s\S]*?\.scene-navigation-target \.scene-name\s*\{\s*display: none;/,
  );
});

test("GET / exposes site identity and links to every section", async () => {
  const markup = await html("/");
  const main = markup.match(/<main class="semantic-layer">[\s\S]*?<\/main>/);
  assert.ok(main, "root renders a semantic <main>");
  const [document] = main;
  assert.match(document, /<h1>Denny K\. Schuldt<\/h1>/);
  assert.match(document, /experiences people can feel/);
  assert.match(document, /persistent 3D room/);
  for (const path of ["/about", "/projects", "/certificates", "/poems", "/phone"]) {
    assert.match(document, new RegExp(`href="${path}"`), `root links to ${path}`);
  }
});

test("GET /about renders the canonical About content without JS", async () => {
  const markup = await html("/about");
  const [main] = markup.match(/<main class="semantic-layer">[\s\S]*?<\/main>/);
  assert.match(main, /<h1>About <!-- -->Denny K\. Schuldt<\/h1>/);
  assert.match(main, /I build products that think clearly/);
  assert.match(main, /taught UX\/UI at Coding Bootcamps ESPOL/);
  assert.match(main, /Hablante nativo de Español/);
  assert.match(main, /href="https:\/\/www\.linkedin\.com\/in\/denny-schuldt\/"/);
  assert.match(main, /href="https:\/\/github\.com\/DenkSchuldt"/);
});

test("GET /projects renders Selected Work, experience, and project links", async () => {
  const markup = await html("/projects");
  const [main] = markup.match(/<main class="semantic-layer">[\s\S]*?<\/main>/);
  assert.match(main, /<h1>Selected Work<\/h1>/);
  assert.match(main, /Professional experience/);
  assert.match(main, /VP of Product/);
  assert.match(main, /Shippify/);
  assert.match(main, /Jelou/);
  assert.match(main, /href="https:\/\/www\.npmjs\.com\/package\/@denkschuldt\/react-dialog"/);
  assert.match(main, /href="https:\/\/denkschuldt\.github\.io\/360"/);
});

test("GET /certificates renders certificate titles and credential links", async () => {
  const markup = await html("/certificates");
  const [main] = markup.match(/<main class="semantic-layer">[\s\S]*?<\/main>/);
  assert.match(main, /UX Management: Strategy and Tactics/);
  assert.match(main, /Accessibility: How to Design for All/);
  assert.match(main, /href="https:\/\/online\.hbs\.edu\/verify-certificate\?dvid=PTKC6R24"/);
  assert.match(main, /interaction-design\.org\/members\/denny-k-schuldt/);
  assert.equal((main.match(/Verify credential/g) ?? []).length, 15);
});

test("GET /poems and poem detail keep their server-rendered structure", async () => {
  const index = await html("/poems");
  const [indexMain] = index.match(/<main class="semantic-layer">[\s\S]*?<\/main>/);
  assert.match(indexMain, /<h1>Poems by Denny K\. Schuldt<\/h1>/);
  assert.match(indexMain, /href="\/poems\/quiero"/);
  assert.match(indexMain, /href="\/poems\/feed\.xml"/);

  const detail = await html("/poems/quiero");
  const [detailMain] = detail.match(/<main class="semantic-layer">[\s\S]*?<\/main>/);
  assert.match(detailMain, /<h1>Quiero<\/h1>/);
  assert.match(detailMain, /<time dateTime="2023-12-30">/);
  assert.match(detailMain, /rel="prev"/);
  assert.match(detailMain, /All poems/);
  assert.match(detailMain, /Read the Markdown source/);
});

test("the projected 3D overlays stay out of the accessibility tree", async () => {
  const overlays = await Promise.all(
    ["AboutOverlay", "ProjectsOverlay", "PoemsOverlay", "PhoneOverlay"].map((name) =>
      readFile(new URL(`../src/scene/components/${name}.tsx`, import.meta.url), "utf8"),
    ),
  );
  for (const source of overlays) {
    assert.match(source, /aria-hidden="true"/, "projected content overlays are aria-hidden");
  }
});

test("core routes carry their own title, description, and canonical URL", async () => {
  const cases = [
    ["/about", "About — Denny K. Schuldt", "https://denkschuldt.github.io/about"],
    ["/projects", "Projects — Denny K. Schuldt", "https://denkschuldt.github.io/projects"],
    [
      "/certificates",
      "Certificates — Denny K. Schuldt",
      "https://denkschuldt.github.io/certificates",
    ],
    ["/phone", "Phone — Denny K. Schuldt", "https://denkschuldt.github.io/phone"],
    ["/poems", "Poems — Denny K. Schuldt", "https://denkschuldt.github.io/poems"],
    ["/poems/quiero", "Quiero — Denny K. Schuldt", "https://denkschuldt.github.io/poems/quiero"],
  ];
  for (const [path, title, canonical] of cases) {
    const markup = await html(path);
    assert.match(markup, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(markup, new RegExp(`<link rel="canonical" href="${canonical}"`));
    assert.match(markup, /<meta name="description" content="[^"]+"/);
    assert.match(
      markup,
      /<meta property="og:image" content="https:\/\/denkschuldt\.github\.io\/[^"]+"/,
    );
    assert.match(
      markup,
      /<meta name="twitter:image" content="https:\/\/denkschuldt\.github\.io\/[^"]+"/,
    );
  }
});

test("the homepage canonical matches its sitemap and JSON-LD form", async () => {
  const markup = await html("/");
  assert.match(markup, /<link rel="canonical" href="https:\/\/denkschuldt\.github\.io\/"/);
  assert.match(markup, /<meta property="og:url" content="https:\/\/denkschuldt\.github\.io\/"/);
  const sitemap = await clientAsset("sitemap.xml");
  assert.match(sitemap, /<loc>https:\/\/denkschuldt\.github\.io\/<\/loc>/);
});

test("transient scene routes are non-canonical and point at their parent", async () => {
  const wall = await html("/wall");
  assert.match(wall, /<meta name="robots" content="noindex/);
  assert.match(wall, /<link rel="canonical" href="https:\/\/denkschuldt\.github\.io\/"/);
  assert.match(wall, /<main class="semantic-layer">[\s\S]*<h1>Wall<\/h1>/);

  const socials = await html("/socials");
  assert.match(socials, /<meta name="robots" content="noindex/);
  assert.match(socials, /<link rel="canonical" href="https:\/\/denkschuldt\.github\.io\/about"/);
});

test("the phone lock screen clock is 24-hour", async () => {
  const source = await readFile(
    new URL("../src/scene/components/PhoneOverlay.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /toLocaleTimeString\([^)]*hour12:\s*false/s);
  assert.doesNotMatch(source, /hour12:\s*true/);
});

test("structured data is present, parses, and carries stable entities", async () => {
  const root = jsonLdBlocks(await html("/"));
  assert.equal(root.length, 1);
  const graph = root[0]["@graph"];
  assert.ok(Array.isArray(graph));
  const person = graph.find((node) => node["@type"] === "Person");
  const website = graph.find((node) => node["@type"] === "WebSite");
  assert.equal(person["@id"], "https://denkschuldt.github.io/#person");
  assert.equal(person.name, "Denny K. Schuldt");
  assert.ok(person.sameAs.includes("https://github.com/DenkSchuldt"));
  assert.equal(website["@id"], "https://denkschuldt.github.io/#website");
  assert.equal(website.name, "Denny's Workspace");
  assert.equal(website.author["@id"], person["@id"]);

  const about = jsonLdBlocks(await html("/about"))[0]["@graph"];
  assert.ok(about.some((node) => node["@type"] === "ProfilePage"));

  const projects = jsonLdBlocks(await html("/projects"))[0]["@graph"];
  const projectsPage = projects.find((node) => node["@type"] === "CollectionPage");
  assert.equal(projectsPage.mainEntity["@type"], "ItemList");

  const certs = jsonLdBlocks(await html("/certificates"))[0]["@graph"];
  const certsPage = certs.find((node) => node["@type"] === "CollectionPage");
  assert.ok(
    certsPage.mainEntity.itemListElement.some(
      (entry) => entry.item["@type"] === "EducationalOccupationalCredential",
    ),
  );

  const poem = jsonLdBlocks(await html("/poems/quiero"))[0];
  assert.equal(poem["@type"], "CreativeWork");
  assert.equal(poem.genre, "Poetry");
  assert.equal(poem["@id"], "https://denkschuldt.github.io/poems/quiero");
});

test("generated discovery resources describe the whole site", async () => {
  const [llms, llmsFull, siteJson, sitemap, robots] = await Promise.all([
    clientAsset("llms.txt"),
    clientAsset("llms-full.txt"),
    clientAsset("site.json"),
    clientAsset("sitemap.xml"),
    clientAsset("robots.txt"),
  ]);

  assert.match(llms, /# Denny's Workspace/);
  assert.match(llms, /## About/);
  assert.match(llms, /## Selected Work/);
  assert.match(llms, /## Certificates/);
  assert.match(llms, /## Poems/);
  assert.match(llms, /\/about\)/);
  assert.match(llms, /\]\(https:\/\/denkschuldt\.github\.io\/phone\)/);
  assert.match(llms, /UX Management: Strategy and Tactics/);
  assert.doesNotMatch(llms, /Michael Jackson|music on rotation/i);

  assert.match(llmsFull, /## About/);
  assert.match(llmsFull, /## Certificates/);
  assert.match(llmsFull, /VP of Product/);
  assert.match(llmsFull, /Quiero que viajemos al infinito/);

  const manifest = JSON.parse(siteJson);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.site.name, "Denny's Workspace");
  assert.ok(manifest.experience.length >= 8);
  assert.equal(manifest.certificates.length, 15);
  assert.ok(manifest.poems.items.length >= 40);
  assert.ok(manifest.routes.some((route) => route.path === "/about"));
  assert.ok(manifest.links.some((link) => link.label === "GitHub"));

  assert.match(sitemap, /<loc>https:\/\/denkschuldt\.github\.io\/about<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/denkschuldt\.github\.io\/certificates<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/denkschuldt\.github\.io\/poems\/quiero<\/loc>/);

  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/denkschuldt\.github\.io\/sitemap\.xml/);
});
