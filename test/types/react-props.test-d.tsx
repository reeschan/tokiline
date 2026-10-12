import { createRef } from "react"
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "../../src/react/index"
import type { TimelineCardProps, TimelineItemProps, TimelineMarkerProps, TimelineMetaProps, TimelineProps } from "../../src/react/index"

// Checked by tsc only; this file is not a runtime test.
;<Timeline side="alternate" collapse="lg" reveal />
;<TimelineItem side="end" />
;<Timeline style={{ "--toki-line-color": "red" }} />
;<Timeline style={{ "--toki-line-width": 2, "--toki-gap": undefined, color: "red" }} />
;<Timeline ref={createRef<HTMLOListElement>()} />

const timelineProps: TimelineProps = { start: 2, reversed: true, ref: createRef<HTMLOListElement>() }
const itemProps: TimelineItemProps = { value: 2, side: "start", ref: createRef<HTMLLIElement>() }
const markerProps: TimelineMarkerProps = { title: "Marker", ref: createRef<HTMLDivElement>() }
const cardProps: TimelineCardProps = { tabIndex: 0, ref: createRef<HTMLDivElement>() }
const metaProps: TimelineMetaProps = { "aria-label": "Date", ref: createRef<HTMLDivElement>() }

;<Timeline {...timelineProps} />
;<TimelineItem {...itemProps} />
;<TimelineMarker {...markerProps} />
;<TimelineCard {...cardProps} />
;<TimelineMeta {...metaProps} />

// @ts-expect-error -- Timeline accepts logical Sides only.
;<Timeline side="left" />
// @ts-expect-error -- Alternate is a Timeline-wide setting.
;<TimelineItem side="alternate" />
// @ts-expect-error -- xl is not a supported Collapse threshold.
;<Timeline collapse="xl" />
// @ts-expect-error -- Custom properties outside the toki prefix are not added.
;<Timeline style={{ "--other": "x" }} />
// @ts-expect-error -- Timeline renders an ol, so a div ref is incompatible.
;<Timeline ref={createRef<HTMLDivElement>()} />
