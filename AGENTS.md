# AGENTS.md

tokiline is a framework-agnostic timeline UI. The CSS and HTML contract (part class names, `data-*` variants, `--toki-*` custom properties) is the source of truth; TypeScript exports types and attribute helpers, and the React components only render the contract.

Read these first:

- `CONTEXT.md`: the glossary. Use its terms in code, tests, and docs (Item, not Element; Marker, not Icon; Card, not Content; Side `start` / `end`, not left / right).
- `docs/adr/`: decisions and why they were made.
- `docs/specs/tokiline-0.1.md`: the 0.1 spec (written in Japanese).

## Commands

| Command                             | What it does                                                          |
| ----------------------------------- | --------------------------------------------------------------------- |
| `pnpm lint`                         | ESLint with type-aware rules and a complexity limit of 10             |
| `pnpm format` / `pnpm format:check` | Prettier (no semicolons, 140 columns)                                 |
| `pnpm typecheck`                    | `tsc --noEmit`                                                        |
| `pnpm test:unit`                    | Vitest (`test/**/*.test.ts(x)`)                                       |
| `pnpm test:e2e`                     | Playwright in Chromium, WebKit and Firefox (`e2e/`)                   |
| `pnpm check`                        | The commit gate's check: lint, format check, typecheck, unit tests    |
| `sh scripts/commit-gate.sh`         | Run after `git add`; records that the staged tree passed `pnpm check` |

The React 18 test harness lives in `test/react18` and is installed separately: `pnpm install --ignore-workspace --dir test/react18`.

To enable the commit gate for your own commits: `git config core.hooksPath .githooks`.

To check an example (`examples/<name>`, for example `next-16` or `next-14`) against the current `src`:

```sh
node scripts/pack-for-examples.mjs
pnpm --dir examples/<name> install --ignore-workspace --no-frozen-lockfile
pnpm --dir examples/<name> build
node examples/check.mjs <name>
```

pnpm does not update an installed example when the tarball at the same path is rebuilt, so after changing `src`, run `pnpm --dir examples/<name> update tokiline` before the install step.

The architecture diagram in the README is drawn with D2 from `docs/architecture/architecture.d2` into `architecture-light.svg` and `architecture-dark.svg`. After changing the structure, update the `.d2` and redraw both SVGs (the maintainer uses a render script that swaps `__MONO__` for black and white and embeds the icons). README screenshots come from `pnpm readme:images`.

## Rules

- No runtime JavaScript in 0.1. The Reveal animation is CSS only.
- React components use no hooks, no context, no `"use client"`, and no `forwardRef`, so they render as Server Components. Export them by name (`TimelineItem`), never as `Timeline.Item`.
- The package's JavaScript never imports CSS. Users import `tokiline/style.css` themselves.
- Every CSS rule lives inside `@layer tokiline`. Never use `!important`. Use logical properties only (`inset-inline-start`, `margin-block`), never physical ones (`left`, `margin-top`).
- Class names, `data-*` attributes and their values, `--toki-*` custom properties, and package exports are public API. Changing them is a breaking change.
- Visual and layout features must be Baseline "widely available". Newer features (scroll-driven animations) are progressive enhancement only: content and layout must not depend on them.
- Do not loosen lint, complexity, or type rules, and do not skip tests to make a check pass.

## Versions

- TypeScript stays on 6.0.x: typescript-eslint 8.71 supports TypeScript `<6.1.0`. Dependabot ignores TypeScript 6.1 and later.
- pnpm 12 refuses versions published less than a day ago (`minimumReleaseAge`). Pick an older version instead of adding an exception.
- Files use LF line endings (`.gitattributes`), even on Windows.
