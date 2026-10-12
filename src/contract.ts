/** The logical Side of the Line on which an Item's Card appears. */
export type Side = "start" | "end"

/** The Timeline-wide Side setting, with Alternate as the default. */
export type TimelineSide = Side | "alternate"

/** The Collapse threshold or policy for an Alternate Timeline. */
export type Collapse = "sm" | "md" | "lg" | "never" | "always"

/** The opt-in Reveal animation supported by the HTML contract. */
export type Reveal = "scroll"

/** The public CSS class names for all five Timeline parts. */
export const classNames = {
  timeline: "toki-timeline",
  item: "toki-item",
  marker: "toki-marker",
  card: "toki-card",
  meta: "toki-meta",
} as const

/** Timeline variants; omitted values use Alternate, md Collapse, and no Reveal. */
export interface TimelineOptions {
  side?: TimelineSide
  collapse?: Collapse
  reveal?: Reveal
}

/** An optional Item Side override for the Timeline's placement. */
export interface ItemOptions {
  side?: Side
}

/** Framework-independent class and data attributes for a Timeline part. */
export interface PartAttributes {
  class: string
  "data-side"?: TimelineSide
  "data-collapse"?: Collapse
  "data-reveal"?: Reveal
}

function isSide(value: unknown): value is Side {
  return value === "start" || value === "end"
}

function isNonDefaultCollapse(value: unknown): value is Exclude<Collapse, "md"> {
  return value === "sm" || value === "lg" || value === "never" || value === "always"
}

/** Creates fresh Timeline attributes, omitting default and unsupported values. */
export function timelineAttributes(options?: TimelineOptions): PartAttributes {
  const attributes: PartAttributes = { class: classNames.timeline }
  const side = options?.side
  const collapse = options?.collapse
  const reveal = options?.reveal

  if (isSide(side)) attributes["data-side"] = side
  if (isNonDefaultCollapse(collapse)) attributes["data-collapse"] = collapse
  if (reveal === "scroll") attributes["data-reveal"] = reveal

  return attributes
}

/** Creates fresh Item attributes with a supported Side override, if provided. */
export function itemAttributes(options?: ItemOptions): PartAttributes {
  const attributes: PartAttributes = { class: classNames.item }
  const side = options?.side

  if (isSide(side)) attributes["data-side"] = side

  return attributes
}

/** Creates a fresh attribute object for a Marker. */
export function markerAttributes(): PartAttributes {
  return { class: classNames.marker }
}

/** Creates a fresh attribute object for a Card. */
export function cardAttributes(): PartAttributes {
  return { class: classNames.card }
}

/** Creates a fresh attribute object for Meta. */
export function metaAttributes(): PartAttributes {
  return { class: classNames.meta }
}
