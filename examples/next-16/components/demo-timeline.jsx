import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "tokiline/react"

const items = [
  { date: "2026-01", label: "January 2026", title: "Kickoff", text: "The team agrees on the goals and the first milestones." },
  { date: "2026-04", label: "April 2026", title: "Beta", text: "Early users try the beta and send their feedback." },
  { date: "2026-10", label: "October 2026", title: "Launch", text: "The first stable version ships." },
]

// A Timeline of three Items. It uses no hooks, so the App Router renders it as a Server Component
// and the Pages Router renders it as it is.
export function DemoTimeline() {
  return (
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
  )
}
