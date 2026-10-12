# tokiline

フレームワークに依存しないタイムライン UI。CSS と HTML の決まりが中心で、React 版は任意です。

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-dark.png" />
    <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-light.png" alt="Alternate の並びで 4 つの Item が並ぶ縦のタイムライン。Kickoff・Design review・Public beta・Version 1.0 で、それぞれ アイコン入りの Marker と日付と Card がある。" width="944" />
  </picture>
</p>

[English](README.md) | 日本語

## Features

- どのフレームワークでも、フレームワークなしでも使える CSS と HTML の決まり。
- 任意の React 版。Server Component として描画でき、Next.js の App Router と Pages Router で動き、React 18.2 以上と 19 に対応します。
- 実行時の JavaScript はゼロ。
- すべての規則が `@layer tokiline` に入っているので、自分の CSS や Tailwind のクラスが `!important` なしで勝ちます。
- コンテナクエリでの Collapse。Alternate の折りたたみは、画面ではなくタイムライン自身の幅で決まります。
- 右から左に書く言語に対応。左右は論理方向 (`start` と `end`) なので、自動で反転します。

## Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/architecture/architecture-dark.svg" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/architecture/architecture-light.svg" alt="tokiline の構成図。GitHub のリポジトリで、CSS と HTML の決まり・TypeScript のヘルパ・React の部品を tsdown と Lightning CSS でビルドする。GitHub Actions が push のたびに CI を回し、npm に公開し、デモのサイトを公開する。利用する側のアプリ (素の HTML・Next.js・Tailwind CSS v4・Vue や Svelte や Astro) がそれを入れ、ブラウザは実行時の JavaScript なしでタイムラインを描く。" width="720" />
</picture>

図の元は [`docs/architecture/architecture.d2`](docs/architecture/architecture.d2) です。

## Install

```sh
npm install tokiline
```

```sh
pnpm add tokiline
```

```sh
yarn add tokiline
```

## Usage with HTML

CSS を 1 回だけ読み込みます。バンドラがあるときは import し、無いときは `node_modules/tokiline/dist/style.css` を link します。

```css
@import "tokiline/style.css";
```

次に、5 つの部品を書きます。Item の中は Marker、Meta、Card の順にします。

```html
<ol class="toki-timeline">
  <li class="toki-item">
    <div class="toki-marker">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    </div>
    <div class="toki-meta"><time datetime="2026-04">April 2026</time></div>
    <div class="toki-card">
      <h3>Joined the team</h3>
      <p>Started as a front-end developer.</p>
    </div>
  </li>
  <li class="toki-item">
    <div class="toki-marker">2</div>
    <div class="toki-meta"><time datetime="2026-10">October 2026</time></div>
    <div class="toki-card">
      <h3>First release</h3>
      <p>Shipped version 1.0.</p>
    </div>
  </li>
</ol>
```

Marker には、アイコン (svg など) も、文字 (手順の番号など) も入れられます。中身の色は `--toki-marker-fg` で決まります。

## Usage with React

CSS は利用者が読み込みます。パッケージの JavaScript は CSS を読み込みません。

React 18 で TypeScript を使う場合は、`@types/react` 18.2.7 以上が必要です。

```tsx
import { Timeline, TimelineCard, TimelineItem, TimelineMarker, TimelineMeta } from "tokiline/react"

export function Career() {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineMarker>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </TimelineMarker>
        <TimelineMeta>
          <time dateTime="2026-04">April 2026</time>
        </TimelineMeta>
        <TimelineCard>
          <h3>Joined the team</h3>
          <p>Started as a front-end developer.</p>
        </TimelineCard>
      </TimelineItem>
      <TimelineItem>
        <TimelineMarker>2</TimelineMarker>
        <TimelineMeta>
          <time dateTime="2026-10">October 2026</time>
        </TimelineMeta>
        <TimelineCard>
          <h3>First release</h3>
          <p>Shipped version 1.0.</p>
        </TimelineCard>
      </TimelineItem>
    </Timeline>
  )
}
```

部品はフックも `"use client"` も使わないので、Server Component の中で使えます。

### Next.js App Router

root layout で CSS を import します。

