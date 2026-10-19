import type { CSSProperties, ComponentProps } from "react"
import { cardAttributes, itemAttributes, markerAttributes, metaAttributes, timelineAttributes } from "../contract"
import type { Collapse, Orientation, Preset, Side, Status, TimelineSide, Variant } from "../contract"
import type { FlowItemAttributes, FlowTimelineAttributes } from "../flow"

declare module "react" {
  interface CSSProperties {
    [key: `--toki-${string}`]: string | number | undefined
  }
}

export type TimelineProps = ComponentProps<"ol"> & {
  side?: TimelineSide
  collapse?: Collapse
  reveal?: boolean
  orientation?: Orientation
  preset?: Preset
  flow?: FlowTimelineAttributes
}

export type TimelineItemProps = ComponentProps<"li"> & {
  side?: Side
  variant?: Variant
  status?: Status
  flow?: FlowItemAttributes
}

export type TimelineMarkerProps = ComponentProps<"div">
export type TimelineCardProps = ComponentProps<"div">
export type TimelineMetaProps = ComponentProps<"div">

function mergeClassName(partClass: string, className: string | undefined): string {
  return className ? `${partClass} ${className}` : partClass
}

/** Splits a Flow attribute object into the attributes to spread and an optional style to merge. */
function splitFlow<F extends object>(flow: F | undefined): { data: Omit<F, "style">; style: CSSProperties | undefined } {
  if (flow === undefined) return { data: {} as Omit<F, "style">, style: undefined }
  const { style, ...data } = flow as F & { style?: CSSProperties }
  return { data, style }
}

/** Merges a Flow style under the Timeline's own style, so the caller's value wins. */
function mergeStyle(style: CSSProperties | undefined, flowStyle: CSSProperties | undefined): CSSProperties | undefined {
  return flowStyle === undefined ? style : { ...flowStyle, ...style }
}

export function Timeline({ side, collapse, reveal, orientation, preset, flow, className, style, ...props }: TimelineProps) {
  const { class: partClass, ...data } = timelineAttributes({ side, collapse, reveal: reveal ? "scroll" : undefined, orientation, preset })
  const { data: flowData, style: flowStyle } = splitFlow(flow)
  return <ol {...props} {...flowData} style={mergeStyle(style, flowStyle)} className={mergeClassName(partClass, className)} {...data} />
}

export function TimelineItem({ side, variant, status, flow, className, style, ...props }: TimelineItemProps) {
  const { class: partClass, ...data } = itemAttributes({ side, variant, status })
  const { data: flowData, style: flowStyle } = splitFlow(flow)
  return <li {...props} {...flowData} style={mergeStyle(style, flowStyle)} className={mergeClassName(partClass, className)} {...data} />
}

export function TimelineMarker({ className, ...props }: TimelineMarkerProps) {
  const { class: partClass, ...data } = markerAttributes()
  return <div {...props} className={mergeClassName(partClass, className)} {...data} />
}

export function TimelineCard({ className, ...props }: TimelineCardProps) {
  const { class: partClass, ...data } = cardAttributes()
  return <div {...props} className={mergeClassName(partClass, className)} {...data} />
}

export function TimelineMeta({ className, ...props }: TimelineMetaProps) {
  const { class: partClass, ...data } = metaAttributes()
  return <div {...props} className={mergeClassName(partClass, className)} {...data} />
}
