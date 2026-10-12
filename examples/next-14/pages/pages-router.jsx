import Head from "next/head"
import { DemoTimeline } from "../components/demo-timeline"

export default function PagesRouterPage() {
  return (
    <main>
      <Head>
        <title>tokiline example</title>
      </Head>
      <h1>tokiline in the Pages Router</h1>
      <DemoTimeline />
      <p>
        <a href="/">The same Timeline in the App Router</a>
      </p>
    </main>
  )
}