```jsx
// app/layout.jsx
import "tokiline/style.css"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Next.js Pages Router

`pages/_app` で CSS を import します。

```jsx
// pages/_app.jsx
import "tokiline/style.css"

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
```

## Placement

### Side

Side は、Card が Line のどちら側に出るかです。

| 値          | HTML                                     | React                               | 意味                                                  |
| ----------- | ---------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `alternate` | 指定なし、または `data-side="alternate"` | 指定なし、または `side="alternate"` | Item が `start` と `end` に交互に並びます。既定です。 |
| `start`     | `data-side="start"`                      | `side="start"`                      | すべての Card が `start` 側に出ます。                 |
| `end`       | `data-side="end"`                        | `side="end"`                        | すべての Card が `end` 側に出ます。                   |

Timeline に指定します。

```html
<ol class="toki-timeline" data-side="end">
  …
</ol>
```

```tsx
<Timeline side="end">…</Timeline>
```

Item にも `side` を指定できます。これは、Timeline が Alternate で、両側が使われる横並びのときだけ効きます。Timeline が `start` か `end` のとき、または Collapse したときは、無視されます。

```html
<li class="toki-item" data-side="start">…</li>
```

```tsx
<TimelineItem side="start">…</TimelineItem>
```

### Collapse

Alternate の Timeline が狭くて両側を使えないとき、すべての Card が `end` 側に移ります。これを Collapse と呼びます。判断は、Timeline 自身の幅で行います。

| 値       | HTML                                  | React                            | Timeline の幅がこれより狭いと Collapse  |
| -------- | ------------------------------------- | -------------------------------- | --------------------------------------- |
| `sm`     | `data-collapse="sm"`                  | `collapse="sm"`                  | 32rem                                   |
| `md`     | 指定なし、または `data-collapse="md"` | 指定なし、または `collapse="md"` | 48rem。既定です。                       |
| `lg`     | `data-collapse="lg"`                  | `collapse="lg"`                  | 64rem                                   |
| `never`  | `data-collapse="never"`               | `collapse="never"`               | しません。常に両側を使います。          |
| `always` | `data-collapse="always"`              | `collapse="always"`              | 常にします。すべての Card が `end` 側。 |

```html
<ol class="toki-timeline" data-collapse="lg">
  …
</ol>
```

```tsx
<Timeline collapse="lg">…</Timeline>
```

`collapse` は、Alternate のときだけ効きます。

## Reveal

Reveal は、Item がスクロールで画面に入るときに再生する登場アニメーションです。既定では無効です。使うときは Timeline に指定します。

```html
<ol class="toki-timeline" data-reveal="scroll">
  …
