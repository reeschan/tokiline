import { describe, expect, expectTypeOf, it } from "vitest"
import { cardAttributes, classNames, itemAttributes, markerAttributes, metaAttributes, timelineAttributes } from "../src/index"
import type {
  Collapse,
  ItemOptions,
  Orientation,
  PartAttributes,
  Preset,
  Reveal,
  Side,
  Status,
  TimelineOptions,
  TimelineSide,
  Variant,
} from "../src/index"

describe("public contract", () => {
  it("exports the exact part class names and types", () => {
    expect(classNames).toStrictEqual({
      timeline: "toki-timeline",
      item: "toki-item",
      marker: "toki-marker",
      card: "toki-card",
      meta: "toki-meta",
    })
    expectTypeOf<Side>().toEqualTypeOf<"start" | "end">()
    expectTypeOf<TimelineSide>().toEqualTypeOf<Side | "alternate">()
    expectTypeOf<Collapse>().toEqualTypeOf<"sm" | "md" | "lg" | "never" | "always">()
    expectTypeOf<Reveal>().toEqualTypeOf<"scroll">()
    expectTypeOf<Orientation>().toEqualTypeOf<"vertical" | "horizontal">()
    expectTypeOf<Variant>().toEqualTypeOf<"compact" | "milestone">()
    expectTypeOf<Status>().toEqualTypeOf<"done" | "current" | "upcoming">()
    expectTypeOf<Preset>().toEqualTypeOf<"hotaru" | "kawa" | "kinen">()
    expectTypeOf(classNames).toEqualTypeOf<{
      readonly timeline: "toki-timeline"
      readonly item: "toki-item"
      readonly marker: "toki-marker"
      readonly card: "toki-card"
      readonly meta: "toki-meta"
    }>()
    expectTypeOf<ItemOptions>().toEqualTypeOf<{ side?: Side; variant?: Variant; status?: Status }>()
    expectTypeOf<TimelineOptions>().toEqualTypeOf<{
      side?: TimelineSide
      collapse?: Collapse
      reveal?: Reveal
      orientation?: Orientation
      preset?: Preset
    }>()
    expectTypeOf<PartAttributes>().toEqualTypeOf<{
      class: string
      "data-side"?: TimelineSide
      "data-collapse"?: Collapse
      "data-reveal"?: Reveal
      "data-orientation"?: Orientation
      "data-preset"?: Preset
      "data-variant"?: Variant
      "data-status"?: Status
    }>()
  })
})

describe("timelineAttributes", () => {
  it("omits unspecified and default attributes", () => {
    const expected = { class: "toki-timeline" }
    expect(timelineAttributes()).toStrictEqual(expected)
    expect(timelineAttributes(undefined)).toStrictEqual(expected)
    expect(timelineAttributes({})).toStrictEqual(expected)
    expect(timelineAttributes({ side: undefined, collapse: undefined, reveal: undefined })).toStrictEqual(expected)
    expect(
      timelineAttributes({ side: undefined, collapse: undefined, reveal: undefined, orientation: undefined, preset: undefined }),
    ).toStrictEqual(expected)
    expect(timelineAttributes({ side: "alternate", collapse: "md", orientation: "vertical" })).toStrictEqual(expected)
  })

  it.each(["start", "end"] as const)("emits Side %s", (side) => {
    expect(timelineAttributes({ side })).toStrictEqual({ class: "toki-timeline", "data-side": side })
  })

  it.each(["sm", "lg", "never", "always"] as const)("emits Collapse %s", (collapse) => {
    expect(timelineAttributes({ collapse })).toStrictEqual({ class: "toki-timeline", "data-collapse": collapse })
  })

  it("emits Reveal while omitting explicit defaults", () => {
    expect(timelineAttributes({ side: "alternate", collapse: "md", reveal: "scroll" })).toStrictEqual({
      class: "toki-timeline",
      "data-reveal": "scroll",
    })
  })

  it("emits Orientation only when horizontal", () => {
    expect(timelineAttributes({ orientation: "horizontal" })).toStrictEqual({
      class: "toki-timeline",
      "data-orientation": "horizontal",
    })
  })

  it("omits the default vertical Orientation", () => {
    expect(timelineAttributes({ orientation: "vertical" })).toStrictEqual({ class: "toki-timeline" })
  })

  it.each(["hotaru", "kawa", "kinen"] as const)("emits Preset %s", (preset) => {
    expect(timelineAttributes({ preset })).toStrictEqual({ class: "toki-timeline", "data-preset": preset })
  })

  it("combines all supported attributes without changing the options", () => {
    const options = Object.freeze({
      side: "start",
      collapse: "sm",
      reveal: "scroll",
      orientation: "horizontal",
      preset: "hotaru",
    } as const)
    expect(timelineAttributes(options)).toStrictEqual({
      class: "toki-timeline",
      "data-side": "start",
      "data-collapse": "sm",
      "data-reveal": "scroll",
      "data-orientation": "horizontal",
      "data-preset": "hotaru",
    })
  })

  it.each(["left", "", "toString", "__proto__", 0, true, null, {}, ["start"]])("ignores invalid values %j", (value) => {
    // Cast only at the boundary to simulate callers without TypeScript validation.
    expect(
      timelineAttributes({ side: value, collapse: value, reveal: value, orientation: value, preset: value } as unknown as TimelineOptions),
    ).toStrictEqual({
      class: "toki-timeline",
    })
  })

  it("validates each attribute independently", () => {
    expect(timelineAttributes({ side: "left", collapse: "lg", reveal: "scroll" } as unknown as TimelineOptions)).toStrictEqual({
      class: "toki-timeline",
      "data-collapse": "lg",
      "data-reveal": "scroll",
    })
    expect(timelineAttributes({ side: "end", collapse: "wide", reveal: "scroll" } as unknown as TimelineOptions)).toStrictEqual({
      class: "toki-timeline",
      "data-side": "end",
      "data-reveal": "scroll",
    })
    expect(timelineAttributes({ side: "start", collapse: "never", reveal: "once" } as unknown as TimelineOptions)).toStrictEqual({
      class: "toki-timeline",
      "data-side": "start",
      "data-collapse": "never",
    })
    expect(timelineAttributes({ orientation: "diagonal", preset: "moon" } as unknown as TimelineOptions)).toStrictEqual({
      class: "toki-timeline",
    })
    expect(timelineAttributes({ orientation: "horizontal", preset: "moon" } as unknown as TimelineOptions)).toStrictEqual({
      class: "toki-timeline",
      "data-orientation": "horizontal",
    })
    expect(timelineAttributes({ orientation: "diagonal", preset: "kawa" } as unknown as TimelineOptions)).toStrictEqual({
      class: "toki-timeline",
      "data-preset": "kawa",
    })
  })
})

