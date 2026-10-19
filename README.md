# tokiline

A framework-agnostic timeline UI: plain CSS and HTML first, with an optional React layer.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-dark.png" />
    <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-light.png" alt="A vertical timeline with four Items in the Alternate layout: Kickoff, Design review, Public beta, and Version 1.0. Each Item has an icon Marker, a date, and a Card." width="944" />
  </picture>
</p>

English | [日本語](README.ja.md)

## Features

- A CSS and HTML contract that works in any framework, or none.
- Optional React components. They render as Server Components, work with the Next.js App Router and Pages Router, and support React 18.2 and later and 19.
- Zero runtime JavaScript.
- All rules live in `@layer tokiline`, so your CSS and Tailwind classes win without `!important`.
- Collapse by container query: the Alternate layout folds, and a horizontal Timeline turns vertical, by the Timeline's own width, not the screen's.
- Horizontal Orientation, with the Timeline scrolling and snapping from Item to Item by itself.
- Variants and Status: `compact` and `milestone` Items, and `done`, `current`, and `upcoming`.
- Three opt-in Presets (`hotaru`, `kawa`, and `kinen`) with motion, each in its own stylesheet.
- Flow: Lanes that Fork and Join, placed by `flowAttributes()` with no runtime JavaScript.
- Right-to-left languages are supported. Sides are logical (`start` and `end`), so they flip by themselves.

## Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/architecture/architecture-dark.svg" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/architecture/architecture-light.svg" alt="Architecture of tokiline. In the GitHub repository, the CSS and HTML contract, the TypeScript helpers and the React components are built with tsdown and Lightning CSS. GitHub Actions runs CI on every push, publishes the package to npm, and deploys the demo site. Your app (plain HTML, Next.js, Tailwind CSS v4, or Vue, Svelte and Astro) installs it, and the browser renders the Timeline with no runtime JavaScript." width="720" />
</picture>

The diagram's source is [`docs/architecture/architecture.d2`](docs/architecture/architecture.d2).

## Install

```sh
npm install tokiline
```

```sh
pnpm add tokiline
```

```sh
yarn add tokiline
```

## Usage with HTML

Load the CSS once. With a bundler, import it. Without one, link `node_modules/tokiline/dist/style.css`.

```css
@import "tokiline/style.css";
```

Then write the five parts. Keep the order Marker, Meta, Card inside an Item.

```html
<ol class="toki-timeline">
  <li class="toki-item">
    <div class="toki-marker">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    </div>
    <div class="toki-meta"><time datetime="2026-04">April 2026</time></div>
    <div class="toki-card">
      <h3>Joined the team</h3>
      <p>Started as a front-end developer.</p>
    </div>
  </li>
  <li class="toki-item">
    <div class="toki-marker">2</div>
    <div class="toki-meta"><time datetime="2026-10">October 2026</time></div>
    <div class="toki-card">
      <h3>First release</h3>
      <p>Shipped version 1.0.</p>
    </div>
  </li>
</ol>
```

A Marker can hold an icon (such as an SVG) or text (such as a step number). Its content takes the color of `--toki-marker-fg`.

## Usage with React

Import the CSS yourself. The JavaScript in the package never loads CSS.

When you use TypeScript with React 18, you need `@types/react` 18.2.7 or later.

```tsx
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "tokiline/react"

export function Career() {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineMarker>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </TimelineMarker>
        <TimelineMeta>
          <time dateTime="2026-04">April 2026</time>
        </TimelineMeta>
        <TimelineCard>
          <h3>Joined the team</h3>
          <p>Started as a front-end developer.</p>
        </TimelineCard>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker>2</TimelineMarker>
        <TimelineMeta>
          <time dateTime="2026-10">October 2026</time>
        </TimelineMeta>
        <TimelineCard>
          <h3>First release</h3>
          <p>Shipped version 1.0.</p>
        </TimelineCard>
      </TimelineItem>
    </Timeline>
  )
}
```

The components use no hooks and no `"use client"`, so you can use them in a Server Component.

### Next.js App Router

Import the CSS in the root layout.

