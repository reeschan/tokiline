import { describe, expect, expectTypeOf, it } from "vitest"
import { cardAttributes, classNames, itemAttributes, markerAttributes, metaAttributes, timelineAttributes } from "../src/index"
import type { Collapse, ItemOptions, PartAttributes, Reveal, Side, TimelineOptions, TimelineSide } from "../src/index"

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
    expectTypeOf(classNames).toEqualTypeOf<{
      readonly timeline: "toki-timeline"
      readonly item: "toki-item"
      readonly marker: "toki-marker"
      readonly card: "toki-card"
      readonly meta: "toki-meta"
    }>()
    expectTypeOf<ItemOptions>().toEqualTypeOf<{ side?: Side }>()
    expectTypeOf<TimelineOptions>().toEqualTypeOf<{ side?: TimelineSide; collapse?: Collapse; reveal?: Reveal }>()
    expectTypeOf<PartAttributes>().toEqualTypeOf<{
      class: string
      "data-side"?: TimelineSide
      "data-collapse"?: Collapse
      "data-reveal"?: Reveal
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
    expect(timelineAttributes({ side: "alternate", collapse: "md" })).toStrictEqual(expected)
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

  it("combines all supported attributes without changing the options", () => {
    const options = Object.freeze({ side: "start", collapse: "sm", reveal: "scroll" } as const)
    expect(timelineAttributes(options)).toStrictEqual({
      class: "toki-timeline",
      "data-side": "start",
      "data-collapse": "sm",
      "data-reveal": "scroll",
    })
  })

  it.each(["left", "", "toString", "__proto__", 0, true, null, {}, ["start"]])("ignores invalid values %j", (value) => {
    // Cast only at the boundary to simulate callers without TypeScript validation.
    expect(timelineAttributes({ side: value, collapse: value, reveal: value } as unknown as TimelineOptions)).toStrictEqual({
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
  })
})

describe("itemAttributes", () => {
  it("accepts omitted or undefined options and Side", () => {
    expect(itemAttributes()).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes(undefined)).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes({})).toStrictEqual({ class: "toki-item" })
    expect(itemAttributes({ side: undefined })).toStrictEqual({ class: "toki-item" })
  })

  it.each(["start", "end"] as const)("emits Side %s", (side) => {
    expect(itemAttributes(Object.freeze({ side }))).toStrictEqual({ class: "toki-item", "data-side": side })
  })

  it.each(["alternate", "left", "", "toString", "__proto__", 0, true, null, {}, ["end"]])("ignores invalid Side %j", (side) => {
    expect(itemAttributes({ side } as unknown as ItemOptions)).toStrictEqual({ class: "toki-item" })
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
