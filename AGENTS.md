# Repository Engineering Standards

This document is the canonical source of truth for engineering rules in this
repository. All code generation, modifications, reviews, and refactors —
whether performed by humans or coding agents — must follow these standards.

---

## Project Overview

This is a personal portfolio website built with:

- **React 19** and **Next.js 16** (app router, static export)
- **Vite 8** via vinext for the build pipeline
- **React Three Fiber 9** for 3D scene rendering
- **TypeScript 5.9** in strict mode
- **Tailwind CSS 4** for styling
- **Cloudflare Workers** for edge deployment
- **npm workspaces** for the monorepo (`packages/cinematic-navigation`)

The repository uses **npm** as its package manager. Do not introduce other
package managers or lock files.

---

## Core Principle

The primary goal is **readability**.

Code is written for humans first and the compiler second.

When shorter code conflicts with clearer code, choose clearer code.

Prefer:

- explicit code over clever code;
- composition over complexity;
- descriptive names over abbreviations;
- guard clauses over deep nesting;
- cohesive modules over large mixed-responsibility files;
- predictable structure over personal stylistic variation.

Do not create abstractions that make simple code harder to trace.

---

## Language and React Standards

- Use TypeScript for new application code.
- Preserve JavaScript files when migration is outside the task scope.
- Use functional React components.
- Use hooks according to the Rules of Hooks.
- Prefer named exports for application modules.
- Preserve default exports where required by Next.js or existing public APIs.
- Never use `React.FC` merely by habit.
- Type component props with explicit interfaces.
- Avoid `any`. Prefer `unknown` followed by validation.
- Do not silence TypeScript errors with unsafe assertions.
- Use `import type` for type-only imports.
- Memoisation (`useMemo`, `useCallback`, `memo`) must have a clear purpose.
- Avoid storing derived values in state.
- Keep state as local as practical.
- Do not use effects for values that can be calculated during rendering.
- Do not create effects merely to synchronise two pieces of React state.

---

## Formatting

The repository uses Prettier as its authoritative formatter.

Configuration:

- 2-space indentation, no tabs
- Semicolons
- Trailing commas where valid
- Double quotes
- Maximum print width of 100 characters
- Arrow function parentheses: always
- One final newline at end of every text file

Do not manually fight the formatter. Run `npm run format` to apply.

---

## Import Organisation

Imports must be separated into logical groups with blank lines between them.

Order:

1. React and React ecosystem (`react`, `react-dom`)
2. Third-party packages (`@react-three/*`, `three`, `leva`, etc.)
3. Internal absolute imports (`@/...`)
4. Relative parent imports (`../...`)
5. Relative sibling imports (`./...`)
6. Type-only imports (`import type`)
7. Styles and side-effect imports

Within each group, sort imports consistently.

Remove unused imports. Merge duplicate imports from the same module.

Example:

```tsx
import { useEffect, useRef, useState } from "react";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { useNavigationState } from "@/navigation";
import { useRenderDemand } from "@/scene/runtime/render-scheduler";

import { PhoneScreen } from "./PhoneScreen";

import type { PhoneProps } from "./types";

import "./Phone.css";
```

---

## File Organisation

A typical React module should follow this order:

1. Imports
2. Types and interfaces
3. Module-level constants
4. Primary exported component or hook
5. Secondary local components
6. Local hooks
7. Pure helper functions

Do not force empty sections. Do not add decorative section comments to small
files. For large files, simple section comments may be used sparingly when they
genuinely improve navigation.

---

## Component Internal Order

Inside a component, use a predictable order:

1. Context and external-store hooks
2. Local state
3. Refs
4. Values from custom hooks
5. Derived values
6. Memoised values (when justified)
7. Effects
8. Event handlers and callbacks
9. Guard clauses
10. JSX return

Keep related values together. Do not reorder hooks in a way that changes
behaviour.

---

## Components

Each component should have one clear responsibility. Extract code when a
component mixes independent concerns.

Use line counts as warning signals:

- Investigate functions above roughly 40–60 lines
- Investigate components above roughly 200–300 lines
- Refactor only when cohesion or readability improves

---

## Functions

Functions should:

- have one clear purpose;
- use descriptive names;
- avoid hidden side effects;
- use guard clauses where they reduce nesting;
- keep parameters manageable;
- accept an options object for several related parameters.

Use function declarations for ordinary named helpers. Use arrow functions
naturally for callbacks.

---

## Naming