```jsx
// app/layout.jsx
import "tokiline/style.css"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Next.js Pages Router

Import the CSS in `pages/_app`.

```jsx
// pages/_app.jsx
import "tokiline/style.css"

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

## Placement

### Side

Side is the side of the Line where the Card appears.

| Value       | HTML                             | React                       | Meaning                                                          |
| ----------- | -------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `alternate` | none, or `data-side="alternate"` | none, or `side="alternate"` | Items take turns between `start` and `end`. This is the default. |
| `start`     | `data-side="start"`              | `side="start"`              | Every Card is on the `start` side.                               |
| `end`       | `data-side="end"`                | `side="end"`                | Every Card is on the `end` side.                                 |

Set it on the Timeline.

```html
<ol class="toki-timeline" data-side="end">
  …
</ol>
```

```tsx
<Timeline side="end">…</Timeline>
```

An Item can set its own `side`. It only works when the Timeline is in the Alternate layout with both sides in use. With `start` or `end` on the Timeline, or after a Collapse, it is ignored.

```html
<li class="toki-item" data-side="start">…</li>
```

```tsx
<TimelineItem side="start">…</TimelineItem>
```

### Collapse

When an Alternate Timeline is too narrow for both sides, every Card moves to the `end` side. This is called Collapse. It is decided by the width of the Timeline itself.

| Value    | HTML                          | React                    | Collapses when the Timeline is narrower than |
| -------- | ----------------------------- | ------------------------ | -------------------------------------------- |
| `sm`     | `data-collapse="sm"`          | `collapse="sm"`          | 32rem                                        |
| `md`     | none, or `data-collapse="md"` | none, or `collapse="md"` | 48rem. This is the default.                  |
| `lg`     | `data-collapse="lg"`          | `collapse="lg"`          | 64rem                                        |
| `never`  | `data-collapse="never"`       | `collapse="never"`       | Never. Both sides are always used.           |
| `always` | `data-collapse="always"`      | `collapse="always"`      | Always. Every Card is on the `end` side.     |

```html
<ol class="toki-timeline" data-collapse="lg">
  …
</ol>
```

```tsx
<Timeline collapse="lg">…</Timeline>
```

For the Alternate layout, `collapse` decides when every Card moves to the `end` side. For a horizontal Timeline, it decides when the Timeline turns vertical.

## Orientation

Orientation is the direction in which the Line runs. It is vertical by default.

| Value        | HTML                                   | React                             |
| ------------ | -------------------------------------- | --------------------------------- |
| `vertical`   | none, or `data-orientation="vertical"` | none, or `orientation="vertical"` |
| `horizontal` | `data-orientation="horizontal"`        | `orientation="horizontal"`        |

```html
<ol class="toki-timeline" data-orientation="horizontal" data-collapse="never" tabindex="0" aria-label="Release history">
  …
</ol>
```

```tsx
<Timeline orientation="horizontal" collapse="never" tabIndex={0} aria-label="Release history">
  …
</Timeline>
```

In a horizontal Timeline, the Line runs across and every Item takes `--toki-item-size` (default `16rem`). The Timeline is its own scroll container: it scrolls along the Line and stops at each Item, with no JavaScript. `--toki-gap` is the space between Items.

Because it scrolls by itself, give a horizontal Timeline `tabindex="0"` and an `aria-label` that describes its content, so keyboard users can reach it. With React, pass them as props: `<Timeline orientation="horizontal" tabIndex={0} aria-label="…">`. `Timeline` passes any other props through to the `ol`.

Side `start` is above the Line and `end` is below it. The Meta sits on the other side of the Line from the Card, lined up with the Marker. Alternate swaps the two sides Item by Item. In a right-to-left writing mode, time runs from right to left.

A horizontal Timeline turns vertical when it is narrower than its `collapse` threshold (`sm` 32rem, `md` 48rem, `lg` 64rem), just as an Alternate Timeline folds. After that, the vertical rules apply. `never` keeps it horizontal at every width; `always` always turns it vertical. The Timeline stays a scroll container even while it is Collapsed.

## Variants and Status

Variant sets how much weight an Item carries; Status says where it stands relative to now.

