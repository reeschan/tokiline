import { flowAttributes } from "tokiline"
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "tokiline/react"

const items = [
  { date: "2026-01", label: "January 2026", title: "Kickoff", text: "The team agrees on the goals and the first milestones." },
  { date: "2026-04", label: "April 2026", title: "Beta", text: "Early users try the beta and send their feedback." },
  { date: "2026-10", label: "October 2026", title: "Launch", text: "The first stable version ships." },
]

// A Flow of two Lanes: the feature Lane Forks from the main Lane and Joins it again.
const flowItems = [
  {
    lane: "main",
    date: "2026-01",
    label: "January 2026",
    title: "Kickoff",
    text: "The team agrees on the goals and the first milestones.",
  },
  {
    lane: "feature",
    fork: "main",
    date: "2026-02",
    label: "February 2026",
    title: "Draft the feature",
    text: "A smaller group starts on the feature while the main work goes on.",
  },
  {
    lane: "feature",
    join: "main",
    date: "2026-04",
    label: "April 2026",
    title: "Fold it back",
    text: "The feature Joins the main Lane after this event.",
  },
  { lane: "main", date: "2026-10", label: "October 2026", title: "Launch", text: "The first stable version ships." },
]

const flow = flowAttributes(flowItems)

// These Timelines use no hooks, so the App Router renders them as Server Components and the Pages Router renders them
// as they are.
export function DemoTimeline() {
  return (
    <>
      <Timeline>
        {items.map(({ date, label, title, text }) => (
          <TimelineItem key={date}>
            <TimelineMarker />
            <TimelineMeta>
              <time dateTime={date}>{label}</time>
            </TimelineMeta>
            <TimelineCard>
              <h3>{title}</h3>
              <p>{text}</p>
            </TimelineCard>
          </TimelineItem>
        ))}
      </Timeline>

      <Timeline orientation="horizontal" preset="hotaru" tabIndex={0} aria-label="Horizontal timeline">
        {items.map(({ date, label, title, text }) => (
          <TimelineItem key={date}>
            <TimelineMarker />
            <TimelineMeta>
              <time dateTime={date}>{label}</time>
            </TimelineMeta>
            <TimelineCard>
              <h3>{title}</h3>
              <p>{text}</p>
            </TimelineCard>
          </TimelineItem>
        ))}
      </Timeline>

      <Timeline flow={flow.timeline}>
        {flowItems.map(({ date, label, title, text }, index) => (
          <TimelineItem key={date} flow={flow.items[index]}>
            <TimelineMarker />
            <TimelineMeta>
              <time dateTime={date}>{label}</time>
            </TimelineMeta>
            <TimelineCard>
              <h3>{title}</h3>
              <p>{text}</p>
            </TimelineCard>
          </TimelineItem>
        ))}
      </Timeline>
    </>
  )
}
