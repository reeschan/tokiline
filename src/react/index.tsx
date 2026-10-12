import type { ComponentProps } from "react"
import { cardAttributes, itemAttributes, markerAttributes, metaAttributes, timelineAttributes } from "../contract"
import type { Collapse, Side, TimelineSide } from "../contract"

declare module "react" {
  interface CSSProperties {
    [key: `--toki-${string}`]: string | number | undefined
  }
}

export type TimelineProps = ComponentProps<"ol"> & {
  side?: TimelineSide
  collapse?: Collapse
  reveal?: boolean
}

export type TimelineItemProps = ComponentProps<"li"> & {
  side?: Side
}

export type TimelineMarkerProps = ComponentProps<"div">
export type TimelineCardProps = ComponentProps<"div">
export type TimelineMetaProps = ComponentProps<"div">

function mergeClassName(partClass: string, className: string | undefined): string {
  return className ? `${partClass} ${className}` : partClass
}

export function Timeline({ side, collapse, reveal, className, ...props }: TimelineProps) {
  const { class: partClass, ...data } = timelineAttributes({ side, collapse, reveal: reveal ? "scroll" : undefined })
  return <ol {...props} className={mergeClassName(partClass, className)} {...data} />
}

export function TimelineItem({ side, className, ...props }: TimelineItemProps) {
  const { class: partClass, ...data } = itemAttributes({ side })
  return <li {...props} className={mergeClassName(partClass, className)} {...data} />
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
