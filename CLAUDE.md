# Claude Code Instructions

Read and follow **AGENTS.md** in the repository root before modifying any code.
It is the canonical source of engineering standards for this repository.

## Key Requirements

- Preserve all existing application behaviour.
- Use the configured formatter (`npm run format`) and linter (`npm run lint`).
- Run `npm run quality` before considering work complete.
- Do not introduce `any` types or lint-disable comments to suppress valid issues.
- Do not refactor architecture beyond the scope of the current task.

## Project Stack

- React 19, Next.js 16, Vite 8, TypeScript 5.9
- React Three Fiber 9 with demand-driven render scheduling
- npm workspaces (monorepo: `packages/cinematic-navigation`)
- Cloudflare Workers for edge deployment
- Node.js >= 22.13.0

## Architectural Invariants

- One persistent `<Canvas>` and one persistent scene/world.
- Navigation (`@denk/cinematic-navigation`) must remain renderer-agnostic.
- Render scheduling uses demand mode — no unconditional continuous rendering.
- Resources have explicit ownership and disposal semantics.
- Scene components describe content; runtime hooks own lifecycle orchestration.

## Package Manager

Use **npm**. Do not introduce other package managers or lock files.
