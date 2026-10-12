import { version } from "react"
import { renderToStaticMarkup, version as reactDomVersion } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "../../src/react/index"

// Runs only in the react18 project of vitest.config.ts, whose aliases send react and react-dom to test/react18.
describe("React 18 aliases", () => {
  it("resolves react and react-dom to version 18", () => {
    expect(version).toMatch(/^18\./)
    expect(reactDomVersion).toMatch(/^18\./)
  })

  it("builds the elements of src/react with the React 18 JSX runtime", () => {
    // React 19 marks its elements with react.transitional.element instead.
    expect(Timeline({})).toHaveProperty("$$typeof", Symbol.for("react.element"))
    expect(<TimelineItem />).toHaveProperty("$$typeof", Symbol.for("react.element"))
  })
})

describe("Timeline HTML in React 18", () => {
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

  it("gives helper attributes precedence over directly supplied attributes", () => {
    const html = renderToStaticMarkup(
      <Timeline side="end" collapse="never" reveal data-side="start" data-collapse="always" data-reveal="custom" />,
    )
    expect(html).toBe('<ol data-side="end" data-collapse="never" data-reveal="scroll" class="toki-timeline"></ol>')
    expect(renderToStaticMarkup(<TimelineItem side="start" data-side="end" />)).toBe('<li data-side="start" class="toki-item"></li>')
  })

  it("renders an Item with its Side", () => {
    expect(renderToStaticMarkup(<TimelineItem side="start">Item</TimelineItem>)).toBe('<li class="toki-item" data-side="start">Item</li>')
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

// React 18 keeps ref out of the props of function components, so the ref test runs with React 19 only (ref.dom.test.tsx).
describe.each([
  { name: "Timeline", Part: Timeline, tag: "ol", partClass: "toki-timeline" },
  { name: "TimelineItem", Part: TimelineItem, tag: "li", partClass: "toki-item" },
  { name: "TimelineMarker", Part: TimelineMarker, tag: "div", partClass: "toki-marker" },
  { name: "TimelineCard", Part: TimelineCard, tag: "div", partClass: "toki-card" },
  { name: "TimelineMeta", Part: TimelineMeta, tag: "div", partClass: "toki-meta" },
] as const)("$name common props in React 18", ({ Part, tag, partClass }) => {
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
})
