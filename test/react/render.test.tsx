import { readFileSync } from "node:fs"
import { createRef } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { flowAttributes } from "../../src/flow"
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "../../src/react/index"
import type { FlowTimelineAttributes } from "../../src/flow"
import * as parts from "../../src/react/index"

describe("Timeline HTML", () => {
  it("renders an empty ordered list with only the contract class", () => {
    expect(renderToStaticMarkup(<Timeline />)).toBe('<ol class="toki-timeline"></ol>')
  })

  it("omits default variants and disabled Reveal", () => {
    expect(renderToStaticMarkup(<Timeline side="alternate" collapse="md" reveal={false} />)).toBe('<ol class="toki-timeline"></ol>')
  })

  it("renders non-default variants using contract attributes", () => {
    expect(renderToStaticMarkup(<Timeline side="end" collapse="never" reveal />)).toBe(
      '<ol class="toki-timeline" data-side="end" data-collapse="never" data-reveal="scroll"></ol>',
    )
  })

  it("renders Orientation and Preset using contract attributes", () => {
    expect(renderToStaticMarkup(<Timeline orientation="horizontal" preset="hotaru" />)).toBe(
      '<ol class="toki-timeline" data-orientation="horizontal" data-preset="hotaru"></ol>',
    )
  })

  it("omits the default Orientation and an unspecified Preset", () => {
    expect(renderToStaticMarkup(<Timeline orientation="vertical" />)).toBe('<ol class="toki-timeline"></ol>')
    expect(renderToStaticMarkup(<Timeline />)).toBe('<ol class="toki-timeline"></ol>')
  })

  it("gives helper attributes precedence over directly supplied attributes", () => {
    const html = renderToStaticMarkup(
      <Timeline side="end" collapse="never" reveal data-side="start" data-collapse="always" data-reveal="custom" />,
    )
    expect(html).toBe('<ol data-side="end" data-collapse="never" data-reveal="scroll" class="toki-timeline"></ol>')
    expect(renderToStaticMarkup(<Timeline orientation="horizontal" preset="hotaru" data-orientation="vertical" data-preset="kawa" />)).toBe(
      '<ol data-orientation="horizontal" data-preset="hotaru" class="toki-timeline"></ol>',
    )
    expect(renderToStaticMarkup(<TimelineItem side="start" data-side="end" />)).toBe('<li data-side="start" class="toki-item"></li>')
    expect(renderToStaticMarkup(<TimelineItem variant="compact" status="done" data-variant="milestone" data-status="upcoming" />)).toBe(
      '<li data-variant="compact" data-status="done" class="toki-item"></li>',
    )
  })

  it("renders an Item with its Side", () => {
    expect(renderToStaticMarkup(<TimelineItem side="start">Item</TimelineItem>)).toBe('<li class="toki-item" data-side="start">Item</li>')
  })

  it("renders an Item with its Variant and Status using contract attributes", () => {
    expect(renderToStaticMarkup(<TimelineItem variant="milestone" status="current" />)).toBe(
      '<li class="toki-item" data-variant="milestone" data-status="current"></li>',
    )
  })

  it("omits an unspecified Variant and Status", () => {
    expect(renderToStaticMarkup(<TimelineItem />)).toBe('<li class="toki-item"></li>')
  })

  it("renders a complete Timeline in the supplied order", () => {
    const html = renderToStaticMarkup(
      <Timeline>
        <TimelineItem>
          <TimelineMarker>1</TimelineMarker>
          <TimelineMeta>
            <time dateTime="2025">2025</time>
          </TimelineMeta>
          <TimelineCard>
            <h2>First</h2>
          </TimelineCard>
        </TimelineItem>
        <TimelineItem side="end">
          <TimelineMarker>2</TimelineMarker>
          <TimelineMeta>
            <time dateTime="2026">2026</time>
          </TimelineMeta>
          <TimelineCard>
            <h2>Second</h2>
          </TimelineCard>
        </TimelineItem>
      </Timeline>,
    )
    expect(html).toBe(
      '<ol class="toki-timeline">' +
        '<li class="toki-item"><div class="toki-marker">1</div>' +
        '<div class="toki-meta"><time dateTime="2025">2025</time></div>' +
        '<div class="toki-card"><h2>First</h2></div></li>' +
        '<li class="toki-item" data-side="end"><div class="toki-marker">2</div>' +
        '<div class="toki-meta"><time dateTime="2026">2026</time></div>' +
        '<div class="toki-card"><h2>Second</h2></div></li></ol>',
    )
  })
})

