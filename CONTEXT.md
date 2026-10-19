# tokiline

A UI building block that lays out events in order along a single line. The framework-agnostic CSS and HTML contract is the source of truth; the React components are an optional layer that renders that contract.

## Language

### The whole timeline

**Timeline**:
The whole set of Items laid out in order along a Line.
_Avoid_: VerticalTimeline, Chronology

**Orientation**:
The direction in which the Line runs: vertical or horizontal.
_Avoid_: Direction, Layout

**Line**:
The line that runs through every Item and shows their order.
_Avoid_: Axis, Rail, Track

**Segment**:
The part of the Line that belongs to one Item, styled independently of the other Segments.
_Avoid_: Connector, Separator

### One event

**Item**:
One event on a Timeline.
_Avoid_: Element, Entry, Event, Node

**Marker**:
The mark on the Line that shows where an Item sits. It may hold an icon or nothing.
_Avoid_: Icon, Dot, Bullet

**Card**:
The box that holds an Item's main content.
_Avoid_: Content, Box, Panel

**Arrow**:
The small triangle on a Card that points toward the Line.
_Avoid_: Content arrow, Pointer, Tail

**Meta**:
Supplementary information shown outside the Card, such as a date, a period, or a status like "ongoing".
_Avoid_: Date, Label, Caption

**Variant**:
How much weight an Item carries: `compact` for a minor event with no Card frame, `milestone` for a major one. An Item without one is a regular Item.
_Avoid_: Size, Type, Kind

**Status**:
Where an Item stands relative to now: `done`, `current`, or `upcoming`. An Item without one has no Status.
_Avoid_: State, Progress, Phase

### Flow

**Flow**:
A Timeline whose Items run along more than one Lane, which can split and merge.
_Avoid_: Graph, Node editor, Branching timeline

**Lane**:
One of the parallel paths in a Flow. Every Item sits on exactly one Lane, and each Lane has its own Line.
_Avoid_: Track, Branch, Column, Swimlane

**Fork**:
The point where a new Lane splits off from an existing one.
_Avoid_: Branch, Split

**Join**:
The point where a Lane ends by merging into another Lane.
_Avoid_: Merge, Converge

### Placement

**Side**:
The side of the Line on which an Item's Card appears, expressed as the logical `start` or `end`. The physical side follows from the Orientation and the writing direction.
_Avoid_: Position, Left / Right, Layout

**Alternate**:
A Timeline-wide Side setting in which Items take turns between `start` and `end`.
_Avoid_: Two columns, Zigzag

**Collapse**:
What a Timeline does when it is too narrow for its layout. A horizontal Timeline turns vertical; an Alternate Timeline moves every Card to the `end` Side.
_Avoid_: Responsive mode, Mobile layout

### Motion

**Reveal**:
The entrance animation an Item plays as it scrolls into view.
_Avoid_: Bounce-in, Animate

### Look

**Preset**:
A named, opt-in look for a Timeline, shipped as its own stylesheet, that sets the Timeline's appearance and may add motion beyond the Reveal.
_Avoid_: Theme, Skin, Template
