# The CSS and HTML contract is the core; React is an optional thin layer

tokiline replaces react-vertical-timeline-component, whose most reported failures in Next.js (no line on first render, hydration warnings, `window` access) came from doing presentation work in React at runtime: writing a CSS variable onto `document` and relying on IntersectionObserver. A timeline holds almost no state, so we made the CSS and HTML contract (part class names, `data-*` variants, `--toki-*` custom properties) the single source of truth. The TypeScript core only exports types and small helpers that build the contract's classes and attributes, and the React components only render that markup, so they work as Server Components. In 0.1 there is no runtime JavaScript at all: the Reveal animation uses CSS scroll-driven animations.

## Considered Options

- **Web Components**: framework-agnostic, but Shadow DOM makes SSR (Declarative Shadow DOM) and outside styling (`::part` only) hard, and light-DOM custom elements add little over plain markup.
- **Headless TypeScript core with per-framework renderers**: too much machinery for a component with almost no state.
- **React-first, as upstream**: the source of the Next.js failures above, and unusable from plain HTML, Astro, or Vue.

## Consequences

- Firefox (157, October 2026) has not shipped scroll-driven animations, so Items appear there without the Reveal. A one-shot, IntersectionObserver-based Reveal can be added later as an opt-in client component.
- The package's JavaScript never imports its own CSS. Users import `tokiline/style.css` themselves (root layout in the App Router, `_app` in the Pages Router), because Next.js does not support a package's JavaScript importing its own CSS in the Pages Router.
