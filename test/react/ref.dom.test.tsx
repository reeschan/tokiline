// @vitest-environment jsdom
import { act, createRef } from "react"
import type { ReactNode } from "react"
import { createRoot } from "react-dom/client"
import type { Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "../../src/react/index"

declare global {
  // React checks this flag in act() and warns when the environment does not set it.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
})

function render(children: ReactNode) {
  act(() => {
    root.render(children)
  })
}

// The ref must point at the element React put in the container, and that element must carry the part's class.
function expectRenderedPart(element: HTMLElement | null, partClass: string) {
  expect(element).toBe(container.firstElementChild)
  expect(element).toHaveProperty("className", partClass)
}

describe("ref in React 19", () => {
  it("Timeline passes ref through to its HTMLOListElement", () => {
    const ref = createRef<HTMLOListElement>()
    render(<Timeline ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLOListElement)
    expectRenderedPart(ref.current, "toki-timeline")
  })

  it("TimelineItem passes ref through to its HTMLLIElement", () => {
    const ref = createRef<HTMLLIElement>()
    render(<TimelineItem ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLLIElement)
    expectRenderedPart(ref.current, "toki-item")
  })

  it("TimelineMarker passes ref through to its HTMLDivElement", () => {
    const ref = createRef<HTMLDivElement>()
    render(<TimelineMarker ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expectRenderedPart(ref.current, "toki-marker")
  })

  it("TimelineCard passes ref through to its HTMLDivElement", () => {
    const ref = createRef<HTMLDivElement>()
    render(<TimelineCard ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expectRenderedPart(ref.current, "toki-card")
  })

  it("TimelineMeta passes ref through to its HTMLDivElement", () => {
    const ref = createRef<HTMLDivElement>()
    render(<TimelineMeta ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expectRenderedPart(ref.current, "toki-meta")
  })
})