</ol>
```

```tsx
<Timeline reveal>…</Timeline>
```

Reveal は CSS のスクロール連動アニメーションで動きます。対応していないブラウザ (2026-10 時点の Firefox) と、「視差効果を減らす」設定のときは、アニメーションせず、すべての Item が普通に表示されます。

## Theming

見た目の調整はすべて `--toki-*` の CSS 変数で行います。tokiline は各変数を `var(--toki-name, 既定値)` の形で読むので、祖先 (`:root` など)・Timeline・Item のどこで指定しても効きます。Item に指定した値は、その Item にだけ効きます。既定値は `currentColor` とシステムカラーの `Canvas` だけを使うので、ページの文字色と `color-scheme` に従います。

| 変数                       | 意味                                      | 既定値                                                         |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `--toki-accent`            | Marker の背景のもとになる色               | `currentColor`                                                 |
| `--toki-gap`               | Item どうしの間隔                         | `2rem`                                                         |
| `--toki-gutter`            | Line と Card の間隔                       | `1rem`                                                         |
| `--toki-line-color`        | Line の色                                 | `color-mix(in oklab, currentColor 25%, transparent)`           |
| `--toki-line-width`        | Line の太さ (`0` で消える)                | `2px`                                                          |
| `--toki-line-style`        | Line の線種 (`solid`・`dashed`・`dotted`) | `solid`                                                        |
| `--toki-marker-size`       | Marker の大きさ (`0` で消える)            | `2.5rem`                                                       |
| `--toki-marker-bg`         | Marker の背景                             | `--toki-accent` の値                                           |
| `--toki-marker-fg`         | Marker の中身の色                         | `Canvas`                                                       |
| `--toki-marker-ring-width` | Marker のまわりの輪の太さ                 | `0.25rem`                                                      |
| `--toki-marker-ring-color` | Marker のまわりの輪の色                   | `Canvas`                                                       |
| `--toki-card-bg`           | Card の背景 (Arrow も同じ色になる)        | `color-mix(in oklab, currentColor 6%, Canvas)`                 |
| `--toki-card-fg`           | Card の文字色                             | `currentColor`                                                 |
| `--toki-card-border`       | Card の枠線                               | `1px solid color-mix(in oklab, currentColor 15%, transparent)` |
| `--toki-card-radius`       | Card の角の丸み                           | `0.5rem`                                                       |
| `--toki-card-padding`      | Card の内側の余白                         | `1rem`                                                         |
| `--toki-card-shadow`       | Card の影                                 | `0 1px 2px color-mix(in oklab, currentColor 12%, transparent)` |
| `--toki-arrow-size`        | Arrow の大きさ (`0` で消える)             | `0.5rem`                                                       |
| `--toki-meta-fg`           | Meta の文字色                             | `color-mix(in oklab, currentColor 70%, transparent)`           |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/theming-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/theming-light.png" alt="2 つのタイムラインを左右に並べた画像。左は紫の独自の色と丸い Card、右は番号つきの手順で、実線・破線・点線の Line と、薄く見せた最後の Card。" width="944" />
</picture>

Item ごとに線種を変えるときは、その Item に変数を指定します。

```html
<li class="toki-item" style="--toki-line-style: dashed">…</li>
```

```tsx
<TimelineItem style={{ "--toki-line-style": "dashed" }}>…</TimelineItem>
```

ページ全体の変数は、自分の CSS で指定することもできます。

```css
:root {
  --toki-accent: royalblue;
  --toki-gap: 3rem;
}
```

## Tailwind CSS v4

自分の CSS で、Tailwind の後に tokiline を `components` の layer の中へ読み込みます。

```css
@import "tailwindcss";
@import "tokiline/style.css" layer(components);
```

理由: cascade layer の強さは、最初に現れた順で決まります。JavaScript から CSS を読み込むと、読み込み順が変わることがあります。すると `tokiline` の layer が `utilities` より強くなって Tailwind のクラスが負けたり、`base` より弱くなって Tailwind のリセットが勝ったりします。`layer(components)` を付けると、tokiline は常に Tailwind の base より強く、ユーティリティより弱くなります。

shadcn/ui のテーマを使うときは、その変数を tokiline の変数に対応づけます。

```css
.toki-timeline {
  --toki-line-color: var(--border);
  --toki-line-width: 1px;
  --toki-marker-size: 2rem;
  --toki-marker-bg: var(--primary);
  --toki-marker-fg: var(--primary-foreground);
  --toki-marker-ring-width: 4px;
  --toki-marker-ring-color: var(--card);
  --toki-card-bg: var(--card);
  --toki-arrow-size: 0;
}
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/tailwind-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/tailwind-light.png" alt="Tailwind CSS v4 と shadcn/ui のパレットで作った経歴のタイムライン。かばんのアイコンの Marker と、上の枠が太い Card。" width="672" />
</picture>

これは `site/acceptance/` にある受け入れのページで、Tailwind CSS v4 と shadcn/ui のパレットで作っています。

## TypeScript helpers

`tokiline` パッケージは、各部品の `class` と `data-*` の属性を返すヘルパを出しています。`timelineAttributes`・`itemAttributes`・`markerAttributes`・`cardAttributes`・`metaAttributes` です。Vue や Svelte などの部品を作るときに使います。

```ts
import { timelineAttributes } from "tokiline"

timelineAttributes({ side: "end", collapse: "lg", reveal: "scroll" })
// { class: "toki-timeline", "data-side": "end", "data-collapse": "lg", "data-reveal": "scroll" }
```

既定の値 (`alternate`・`md`) は返り値に含まれません。返り値は要素に展開します。

```vue
<!-- Timeline.vue -->
<script setup lang="ts">
import { timelineAttributes } from "tokiline"
import type { TimelineSide } from "tokiline"

const props = defineProps<{ side?: TimelineSide }>()
</script>

<template>
  <ol v-bind="timelineAttributes({ side: props.side })">
    <slot />
  </ol>
</template>
```