describe("itemAttributes", () => {
  it("accepts omitted or undefined options and Side", () => {
    expect(itemAttributes()).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes(undefined)).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes({})).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes({ side: undefined })).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes({ side: undefined, variant: undefined, status: undefined })).toStrictEqual({ class: "toki-item" })
  })

  it.each(["start", "end"] as const)("emits Side %s", (side) => {
    expect(itemAttributes(Object.freeze({ side }))).toStrictEqual({ class: "toki-item", "data-side": side })
  })

  it.each(["compact", "milestone"] as const)("emits Variant %s", (variant) => {
    expect(itemAttributes({ variant })).toStrictEqual({ class: "toki-item", "data-variant": variant })
  })

  it.each(["done", "current", "upcoming"] as const)("emits Status %s", (status) => {
    expect(itemAttributes({ status })).toStrictEqual({ class: "toki-item", "data-status": status })
  })

  it("combines all supported attributes without changing the options", () => {
    const options = Object.freeze({ side: "end", variant: "milestone", status: "upcoming" } as const)
    expect(itemAttributes(options)).toStrictEqual({
      class: "toki-item",
      "data-side": "end",
      "data-variant": "milestone",
      "data-status": "upcoming",
    })
  })

  it.each(["alternate", "left", "", "toString", "__proto__", 0, true, null, {}, ["end"]])("ignores invalid Side %j", (side) => {
    expect(itemAttributes({ side } as unknown as ItemOptions)).toStrictEqual({ class: "toki-item" })
  })

  it.each(["regular", "large", "", "toString", "__proto__", 0, true, null, {}, ["compact"]])("ignores invalid Variant %j", (variant) => {
    expect(itemAttributes({ variant } as unknown as ItemOptions)).toStrictEqual({ class: "toki-item" })
  })

  it.each(["finished", "now", "", "toString", "__proto__", 0, true, null, {}, ["done"]])("ignores invalid Status %j", (status) => {
    expect(itemAttributes({ status } as unknown as ItemOptions)).toStrictEqual({ class: "toki-item" })
  })

  it("validates each attribute independently", () => {
    expect(itemAttributes({ side: "left", variant: "compact", status: "current" } as unknown as ItemOptions)).toStrictEqual({
      class: "toki-item",
      "data-variant": "compact",
      "data-status": "current",
    })
    expect(itemAttributes({ side: "end", variant: "large", status: "upcoming" } as unknown as ItemOptions)).toStrictEqual({
      class: "toki-item",
      "data-side": "end",
      "data-status": "upcoming",
    })
    expect(itemAttributes({ side: "left", variant: "milestone", status: "later" } as unknown as ItemOptions)).toStrictEqual({
      class: "toki-item",
      "data-variant": "milestone",
    })
  })
})

describe("part attribute objects", () => {
  it.each([
    [timelineAttributes, "toki-timeline"],
    [itemAttributes, "toki-item"],
    [markerAttributes, "toki-marker"],
    [cardAttributes, "toki-card"],
    [metaAttributes, "toki-meta"],
  ] as const)("returns independent objects from %s", (attributes, partClass) => {
    const first = attributes()
    const second = attributes()
    expect(first).toStrictEqual({ class: partClass })
    expect(first).not.toBe(second)
    first.class = "custom"
    first["data-side"] = "end"
    expect(second).toStrictEqual({ class: partClass })
    expect(attributes()).toStrictEqual({ class: partClass })
  })
})