| Value       | HTML                       | React                 | Meaning                                                                                         |
| ----------- | -------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| `compact`   | `data-variant="compact"`   | `variant="compact"`   | A minor Item: no Card frame, background, shadow, or Arrow, a smaller Marker, and a tighter gap. |
| `milestone` | `data-variant="milestone"` | `variant="milestone"` | A major Item: a larger Marker and a Card border in the accent color.                            |

| Value      | HTML                     | React               | Meaning                                                         |
| ---------- | ------------------------ | ------------------- | --------------------------------------------------------------- |
| `done`     | `data-status="done"`     | `status="done"`     | Finished. The default look does not change.                     |
| `current`  | `data-status="current"`  | `status="current"`  | The present. The Marker gets an extra ring in the accent color. |
| `upcoming` | `data-status="upcoming"` | `status="upcoming"` | Not yet. The Segment is dashed.                                 |

An Item without a Variant is a regular Item, and an Item without a Status has no Status.

```html
<li class="toki-item" data-variant="milestone" data-status="current">…</li>
```

```tsx
<TimelineItem variant="milestone" status="current">
  …
</TimelineItem>
```

They work in the vertical and horizontal Orientations and in a Flow. In a Flow, an `upcoming` Status dashes its Lane's own Line. The sizes and the accent ring are set with `--toki-compact-marker-size`, `--toki-compact-gap`, `--toki-milestone-marker-size`, `--toki-milestone-card-border`, and `--toki-current-ring-color` (see [Theming](#theming)).

Status is visual only. tokiline does not add a spoken label for it, so write the wording in the Card or the Meta.

## Presets

A Preset is a named, opt-in look. Each Preset ships as its own stylesheet, so you load only the one you use.

```js
import "tokiline/style.css"
import "tokiline/presets/hotaru.css"
```

Then set `data-preset` on the Timeline. Only Timelines with that attribute change, so one page can use different Presets.

```html
<ol class="toki-timeline" data-preset="hotaru">
  …
</ol>
```

```tsx
<Timeline preset="hotaru">…</Timeline>
```

| Preset   | Look                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hotaru` | A firefly glow for a dark page: a band of light drifts along the Line, the current Marker breathes, and ripples spread now and then.                                                                                                                    |
| `kawa`   | Celadon to water blue, for roadmaps and changelogs: a `done` Segment is a solid accent line and an `upcoming` one is a moving dash. Where scroll-driven animations are supported, a `done` Segment grows as it is read; without them it is drawn whole. |
| `kinen`  | Ivory and gold, for releases and anniversaries: a light circles the `current` Card's edge, a sheen crosses the `current` Meta, and Cards lift on hover or focus.                                                                                        |

Set `--toki-accent` on the Timeline (or an ancestor) to change the color. Everything else is mixed from that accent, `currentColor`, and `Canvas`, so a Preset fits both light and dark pages. The Preset's rules sit in `@layer tokiline.preset`, a sublayer of `tokiline`, so your own CSS wins without `!important`.

All motion is inside `prefers-reduced-motion: no-preference`, so it stops when the reader asks for less motion. `@property` and scroll-driven animations are enhancements: a browser without them shows the still look, and no content starts hidden.

Presets work in the vertical and horizontal Orientations and in a Flow; with a Flow, they leave the Lane Lines and the Fork and Join bends intact.

## Flow

A Flow is a Timeline whose Items run on more than one Lane. It is still one ordered list: every Item sits on exactly one Lane, and Lanes can Fork and Join. `flowAttributes()` works out the Lane columns and what each row draws from the `lane`, `fork`, and `join` names.

```ts
import { flowAttributes } from "tokiline"

const layout = flowAttributes([{ lane: "main" }, { lane: "feature", fork: "main" }, { lane: "feature", join: "main" }, { lane: "main" }])