```svelte
<ol {...timelineAttributes({ side: "end" })}><slot /></ol>
```

型の `Side`・`TimelineSide`・`Collapse`・`Reveal`・`TimelineOptions`・`ItemOptions`・`PartAttributes` も出しています。

## Browser support

tokiline は、Baseline の「広く利用可能」な CSS の機能だけを使います。例外は Reveal だけです。スクロール連動アニメーションを、あれば使うおまけとして使い、これが無くても内容と配置は崩れません。

Timeline はコンテナ (`container-type: inline-size`) なので、横幅を中身から決められません。横幅が中身から決まる場所 (幅の指定の無い flex の子など) では、Timeline に幅を指定してください。

## Accessibility

- Timeline には `ol`、Item には `li` を使います。
- 日付は `<time>` に入れます。
- Marker は、自動では読み上げから外れません。飾りだけのアイコンには `aria-hidden="true"` を付けてください。
- 利用者にクリックさせたい所には、`button` か `a` を置きます。Marker や Card そのものをクリックできるようにはしません。

## Migrating from react-vertical-timeline-component

| react-vertical-timeline-component        | tokiline                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VerticalTimeline`                       | `Timeline`                                                                                                                                                                |
| `layout="2-columns"`                     | 既定 (`side="alternate"`)                                                                                                                                                 |
| `layout="1-column-left"` / `"1-column"`  | `side="end"`                                                                                                                                                              |
| `layout="1-column-right"`                | `side="start"`                                                                                                                                                            |
| `lineColor`                              | `--toki-line-color`                                                                                                                                                       |
| `animate`                                | `reveal` (既定は無効)                                                                                                                                                     |
| `VerticalTimelineElement`                | `TimelineItem` と、中の `TimelineMarker`・`TimelineMeta`・`TimelineCard`                                                                                                  |
| `icon`                                   | `TimelineMarker` の中身                                                                                                                                                   |
| `iconStyle` / `iconClassName`            | Marker の変数 (`--toki-marker-size`・`--toki-marker-bg`・`--toki-marker-fg`・`--toki-marker-ring-width`・`--toki-marker-ring-color`) / `TimelineMarker` の `className`    |
| `shadowSize`                             | `--toki-marker-ring-width`                                                                                                                                                |
| `contentStyle` / `textClassName`         | Card の変数 (`--toki-card-bg`・`--toki-card-fg`・`--toki-card-border`・`--toki-card-radius`・`--toki-card-padding`・`--toki-card-shadow`) / `TimelineCard` の `className` |
| `contentArrowStyle`                      | 不要 (Arrow は Card の背景色に自動で合う)。消すなら `--toki-arrow-size: 0`                                                                                                |
| `date` / `dateClassName`                 | `TimelineMeta` の中身 / `TimelineMeta` の `className`                                                                                                                     |
| `position`                               | `TimelineItem` の `side` (Alternate の横並びのときだけ効く)                                                                                                               |
| `iconOnClick` / `onTimelineElementClick` | 部品の中に `button` か `a` を置く                                                                                                                                         |
| `visible` / `intersectionObserverProps`  | 不要 (Reveal は CSS だけで動く)                                                                                                                                           |

書き換えの例:

```tsx
// Before
<VerticalTimeline layout="1-column-left" lineColor="#ccc">
  <VerticalTimelineElement date="2026-04" icon={<Icon />} iconStyle={{ background: "royalblue" }}>
    <h3>Joined the team</h3>
  </VerticalTimelineElement>
</VerticalTimeline>

// After
<Timeline side="end" style={{ "--toki-line-color": "#ccc", "--toki-marker-bg": "royalblue" }}>
  <TimelineItem>
    <TimelineMarker>
      <Icon aria-hidden="true" />
    </TimelineMarker>
    <TimelineMeta>2026-04</TimelineMeta>
    <TimelineCard>
      <h3>Joined the team</h3>
    </TimelineCard>
  </TimelineItem>
</Timeline>
```

## Acknowledgements

tokiline は、Stéphane Monnot さんの [react-vertical-timeline-component](https://github.com/stephane-monnot/react-vertical-timeline) に着想を得て、一から書き直した部品です。元の作者とすべての貢献者に感謝します。

## License

[MIT](LICENSE)
