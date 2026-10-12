# tokiline

## 0.1.0

### Minor Changes

- 4fdb355: First release of tokiline, a framework-agnostic timeline UI.
  The CSS and HTML contract (part class names, `data-*` variants, `--toki-*` custom properties) is the source of truth.
  TypeScript types and attribute helpers are exported from `tokiline`, and optional React components that render as Server Components from `tokiline/react`.
  No runtime JavaScript: the Reveal animation is CSS only.