// layout.timeline
// { "data-flow": "2" }
// layout.items[1]
// { "data-lane": "feature", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "start" }
```

`flowAttributes()` takes one object per Item, in time order.

| Field  | Meaning                                                                   |
| ------ | ------------------------------------------------------------------------- |
| `lane` | The name of the Lane the Item sits on.                                    |
| `fork` | The Lane this Item's Lane splits from, when it starts here.               |
| `join` | The Lane this Item's Lane merges into after this Item, when it ends here. |

The first Lane starts without a `fork`; every other Lane starts at a Fork. A Lane keeps running until the last row that refers to it: one of its own Items, a later Item that Forks from it, or a later Item that Joins into it. After that its column is free and the next Fork reuses it. An `end` cap appears only when a Lane's last Item is also its last reference and it does not Join.

`flowAttributes()` returns `{ timeline, items }`: one attribute object for the Timeline and one for each Item. They contain `data-*` attributes only, no style variables. It throws `FlowError` when the Items cannot form a Flow:

- an Item on a Lane after that Lane has Joined;
- a Fork from a Lane that is not running;
- a Join to a Lane that is not running;
- a `fork` on an Item whose Lane is already running;
- a Lane that starts without a Fork when a root Lane already exists;
- a Join to the Item's own Lane;
- an empty `lane`, `fork`, or `join` name;
- more than four Lanes running at once.

### With React

Pass `layout.timeline` to `Timeline` and `layout.items[i]` to the matching `TimelineItem`; both spread the attributes onto the element.

```tsx
const layout = flowAttributes(items)

<Timeline flow={layout.timeline}>
  {items.map((item, index) => (
    <TimelineItem key={`${item.lane}-${index}`} flow={layout.items[index]}>
      …
    </TimelineItem>
  ))}
</Timeline>
```

### With HTML

`flowAttributes()` is optional. Write its output by hand, or write these attributes directly:

| Attribute                                  | On       | Meaning                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-flow="<n>"`                          | Timeline | The largest number of Lanes that run at once (`1` to `4`). The band of Lane columns is `n` × `--toki-lane-gap` wide.                                                                                                                                                                                                                                              |
| `data-lane="<name>"`                       | Item     | The Lane's name. A hook for your own styling; drawing does not use it.                                                                                                                                                                                                                                                                                            |
| `data-flow-col="<k>"`                      | Item     | The Item's Lane column (`1` to `4`). The Marker sits in this column.                                                                                                                                                                                                                                                                                              |
| `data-flow-through="<k>…"`                 | Item     | The other Lanes that pass through this row from top to bottom, space-separated. Leave it out when none do. CSS can pick one column with `[data-flow-through~="2"]`.                                                                                                                                                                                               |
| `data-flow-fork="<j>"`                     | Item     | This row starts a new Lane from the Lane in column `j`; a bend runs from the top of the row at column `j` to the Marker.                                                                                                                                                                                                                                          |
| `data-flow-join="<j>"`                     | Item     | After this Item, its Lane merges into the Lane in column `j`; a bend runs from the Marker to the bottom of the row at column `j`.                                                                                                                                                                                                                                 |
| `data-flow-cap="start" \| "end" \| "both"` | Item     | Where this Lane's own Line starts and ends at the Marker. `start`: it starts here (the first Item of a root Lane, or a Fork; a Fork always gets `start`). `end`: it ends here (the last Item of a Lane whose last reference is that Item, without a Join). `both`: one Item starts and ends the Lane. A Join never gets `end`, because the bend carries on below. |

```html
<ol class="toki-timeline" data-flow="2">
  <li class="toki-item" data-lane="main" data-flow-col="1" data-flow-cap="start">…</li>
  <li class="toki-item" data-lane="feature" data-flow-col="2" data-flow-through="1" data-flow-fork="1" data-flow-cap="start">…</li>
  <li class="toki-item" data-lane="feature" data-flow-col="2" data-flow-through="1" data-flow-join="1">…</li>
  <li class="toki-item" data-lane="main" data-flow-col="1" data-flow-cap="end">…</li>
</ol>
```

### Lane colors

`--toki-lane-gap` is the width of one Lane column (default `3rem`). `--toki-lane-1-color` through `--toki-lane-4-color` set the color of each Lane; without them, every Lane uses `--toki-line-color`. A Marker's background follows `--toki-marker-bg` first, then its Lane's color, then the usual Marker default.

```css
.toki-timeline {
  --toki-lane-gap: 3rem;
  --toki-lane-1-color: royalblue;
  --toki-lane-2-color: seagreen;
}
```

