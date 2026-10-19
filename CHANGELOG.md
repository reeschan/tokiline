# tokiline

## 0.2.0

### Minor Changes

- cb52608: Add a horizontal Orientation, Variant and Status, three Presets (`hotaru`, `kawa`, and `kinen`), and Flow: Lanes that Fork and Join, with the attributes computed by `flowAttributes()` at build time and no runtime JavaScript.

### Patch Changes

- 2d1a164: Show the 0.2 features in the README: a horizontal hero next to the vertical one, and pictures of the horizontal Orientation, the Presets, and a horizontal and a vertical Flow.

## 0.1.0

### Minor Changes

- 4fdb355: First release of tokiline, a framework-agnostic timeline UI.
  The CSS and HTML contract (part class names, `data-*` variants, `--toki-*` custom properties) is the source of truth.
  TypeScript types and attribute helpers are exported from `tokiline`, and optional React components that render as Server Components from `tokiline/react`.
  No runtime JavaScript: the Reveal animation is CSS only.
