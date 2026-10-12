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
_Avoid_: Element, Entry, Event

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

### Placement

**Side**:
The side of the Line on which an Item's Card appears, expressed as the logical `start` or `end`. The physical side follows from the Orientation and the writing direction.
_Avoid_: Position, Left / Right, Layout

**Alternate**:
A Timeline-wide Side setting in which Items take turns between `start` and `end`.
_Avoid_: Two columns, Zigzag

**Collapse**:
What an Alternate Timeline does when it is too narrow for both Sides: every Card moves to the `end` Side.
_Avoid_: Responsive mode, Mobile layout

### Motion

**Reveal**:
The entrance animation an Item plays as it scrolls into view.
_Avoid_: Bounce-in, Animate