### Placement and Orientation

A Flow draws Side `end` unless the Timeline sets `data-side="start"`; `alternate` is drawn as `end`, so a Flow never zigzags. A horizontal Timeline can hold a Flow too: the Lane columns run across the block axis, and while the Timeline is Collapsed the Flow is drawn vertically. Sides and Lane order are logical, so a Flow works in a right-to-left writing mode as well. A Flow inside a Card starts from its own attributes instead of inheriting its row's.

## Reveal

Reveal is an entrance animation that plays as an Item scrolls into view. It is off by default. Turn it on for a Timeline.

```html
<ol class="toki-timeline" data-reveal="scroll">
  …
</ol>
```

```tsx
<Timeline reveal>…</Timeline>
```

Reveal uses CSS scroll-driven animations. In browsers that do not support them (Firefox, as of 2026-10), and when the user prefers reduced motion, nothing animates and every Item is shown as usual. On a horizontal Timeline, Reveal follows the Timeline's own inline scroll. While a horizontal Timeline is Collapsed and its Items are stacked vertically, Reveal does not play: the Timeline is still a scroll container, so there is nothing for `view()` to follow. The Items are shown without animation.

## Theming

Everything is set with `--toki-*` custom properties. tokiline reads each one as `var(--toki-name, default)`, so you can set it on any ancestor (such as `:root`), on the Timeline, or on one Item. A value on an Item affects only that Item. The defaults use `currentColor` and the system color `Canvas`, so they follow the page's text color and `color-scheme`.

| Variable                       | Meaning                                         | Default                                                        |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------------------- |
| `--toki-accent`                | Base color for the Marker's background          | `currentColor`                                                 |
| `--toki-gap`                   | Space between Items                             | `2rem`                                                         |
| `--toki-compact-gap`           | Space after a compact Item                      | `1rem`                                                         |
| `--toki-gutter`                | Space between the Line and the Card             | `1rem`                                                         |
| `--toki-item-size`             | Width of each Item in a horizontal Timeline     | `16rem`                                                        |
| `--toki-lane-1-color`          | Color of Lane column 1 in a Flow                | `--toki-line-color`                                            |
| `--toki-lane-2-color`          | Color of Lane column 2 in a Flow                | `--toki-line-color`                                            |
| `--toki-lane-3-color`          | Color of Lane column 3 in a Flow                | `--toki-line-color`                                            |
| `--toki-lane-4-color`          | Color of Lane column 4 in a Flow                | `--toki-line-color`                                            |
| `--toki-lane-gap`              | Width of one Lane column in a Flow              | `3rem`                                                         |
| `--toki-line-color`            | Color of the Line                               | `color-mix(in oklab, currentColor 25%, transparent)`           |
| `--toki-line-width`            | Width of the Line (`0` hides it)                | `2px`                                                          |
| `--toki-line-style`            | Style of the Line (`solid`, `dashed`, `dotted`) | `solid`                                                        |
| `--toki-marker-size`           | Size of the Marker (`0` hides it)               | `2.5rem`                                                       |
| `--toki-compact-marker-size`   | Size of the Marker of a compact Item            | `1rem`                                                         |
| `--toki-milestone-marker-size` | Size of the Marker of a milestone Item          | `3.5rem`                                                       |
| `--toki-marker-bg`             | Background of the Marker                        | the value of `--toki-accent`                                   |
| `--toki-marker-fg`             | Color of what is inside the Marker              | `Canvas`                                                       |
| `--toki-marker-ring-width`     | Width of the ring around the Marker             | `0.25rem`                                                      |
| `--toki-marker-ring-color`     | Color of the ring around the Marker             | `Canvas`                                                       |
| `--toki-current-ring-color`    | Extra ring around the Marker of a current Item  | `var(--toki-accent, currentColor)`                             |
| `--toki-card-bg`               | Background of the Card (the Arrow follows it)   | `color-mix(in oklab, currentColor 6%, Canvas)`                 |
| `--toki-card-fg`               | Text color of the Card                          | `currentColor`                                                 |
| `--toki-card-border`           | Border of the Card                              | `1px solid color-mix(in oklab, currentColor 15%, transparent)` |
| `--toki-milestone-card-border` | Border of the Card of a milestone Item          | `2px solid var(--toki-accent, currentColor)`                   |
| `--toki-card-radius`           | Corner radius of the Card                       | `0.5rem`                                                       |
| `--toki-card-padding`          | Padding of the Card                             | `1rem`                                                         |
| `--toki-card-shadow`           | Shadow of the Card                              | `0 1px 2px color-mix(in oklab, currentColor 12%, transparent)` |
| `--toki-arrow-size`            | Size of the Arrow (`0` hides it)                | `0.5rem`                                                       |
| `--toki-meta-fg`               | Text color of the Meta                          | `color-mix(in oklab, currentColor 70%, transparent)`           |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/theming-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/theming-light.png" alt="Two timelines side by side. On the left, purple custom colors with rounded Cards. On the right, numbered steps with solid, dashed, and dotted Lines and a faded last Card." width="944" />
</picture>

