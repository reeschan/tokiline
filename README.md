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
- Collapse by container query: the Alternate layout folds by the Timeline's own width, not the screen's.
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

`collapse` only works with the Alternate layout.

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

Reveal uses CSS scroll-driven animations. In browsers that do not support them (Firefox, as of 2026-10), and when the user prefers reduced motion, nothing animates and every Item is shown as usual.

## Theming

Everything is set with `--toki-*` custom properties. tokiline reads each one as `var(--toki-name, default)`, so you can set it on any ancestor (such as `:root`), on the Timeline, or on one Item. A value on an Item affects only that Item. The defaults use `currentColor` and the system color `Canvas`, so they follow the page's text color and `color-scheme`.

| Variable                   | Meaning                                         | Default                                                        |
| -------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `--toki-accent`            | Base color for the Marker's background          | `currentColor`                                                 |
| `--toki-gap`               | Space between Items                             | `2rem`                                                         |
| `--toki-gutter`            | Space between the Line and the Card             | `1rem`                                                         |
| `--toki-line-color`        | Color of the Line                               | `color-mix(in oklab, currentColor 25%, transparent)`           |
| `--toki-line-width`        | Width of the Line (`0` hides it)                | `2px`                                                          |
| `--toki-line-style`        | Style of the Line (`solid`, `dashed`, `dotted`) | `solid`                                                        |
| `--toki-marker-size`       | Size of the Marker (`0` hides it)               | `2.5rem`                                                       |
| `--toki-marker-bg`         | Background of the Marker                        | the value of `--toki-accent`                                   |
| `--toki-marker-fg`         | Color of what is inside the Marker              | `Canvas`                                                       |
| `--toki-marker-ring-width` | Width of the ring around the Marker             | `0.25rem`                                                      |
| `--toki-marker-ring-color` | Color of the ring around the Marker             | `Canvas`                                                       |
| `--toki-card-bg`           | Background of the Card (the Arrow follows it)   | `color-mix(in oklab, currentColor 6%, Canvas)`                 |
| `--toki-card-fg`           | Text color of the Card                          | `currentColor`                                                 |
| `--toki-card-border`       | Border of the Card                              | `1px solid color-mix(in oklab, currentColor 15%, transparent)` |
| `--toki-card-radius`       | Corner radius of the Card                       | `0.5rem`                                                       |
| `--toki-card-padding`      | Padding of the Card                             | `1rem`                                                         |
| `--toki-card-shadow`       | Shadow of the Card                              | `0 1px 2px color-mix(in oklab, currentColor 12%, transparent)` |
| `--toki-arrow-size`        | Size of the Arrow (`0` hides it)                | `0.5rem`                                                       |
| `--toki-meta-fg`           | Text color of the Meta                          | `color-mix(in oklab, currentColor 70%, transparent)`           |

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

The `tokiline` package exports helpers that return the `class` and `data-*` attributes for each part: `timelineAttributes`, `itemAttributes`, `markerAttributes`, `cardAttributes`, and `metaAttributes`. Use them to build components for Vue, Svelte, and others.

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

The types `Side`, `TimelineSide`, `Collapse`, `Reveal`, `TimelineOptions`, `ItemOptions`, and `PartAttributes` are exported too.

## Browser support

tokiline uses only CSS features that are Baseline "widely available". Reveal is the one exception: it uses scroll-driven animations as a progressive enhancement, and nothing depends on it.

The Timeline is a container (`container-type: inline-size`), so its width cannot come from its content. In a place where the width is decided by the content (for example, a flex child with no width), give the Timeline a width.

## Accessibility

- Use `ol` for the Timeline and `li` for each Item.
- Put dates in `<time>`.
- A Marker is not hidden from screen readers for you. Add `aria-hidden="true"` to an icon that is only decoration.
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
