# Presets are separate opt-in stylesheets built from one hue

The default look is deliberately plain, and we wanted animated looks that people can pick by name. Each Preset ships as its own file, `tokiline/presets/<name>.css`, and takes effect only on a Timeline with `data-preset="<name>"`, so a page pays only for the Presets it imports and can mix them. A Preset sets the `--toki-*` properties and adds motion; it never changes the layout. Its colors come from a single accent hue mixed with `currentColor` and `Canvas`, like the defaults, so it follows the page's light or dark scheme without fixed palettes.

## Considered Options

- **All Presets inside `style.css`, switched by `data-preset`**: simplest to adopt, but every user downloads every Preset.
- **A Preset applies to the whole page once imported**: no attribute needed, but two Presets cannot coexist on one page.
- **Fixed light and dark palettes per Preset with `light-dark()`**: richer colors, but `light-dark()` is not Baseline widely available, and fixed colors can clash with the user's page.

## Consequences

- Motion in a Preset animates only `transform` and `opacity`, and endless loops are limited to Items with a Status of `current` or similar. `prefers-reduced-motion: reduce` stops all of it.
- Features that are not yet Baseline widely available, such as `@property` for a rotating border or scroll-driven animations for a Line that grows as you read, are progressive enhancement: without them the Preset shows a static version.
