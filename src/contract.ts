/** The logical Side of the Line on which an Item's Card appears. */
export type Side = "start" | "end"

/** The Timeline-wide Side setting, with Alternate as the default. */
export type TimelineSide = Side | "alternate"

/** The Collapse threshold or policy for an Alternate Timeline. */
export type Collapse = "sm" | "md" | "lg" | "never" | "always"

/** The opt-in Reveal animation supported by the HTML contract. */
export type Reveal = "scroll"

/** The direction in which the Line runs. */
export type Orientation = "vertical" | "horizontal"

/** How much weight an Item carries. */
export type Variant = "compact" | "milestone"

/** Where an Item stands relative to now. */
export type Status = "done" | "current" | "upcoming"

/** The named, opt-in look for a Timeline. */
export type Preset = "hotaru" | "kawa" | "kinen"

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
  orientation?: Orientation
  preset?: Preset
}

/** An optional Item Side override for the Timeline's placement. */
export interface ItemOptions {
  side?: Side
  variant?: Variant
  status?: Status
}

/** Framework-independent class and data attributes for a Timeline part. */
export interface PartAttributes {
  class: string
  "data-side"?: TimelineSide
  "data-collapse"?: Collapse
  "data-reveal"?: Reveal
  "data-orientation"?: Orientation
  "data-preset"?: Preset
  "data-variant"?: Variant
  "data-status"?: Status
}

function isSide(value: unknown): value is Side {
  return value === "start" || value === "end"
}

function isNonDefaultCollapse(value: unknown): value is Exclude<Collapse, "md"> {
  return value === "sm" || value === "lg" || value === "never" || value === "always"
}

function isHorizontalOrientation(value: unknown): value is Extract<Orientation, "horizontal"> {
  return value === "horizontal"
}

function isPreset(value: unknown): value is Preset {
  return value === "hotaru" || value === "kawa" || value === "kinen"
}

function isVariant(value: unknown): value is Variant {
  return value === "compact" || value === "milestone"
}

function isStatus(value: unknown): value is Status {
  return value === "done" || value === "current" || value === "upcoming"
}

/** Creates fresh Timeline attributes, omitting default and unsupported values. */
export function timelineAttributes(options?: TimelineOptions): PartAttributes {
  const attributes: PartAttributes = { class: classNames.timeline }
  const config: TimelineOptions = options ?? {}
  const { side, collapse, reveal, orientation, preset } = config

  if (isSide(side)) attributes["data-side"] = side
  if (isNonDefaultCollapse(collapse)) attributes["data-collapse"] = collapse
  if (reveal === "scroll") attributes["data-reveal"] = reveal
  if (isHorizontalOrientation(orientation)) attributes["data-orientation"] = orientation
  if (isPreset(preset)) attributes["data-preset"] = preset

  return attributes
}

/** Creates fresh Item attributes with a supported Side override, if provided. */
export function itemAttributes(options?: ItemOptions): PartAttributes {
  const attributes: PartAttributes = { class: classNames.item }
  const side = options?.side
  const variant = options?.variant
  const status = options?.status

  if (isSide(side)) attributes["data-side"] = side
  if (isVariant(variant)) attributes["data-variant"] = variant
  if (isStatus(status)) attributes["data-status"] = status

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
