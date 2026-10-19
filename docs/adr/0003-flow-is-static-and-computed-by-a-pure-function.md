# A Flow is a static diagram whose layout a pure function computes; no interactive canvas yet

We wanted Timelines that split and merge, inspired by node editors such as Svelte Flow. A node editor lets people drag nodes, pan, zoom, and draw edges between any two nodes, which needs runtime JavaScript and measured geometry. That would break what tokiline is for (ADR 0001): markup that renders on the server, with no JavaScript, and looks right on first paint. So a Flow is a static diagram: Items stay in one list in time order, each on a Lane, and Lanes Fork and Join. Which Lanes pass through each row, and where a Fork or a Join happens, is computed by `flowAttributes()`, a pure TypeScript function that turns `{ lane, fork?, join? }` records into the contract's `data-*` attributes and `--toki-*` properties. It runs at render time on the server or in the browser, never touches the DOM, and plain HTML authors can write the same attributes by hand.

## Considered Options

- **Interactive canvas (Svelte Flow style)**: drag, pan, zoom, and free edges need a client component and DOM measurement. Deferred: it can later be built on top of the same contract as an opt-in package.
- **Arbitrary edges between any two Items**: a Card's height is only known after layout, so an edge cannot be drawn correctly in CSS alone. Deferred with the canvas.
- **Nested Timelines for branches**: no way to express a Join, and time order across branches is lost.

## Consequences

- At most four Lanes run side by side, because CSS has to know the columns in advance. `flowAttributes()` throws beyond that, and on inconsistent input such as an Item on a Lane that has already Joined.
- Every Card sits in one column outside the Lanes, so Alternate does not apply to a Flow: it is treated as `end`.