To change the Line style for one Item, set the variable on that Item.

```html
<li class="toki-item" style="--toki-line-style: dashed">…</li>
```

```tsx
<TimelineItem style={{ "--toki-line-style": "dashed" }}>…</TimelineItem>
```

You can also set variables for a whole page in your own CSS.

```css
:root {
  --toki-accent: royalblue;
  --toki-gap: 3rem;
}
```

## Tailwind CSS v4

In your own CSS, import tokiline after Tailwind and put it in the `components` layer.

```css
@import "tailwindcss";
@import "tokiline/style.css" layer(components);
```

Why: cascade layers are ranked by the order in which they first appear. If you import the CSS from JavaScript, the load order can change. The `tokiline` layer may then rank above `utilities`, so your Tailwind classes lose, or below `base`, so Tailwind's reset wins. With `layer(components)`, tokiline is always stronger than Tailwind's base and weaker than its utilities.

To use your shadcn/ui theme, map its variables onto tokiline's.

```css
.toki-timeline {
  --toki-line-color: var(--border);
  --toki-line-width: 1px;
  --toki-marker-size: 2rem;
  --toki-marker-bg: var(--primary);
  --toki-marker-fg: var(--primary-foreground);
  --toki-marker-ring-width: 4px;
  --toki-marker-ring-color: var(--card);
  --toki-card-bg: var(--card);
  --toki-arrow-size: 0;
}
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/tailwind-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/tailwind-light.png" alt="A career timeline built with Tailwind CSS v4 and the shadcn/ui palette, with briefcase Markers and Cards that have a thick top border." width="672" />
</picture>

This is the acceptance page in `site/acceptance/`, built with Tailwind CSS v4 and the shadcn/ui palette.

## TypeScript helpers

The `tokiline` package exports helpers that return the `class` and `data-*` attributes for each part: `timelineAttributes`, `itemAttributes`, `markerAttributes`, `cardAttributes`, and `metaAttributes`, plus `flowAttributes` for a Flow. Use them to build components for Vue, Svelte, and others.

```ts
import { timelineAttributes } from "tokiline"

timelineAttributes({ side: "end", collapse: "lg", reveal: "scroll" })
// { class: "toki-timeline", "data-side": "end", "data-collapse": "lg", "data-reveal": "scroll" }
```

Default values (`alternate`, `md`) are left out. Spread the result onto an element.

```vue
<!-- Timeline.vue -->
<script setup lang="ts">
import { timelineAttributes } from "tokiline"
import type { TimelineSide } from "tokiline"

const props = defineProps<{ side?: TimelineSide }>()
</script>

<template>
  <ol v-bind="timelineAttributes({ side: props.side })">
    <slot />
  </ol>