- `PascalCase` for React components, classes, and component types
- `camelCase` for variables, functions, and hooks
- `useSomething` for hooks
- `UPPER_SNAKE_CASE` for true module-level constants

Boolean names should communicate a question:

- `isVisible`, `isLoading`
- `hasTexture`, `hasFocus`
- `canNavigate`, `canDispose`
- `shouldRender`, `shouldMount`
- `wasDisposed`

Avoid unclear abbreviations (`cfg`, `mgr`, `certTex`, `navSt`).

---

## JSX

Use multiline JSX when:

- there are several props;
- props contain complex expressions;
- children span multiple elements;
- the line exceeds the print width.

Keep short simple elements on one line when the formatter does so naturally.

Separate meaningful sibling sections with blank lines. Extract deeply nested
JSX. Avoid nested ternaries, complex inline calculations, and large inline
event handlers.

---

## Conditional Logic

Prefer guard clauses to flatten the happy path. Use braces for multiline
conditions. Never use nested ternaries.

A simple single-level ternary is acceptable when immediately clear:

```tsx
return isLoading ? <LoadingIndicator /> : <CertificateList />;
```

---

## Effects

Every effect must represent a clear synchronisation responsibility. Verify:

- why it must be an effect;
- what external system it synchronises;
- whether cleanup is required;
- whether dependencies are complete.

Avoid large multipurpose effects. Never disable `react-hooks/exhaustive-deps`
without a documented, technically valid reason.

---

## Event Handlers

- `handleSomething` for local event handlers
- `onSomething` for callback props

Avoid large anonymous callbacks in JSX. Inline callbacks are acceptable when
trivial.

---

## Comments

Comments explain **why**, not what. Remove stale, redundant, or misleading
comments. Do not delete useful technical context.

Good:

```ts
// Ignore completions from a previous residency generation.
if (generation !== activeGeneration) {
  texture.dispose();
  return;
}
```

---

## Error Handling

Never use empty `catch` blocks. Handle expected failures explicitly. Retain
diagnostic context for unexpected errors. Do not hide real failures with
arbitrary fallback values.

---

## Accessibility

Preserve labels, semantic elements, keyboard handling, focus behaviour, ARIA
attributes, reduced-motion behaviour. Use appropriate interactive elements
rather than generic divs.

---

## React Three Fiber Rules

### Persistent World

- One persistent `<Canvas>`.
- One persistent scene/world.
- Do not create a Canvas per destination.

### Separation of Concerns

Keep these responsibilities separate:

- Scene description
- Navigation
- Rendering policy
- Render scheduling
- Runtime state
- Asset ownership
- Resource residency
- Interaction
- Overlays

Scene components describe scene content. Runtime controllers and hooks own
lifecycle orchestration.

### Navigation

Navigation must remain renderer-agnostic. Do not add Three.js, WebGL, audio,
or postprocessing dependencies to `@denk/cinematic-navigation`.

### Render Scheduling

Preserve demand-rendering and the render-scheduler architecture.

- No unconditional continuous rendering.
- No casual `useFrame`.
- Continuous or periodic frame production must have explicit ownership.
- Clean up scheduler leases, timers, and subscriptions.

### Resources

Preserve explicit ownership and disposal semantics. Do not dispose shared
resources. Dispose owned resources using the existing lifecycle architecture.
Reject stale async completions.

### Per-Frame Work

Avoid allocations inside `useFrame` and high-frequency callbacks. Reuse
vectors, matrices, quaternions. Do not mutate React state every frame. Use refs
or established external runtime stores for high-frequency mutable values.

---

## Architecture

- **Components** describe interface or scene output.
- **Hooks** encapsulate reusable React behaviour.
- **Providers** expose shared React state.
- **Controllers** coordinate runtime systems.
- **Services** implement non-React domain behaviour.
- **Pure helpers** transform data without side effects.

Do not create circular dependencies. Avoid index-barrel exports that create
cycles, obscure ownership, or damage tree-shaking.

---

## Tests

Preserve all existing tests. Readability refactors must not weaken coverage.
When structural changes affect test boundaries, update tests without changing
intended behaviour.

---

## Generated and External Code

Do not manually reformat:

- `node_modules/`
- `.next/`
- `dist/`
- `build/` output
- `drizzle/` migrations
- `.wrangler/`
- `public/` binary assets
- Generated type files

---

## Validation Commands

```bash
npm run format:check   # Prettier check
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run test           # Tests (builds first)
npm run build          # Production build
npm run quality        # All checks combined
```

Run `npm run quality` before committing changes.
