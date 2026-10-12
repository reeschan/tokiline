import { DemoTimeline } from "../components/demo-timeline"

// A Server Component: the Timeline is rendered on the server and adds no JavaScript to the page.
export default function Page() {
  return (
    <main>
      <h1>tokiline in the App Router</h1>
      <DemoTimeline />
      <p>
        {/* A plain link: going from the App Router to the Pages Router loads a new page anyway. */}
        <a href="/pages-router">The same Timeline in the Pages Router</a>
      </p>
    </main>
  )
}