</template>
```

```svelte
<ol {...timelineAttributes({ side: "end" })}><slot /></ol>
```

The types `Side`, `TimelineSide`, `Collapse`, `Reveal`, `Orientation`, `Variant`, `Status`, `Preset`, `TimelineOptions`, `ItemOptions`, `PartAttributes`, `FlowItem`, `FlowColumn`, `FlowCap`, `FlowLayout`, `FlowTimelineAttributes`, and `FlowItemAttributes` are exported too. `FlowError` is the error `flowAttributes()` throws.

## Browser support

tokiline uses only CSS features that are Baseline "widely available". Two kinds of feature are exceptions, and both are progressive enhancements: Reveal and parts of the Presets use scroll-driven animations, and `kinen` uses `@property` for the light that circles a Card. Nothing depends on them: without support, Reveal does not play and every Preset keeps its still look.

The Timeline is a container (`container-type: inline-size`), so its width cannot come from its content. In a place where the width is decided by the content (for example, a flex child with no width), give the Timeline a width.

## Accessibility

- Use `ol` for the Timeline and `li` for each Item.
- Put dates in `<time>`.
- A Marker is not hidden from screen readers for you. Add `aria-hidden="true"` to an icon that is only decoration.
- Status is visual only. tokiline does not add a spoken label for it, so write the wording in the Card or the Meta.
- If a user should click something, put a `button` or an `a` there. Do not make a Marker or a Card clickable by itself.

## Migrating from react-vertical-timeline-component

| react-vertical-timeline-component        | tokiline                                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VerticalTimeline`                       | `Timeline`                                                                                                                                                                       |
| `layout="2-columns"`                     | The default (`side="alternate"`)                                                                                                                                                 |
| `layout="1-column-left"` / `"1-column"`  | `side="end"`                                                                                                                                                                     |
| `layout="1-column-right"`                | `side="start"`                                                                                                                                                                   |
| `lineColor`                              | `--toki-line-color`                                                                                                                                                              |
| `animate`                                | `reveal` (off by default)                                                                                                                                                        |
| `VerticalTimelineElement`                | `TimelineItem`, with `TimelineMarker`, `TimelineMeta`, and `TimelineCard` inside                                                                                                 |
| `icon`                                   | The content of `TimelineMarker`                                                                                                                                                  |
| `iconStyle` / `iconClassName`            | The Marker variables (`--toki-marker-size`, `--toki-marker-bg`, `--toki-marker-fg`, `--toki-marker-ring-width`, `--toki-marker-ring-color`) / `className` on `TimelineMarker`    |
| `shadowSize`                             | `--toki-marker-ring-width`                                                                                                                                                       |
| `contentStyle` / `textClassName`         | The Card variables (`--toki-card-bg`, `--toki-card-fg`, `--toki-card-border`, `--toki-card-radius`, `--toki-card-padding`, `--toki-card-shadow`) / `className` on `TimelineCard` |
| `contentArrowStyle`                      | Not needed (the Arrow follows the Card's background color). To remove it, use `--toki-arrow-size: 0`                                                                             |
| `date` / `dateClassName`                 | The content of `TimelineMeta` / `className` on `TimelineMeta`                                                                                                                    |
| `position`                               | `side` on `TimelineItem` (works only in the Alternate layout with both sides in use)                                                                                             |
| `iconOnClick` / `onTimelineElementClick` | Put a `button` or an `a` inside a part                                                                                                                                           |
| `visible` / `intersectionObserverProps`  | Not needed (Reveal works with CSS only)                                                                                                                                          |

Before and after:

```tsx
// Before
<VerticalTimeline layout="1-column-left" lineColor="#ccc">
  <VerticalTimelineElement date="2026-04" icon={<Icon />} iconStyle={{ background: "royalblue" }}>
    <h3>Joined the team</h3>
  </VerticalTimelineElement>
</VerticalTimeline>

// After
<Timeline side="end" style={{ "--toki-line-color": "#ccc", "--toki-marker-bg": "royalblue" }}>
  <TimelineItem>
    <TimelineMarker>
      <Icon aria-hidden="true" />
    </TimelineMarker>
    <TimelineMeta>2026-04</TimelineMeta>
    <TimelineCard>
      <h3>Joined the team</h3>
    </TimelineCard>
  </TimelineItem>
</Timeline>
```

## Acknowledgements

tokiline is a ground-up rewrite inspired by [react-vertical-timeline-component](https://github.com/stephane-monnot/react-vertical-timeline) by Stéphane Monnot. Thanks to the original author and all contributors.

## License

[MIT](LICENSE)
