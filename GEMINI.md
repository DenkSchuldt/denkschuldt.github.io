# Gemini Instructions

Read and follow **AGENTS.md** in the repository root before modifying any code.
It is the canonical source of engineering standards for this repository.

## Key Requirements

- Preserve all existing application behaviour.
- Use the configured formatter (`npm run format`) and linter (`npm run lint`).
- Run `npm run quality` before considering work complete.
- Do not introduce `any` types or lint-disable comments to suppress valid issues.
- Do not refactor architecture beyond the scope of the current task.

## Package Manager

Use **npm**. Do not introduce other package managers or lock files.
