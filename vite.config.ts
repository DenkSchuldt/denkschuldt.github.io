import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import vinext from "vinext";
import { defineConfig } from "vite";
import type { ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";
import { getPoemsAtomFeed, getStaticPoemManifest } from "./app/poems.server";
import {
  getAboutMarkdown,
  getCertificatesMarkdown,
  getLlmsFullText,
  getLlmsText,
  getProjectsMarkdown,
  getRobotsText,
  getSiteJson,
  getSitemapXml,
} from "./app/site.server";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const serveResource = (
  server: ViteDevServer,
  route: string,
  contentType: string,
  build: () => Promise<string>,
) => {
  server.middlewares.use(route, (_request: unknown, response: ServerResponse) => {
    build()
      .then((body) => {
        response.statusCode = 200;
        response.setHeader("Content-Type", contentType);
        response.setHeader("Cache-Control", "no-store");
        response.end(body);
      })
      .catch((error: unknown) => {
        response.statusCode = 500;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end(error instanceof Error ? error.message : String(error));
      });
  });
};

const poemsManifestJson = async () => JSON.stringify({ poems: await getStaticPoemManifest() });

const DISCOVERY_RESOURCES: ReadonlyArray<{
  file: string;
  contentType: string;
  build: () => Promise<string>;
}> = [
  {
    file: "poems-manifest.json",
    contentType: "application/json; charset=utf-8",
    build: poemsManifestJson,
  },
  { file: "site.json", contentType: "application/json; charset=utf-8", build: getSiteJson },
  { file: "sitemap.xml", contentType: "application/xml; charset=utf-8", build: getSitemapXml },
  {
    file: "poems/feed.xml",
    contentType: "application/atom+xml; charset=utf-8",
    build: getPoemsAtomFeed,
  },
  { file: "llms.txt", contentType: "text/plain; charset=utf-8", build: getLlmsText },
  { file: "llms-full.txt", contentType: "text/plain; charset=utf-8", build: getLlmsFullText },
  { file: "robots.txt", contentType: "text/plain; charset=utf-8", build: getRobotsText },
  { file: "about.md", contentType: "text/markdown; charset=utf-8", build: getAboutMarkdown },
  { file: "projects.md", contentType: "text/markdown; charset=utf-8", build: getProjectsMarkdown },
  {
    file: "certificates.md",
    contentType: "text/markdown; charset=utf-8",
    build: getCertificatesMarkdown,
  },
];

let discoveryFilesWritten = false;

const siteDiscovery = (): Plugin => ({
  name: "site-discovery-resources",
  async buildStart() {
    if (discoveryFilesWritten) return;
    discoveryFilesWritten = true;
    const publicDir = resolve(process.cwd(), "public");
    await Promise.all(
      DISCOVERY_RESOURCES.map(async ({ file, build }) => {
        const target = join(publicDir, file);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, await build());
      }),
    );
  },
  configureServer(server) {
    for (const { file, contentType, build } of DISCOVERY_RESOURCES) {
      serveResource(server, `/${file}`, contentType, build);
    }
  },
});

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  const pagesBasePath = process.env.GITHUB_PAGES_BASE_PATH?.replace(/\/$/, "");
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    base: pagesBasePath ? `${pagesBasePath}/` : undefined,
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      siteDiscovery(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
