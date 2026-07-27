import vinext from "vinext";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";
import {
  getLlmsText,
  getPoemsAtomFeed,
  getPoemsSitemapXml,
  getRobotsText,
  getStaticPoemManifest,
} from "./app/poems.server";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const poemsManifest = (): Plugin => ({
  name: "poems-static-manifest",
  configureServer(server) {
    server.middlewares.use("/poems-manifest.json", async (_request, response) => {
      try {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(JSON.stringify({ poems: await getStaticPoemManifest() }));
      } catch (error) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(
          JSON.stringify({
            poems: [],
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    });
  },
  async generateBundle() {
    const [poems, sitemap, feed, llms] = await Promise.all([
      getStaticPoemManifest(),
      getPoemsSitemapXml(),
      getPoemsAtomFeed(),
      getLlmsText(),
    ]);
    this.emitFile({
      type: "asset",
      fileName: "poems-manifest.json",
      source: JSON.stringify({ poems }),
    });
    this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
    this.emitFile({ type: "asset", fileName: "poems/feed.xml", source: feed });
    this.emitFile({ type: "asset", fileName: "llms.txt", source: llms });
    this.emitFile({ type: "asset", fileName: "robots.txt", source: getRobotsText() });
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
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    base: pagesBasePath ? `${pagesBasePath}/` : undefined,
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      poemsManifest(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
