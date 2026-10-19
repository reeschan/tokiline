import { describe, expect, expectTypeOf, it } from "vitest"
import { FlowError, flowAttributes } from "../src/index"
import type { FlowCap, FlowColumn, FlowItem, FlowItemAttributes, FlowLayout, FlowTimelineAttributes } from "../src/index"

describe("flowAttributes", () => {
  it("exports the Flow attribute types", () => {
    expectTypeOf<FlowItem>().toEqualTypeOf<{ lane: string; fork?: string; join?: string }>()
    expectTypeOf<FlowColumn>().toEqualTypeOf<"1" | "2" | "3" | "4">()
    expectTypeOf<FlowCap>().toEqualTypeOf<"start" | "end" | "both">()
    expectTypeOf<FlowLayout>().toEqualTypeOf<{ timeline: FlowTimelineAttributes; items: FlowItemAttributes[] }>()
  })

  it("returns no attributes for no Items", () => {
    expect(flowAttributes([])).toStrictEqual({ timeline: {}, items: [] })
  })

  it("puts a single Lane in column 1, capped at the first and last Item", () => {
    const items: FlowItem[] = [{ lane: "main" }, { lane: "main" }, { lane: "main" }]

    expect(flowAttributes(items)).toStrictEqual({
      timeline: { "data-flow": "1" },
      items: [
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "start" },
        { "data-lane": "main", "data-flow-col": "1" },
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "end" },
      ],
    })
  })

  it("gives a Lane that starts and ends at one Item both caps", () => {
    expect(flowAttributes([{ lane: "main" }])).toStrictEqual({
      timeline: { "data-flow": "1" },
      items: [{ "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "both" }],
    })
  })

  it("computes one Fork and one Join", () => {
    const items: FlowItem[] = [
      { lane: "main" },
      { lane: "main" },
      { lane: "feature", fork: "main" },
      { lane: "feature" },
      { lane: "feature", join: "main" },
      { lane: "main" },
    ]

    expect(flowAttributes(items)).toStrictEqual({
      timeline: { "data-flow": "2" },
      items: [
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "start" },
        { "data-lane": "main", "data-flow-col": "1" },
        {
          "data-lane": "feature",
          "data-flow-col": "2",
          "data-flow-through": "1",
          "data-flow-fork": "1",
          "data-flow-cap": "start",
        },
        { "data-lane": "feature", "data-flow-col": "2", "data-flow-through": "1" },
        { "data-lane": "feature", "data-flow-col": "2", "data-flow-through": "1", "data-flow-join": "1" },
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "end" },
      ],
    })
  })

  it("reuses the column of a Lane that has Joined for the next Fork", () => {
    const items: FlowItem[] = [
      { lane: "main" },
      { lane: "side", fork: "main" },
      { lane: "side", join: "main" },
      { lane: "other", fork: "main" },
      { lane: "other", join: "main" },
      { lane: "main" },
    ]

    expect(flowAttributes(items)).toStrictEqual({
      timeline: { "data-flow": "2" },
      items: [
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "start" },
        { "data-lane": "side", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "start" },
        { "data-lane": "side", "data-flow-col": "2", "data-flow-through": "1", "data-flow-join": "1" },
        { "data-lane": "other", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "start" },
        { "data-lane": "other", "data-flow-col": "2", "data-flow-through": "1", "data-flow-join": "1" },
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "end" },
      ],
    })
  })

  it("lists the columns passing through a row in ascending order", () => {
    const items: FlowItem[] = [
      { lane: "main" },
      { lane: "a", fork: "main" },
      { lane: "b", fork: "main" },
      { lane: "a" },
      { lane: "c", fork: "main" },
      { lane: "main" },
      { lane: "c" },
      { lane: "b" },
    ]

    expect(flowAttributes(items).items[5]).toStrictEqual({
      "data-lane": "main",
      "data-flow-col": "1",
      "data-flow-through": "2 3",
      "data-flow-cap": "end",
    })
  })

  it("ends a Lane that is not referenced again", () => {
    const items: FlowItem[] = [{ lane: "main" }, { lane: "side", fork: "main" }, { lane: "side" }, { lane: "main" }, { lane: "main" }]

    expect(flowAttributes(items)).toStrictEqual({
      timeline: { "data-flow": "2" },
      items: [
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "start" },
        { "data-lane": "side", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "start" },
        { "data-lane": "side", "data-flow-col": "2", "data-flow-through": "1", "data-flow-cap": "end" },
        { "data-lane": "main", "data-flow-col": "1" },
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "end" },
      ],
    })
  })

  it("keeps a Fork source running until the row where it is last referenced", () => {
    const items: FlowItem[] = [{ lane: "main" }, { lane: "a", fork: "main" }, { lane: "main" }, { lane: "b", fork: "main" }, { lane: "b" }]

    expect(flowAttributes(items)).toStrictEqual({
      timeline: { "data-flow": "2" },
      items: [
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "start" },
        { "data-lane": "a", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "both" },
        { "data-lane": "main", "data-flow-col": "1" },
        { "data-lane": "b", "data-flow-col": "2", "data-flow-fork": "1", "data-flow-cap": "start" },
        { "data-lane": "b", "data-flow-col": "2", "data-flow-cap": "end" },
      ],
    })
  })

  it("keeps a Join target running until the row where it is last referenced", () => {
    const items: FlowItem[] = [{ lane: "main" }, { lane: "side", fork: "main" }, { lane: "main" }, { lane: "side", join: "main" }]

    expect(flowAttributes(items)).toStrictEqual({
      timeline: { "data-flow": "2" },
      items: [
        { "data-lane": "main", "data-flow-col": "1", "data-flow-cap": "start" },
        { "data-lane": "side", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "start" },
        { "data-lane": "main", "data-flow-col": "1", "data-flow-through": "2" },
        { "data-lane": "side", "data-flow-col": "2", "data-flow-through": "1", "data-flow-join": "1" },
      ],
    })
  })

  it("allows four Lanes at once and rejects a fifth", () => {
    const four: FlowItem[] = [
      { lane: "main" },
      { lane: "a", fork: "main" },
      { lane: "b", fork: "main" },
      { lane: "c", fork: "main" },
      { lane: "main" },
      { lane: "a" },
      { lane: "b" },
      { lane: "c" },
    ]

    expect(flowAttributes(four).timeline).toStrictEqual({ "data-flow": "4" })
    expect(() => flowAttributes([...four.slice(0, 5), { lane: "d", fork: "main" }, ...four.slice(5)])).toThrow(FlowError)
  })

  it("rejects an Item on a Lane that has already Joined", () => {
    expect(() =>
      flowAttributes([{ lane: "main" }, { lane: "side", fork: "main" }, { lane: "side", join: "main" }, { lane: "side" }]),
    ).toThrow(/^Item 4 \(Lane "side"\): cannot add an Item to a Lane that has already Joined$/)
  })

  it("rejects a Fork from a Lane that is not running", () => {
    expect(() => flowAttributes([{ lane: "feature", fork: "missing" }])).toThrow(FlowError)
  })

  it("rejects a Join into a Lane that is not running", () => {
    expect(() => flowAttributes([{ lane: "main" }, { lane: "main", join: "missing" }])).toThrow(FlowError)
  })

  it("rejects a Fork of a Lane that is already running", () => {
    expect(() => flowAttributes([{ lane: "main" }, { lane: "side", fork: "main" }, { lane: "side", fork: "main" }])).toThrow(FlowError)
  })

  it("rejects a second root Lane", () => {
    expect(() => flowAttributes([{ lane: "main" }, { lane: "other" }])).toThrow(FlowError)
  })

  it("rejects a Lane that Joins itself", () => {
    expect(() => flowAttributes([{ lane: "main" }, { lane: "main", join: "main" }])).toThrow(FlowError)
  })

  it("rejects empty Lane, Fork and Join names", () => {
    expect(() => flowAttributes([{ lane: "" }])).toThrow(FlowError)
    expect(() => flowAttributes([{ lane: "main" }, { lane: "main", fork: "" }])).toThrow(FlowError)
    expect(() => flowAttributes([{ lane: "main" }, { lane: "main", join: "" }])).toThrow(FlowError)
  })

  it("does not change its input and returns a new object each time", () => {
    const items: FlowItem[] = [{ lane: "main" }, { lane: "side", fork: "main" }, { lane: "side", join: "main" }]
    const snapshot = structuredClone(items)

    const first = flowAttributes(items)
    const second = flowAttributes(items)

    expect(items).toStrictEqual(snapshot)
    expect(second).toStrictEqual(first)
    expect(second).not.toBe(first)
    expect(second.items[0]).not.toBe(first.items[0])
  })
})