describe("Flow props", () => {
  const layout = flowAttributes([{ lane: "main" }, { lane: "side", fork: "main" }, { lane: "side", join: "main" }])

  it("renders the Timeline and Items with the computed Flow attributes", () => {
    const html = renderToStaticMarkup(
      <Timeline flow={layout.timeline}>
        <TimelineItem flow={layout.items[0]} />
        <TimelineItem flow={layout.items[1]} />
        <TimelineItem flow={layout.items[2]} />
      </Timeline>,
    )
    expect(html).toBe(
      '<ol data-flow="2" class="toki-timeline">' +
        '<li data-lane="main" data-flow-col="1" data-flow-cap="start" class="toki-item"></li>' +
        '<li data-lane="side" data-flow-col="2" data-flow-through="1" data-flow-fork="1" data-flow-cap="start" class="toki-item"></li>' +
        '<li data-lane="side" data-flow-col="2" data-flow-through="1" data-flow-join="1" class="toki-item"></li>' +
        "</ol>",
    )
  })

  it("omits Flow attributes when flow is not passed", () => {
    expect(
      renderToStaticMarkup(
        <Timeline>
          <TimelineItem />
        </Timeline>,
      ),
    ).toBe('<ol class="toki-timeline"><li class="toki-item"></li></ol>')
  })

  it("puts flow attributes after the caller's props", () => {
    expect(renderToStaticMarkup(<Timeline data-flow="4" flow={layout.timeline} />)).toBe('<ol data-flow="2" class="toki-timeline"></ol>')
    expect(renderToStaticMarkup(<TimelineItem data-lane="other" data-flow-col="4" flow={layout.items[0]} />)).toBe(
      '<li data-lane="main" data-flow-col="1" data-flow-cap="start" class="toki-item"></li>',
    )
  })

  it("merges a Flow style under the caller's style", () => {
    const flow = { "data-flow": "2", style: { "--toki-line-color": "red", color: "blue" } } as unknown as FlowTimelineAttributes
    expect(renderToStaticMarkup(<Timeline flow={flow} style={{ color: "green" }} />)).toBe(
      '<ol data-flow="2" style="--toki-line-color:red;color:green" class="toki-timeline"></ol>',
    )
  })
})

describe.each([
  [Timeline, "ol", "toki-timeline"],
  [TimelineItem, "li", "toki-item"],
  [TimelineMarker, "div", "toki-marker"],
  [TimelineCard, "div", "toki-card"],
  [TimelineMeta, "div", "toki-meta"],
] as const)("%s common props", (Part, tag, partClass) => {
  it("renders children inside the contract tag and class", () => {
    expect(
      renderToStaticMarkup(
        <Part>
          <span>Child</span>
        </Part>,
      ),
    ).toBe(`<${tag} class="${partClass}"><span>Child</span></${tag}>`)
  })

  it.each([undefined, "", "x"])("appends className %j without an extra space for empty values", (className) => {
    const expectedClass = className ? `${partClass} x` : partClass
    expect(renderToStaticMarkup(<Part className={className} />)).toBe(`<${tag} class="${expectedClass}"></${tag}>`)
  })

  it("passes through native attributes and CSS custom properties", () => {
    expect(renderToStaticMarkup(<Part id="history" aria-label="History" data-testid="part" style={{ "--toki-line-color": "red" }} />)).toBe(
      `<${tag} id="history" aria-label="History" data-testid="part" style="--toki-line-color:red" class="${partClass}"></${tag}>`,
    )
  })

  it("preserves ref, event, style, and children props on the host element", () => {
    // Static markup cannot expose refs or event handlers; inspect the returned host element.
    const ref = createRef<never>()
    const onClick = vi.fn()
    const style = { "--toki-line-color": "red" }
    const children = <span>Child</span>
    const element = Part({ ref, onClick, style, children })
    expect(element.type).toBe(tag)
    expect(element.props).toMatchObject({ ref, onClick, style, children })
  })
})

describe("React entry point", () => {
  it("exports only the five named components", () => {
    expect(Object.keys(parts).sort()).toEqual(["Timeline", "TimelineCard", "TimelineItem", "TimelineMarker", "TimelineMeta"])
    expect(Timeline).not.toHaveProperty("Item")
  })

  it("contains no client directive, hooks, ref wrapper, or default export", () => {
    const source = readFileSync(new URL("../../src/react/index.tsx", import.meta.url), "utf8")
    expect(source).not.toMatch(/use client|useState|useEffect|useContext|forwardRef|export default/)
  })
})
