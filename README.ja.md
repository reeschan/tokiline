# tokiline

フレームワークに依存しないタイムライン UI。CSS と HTML の決まりが中心で、React 版は任意です。

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-dark.png" />
    <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-light.png" alt="Alternate の並びで 4 つの Item が並ぶ縦のタイムライン。Kickoff・Design review・Public beta・Version 1.0 で、それぞれ アイコン入りの Marker と日付と Card がある。" width="944" />
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-horizontal-dark.png" />
    <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/hero-horizontal-light.png" alt="同じ 4 つの Item を横向きにしたタイムライン。Line が横に走り、Card は Marker の下にある。最初の 2 つは done、Public beta は current で Marker が大きく、Version 1.0 は upcoming の milestone で Line が破線、Card に枠がある。" width="944" />
  </picture>
</p>

[English](README.md) | 日本語

## Features

- どのフレームワークでも、フレームワークなしでも使える CSS と HTML の決まり。
- 任意の React 版。Server Component として描画でき、Next.js の App Router と Pages Router で動き、React 18.2 以上と 19 に対応します。
- 実行時の JavaScript はゼロ。
- すべての規則が `@layer tokiline` に入っているので、自分の CSS や Tailwind のクラスが `!important` なしで勝ちます。
- コンテナクエリでの Collapse。Alternate の折りたたみも、横向きの Timeline が縦になるのも、画面ではなくタイムライン自身の幅で決まります。
- 横向きの Orientation。Timeline 自身が横スクロールして Item ごとに止まります。
- Variant と Status。`compact` と `milestone` の重み、`done`・`current`・`upcoming` の状態を表せます。
- 3 つの Preset (`hotaru`・`kawa`・`kinen`)。動きのある見た目を、それぞれ別の CSS ファイルで読み込みます。
- Flow。Fork と Join をする Lane を、実行時の JavaScript なしで `flowAttributes()` が配置します。
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

`collapse` は、Alternate ではすべての Card が `end` 側に移る幅を、横向きの Timeline では縦になる幅を決めます。

## Orientation

Orientation は、Line が走る向きです。既定は縦です。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/orientation-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/orientation-light.png" alt="Alternate の並びの横向きのタイムライン。5 つの Item の Card が Line の上と下に交互に並び、日付は Card と反対の側にある。" width="944" />
</picture>

| 値           | HTML                                           | React                                     |
| ------------ | ---------------------------------------------- | ----------------------------------------- |
| `vertical`   | 指定なし、または `data-orientation="vertical"` | 指定なし、または `orientation="vertical"` |
| `horizontal` | `data-orientation="horizontal"`                | `orientation="horizontal"`                |

```html
<ol class="toki-timeline" data-orientation="horizontal" data-collapse="never" tabindex="0" aria-label="Release history">
  …
</ol>
```

```tsx
<Timeline orientation="horizontal" collapse="never" tabIndex={0} aria-label="Release history">
  …
</Timeline>
```

横向きの Timeline では、Line が横に走り、各 Item の幅は `--toki-item-size` (既定 `16rem`) になります。Timeline 自身が横のスクロールコンテナになり、Line の向きにスクロールして Item ごとに止まります。JavaScript は要りません。Item どうしの間隔は `--toki-gap` です。

自分でスクロールするので、横向きの Timeline には `tabindex="0"` と、内容を表す `aria-label` を付けます。キーボードでもそこへ届くようにするためです。React では `<Timeline orientation="horizontal" tabIndex={0} aria-label="…">` のように props で渡します (`Timeline` はほかの props を `<ol>` にそのまま渡します)。

Side の `start` は Line の上、`end` は下です。Meta は Line をはさんで Card の反対側に、Marker にそろって並びます。Alternate では Item ごとに上下が入れ替わります。右から左に書く言語では、時間も右から左に進みます。

横向きの Timeline は、`collapse` の閾値 (`sm` 32rem・`md` 48rem・`lg` 64rem) より狭いと縦になります。Alternate が折りたたまれるのと同じです。縦になったあとは、縦の決まりに従います。`never` ならいつでも横のまま、`always` ならいつでも縦です。Collapse しているあいだも、Timeline はスクロールコンテナのままです。

## Variants and Status

Variant は Item の重み、Status は今との関係を表します。

| 値          | HTML                       | React                 | 意味                                                                                |
| ----------- | -------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `compact`   | `data-variant="compact"`   | `variant="compact"`   | 小さい Item。Card の枠・背景・影・Arrow を消し、Marker を小さくし、間隔を詰めます。 |
| `milestone` | `data-variant="milestone"` | `variant="milestone"` | 大事な Item。Marker を大きくし、Card の枠をアクセントの色にします。                 |

| 値         | HTML                     | React               | 意味                                                 |
| ---------- | ------------------------ | ------------------- | ---------------------------------------------------- |
| `done`     | `data-status="done"`     | `status="done"`     | 完了。既定の見た目は変わりません。                   |
| `current`  | `data-status="current"`  | `status="current"`  | 今。Marker にアクセントの色の輪がもう 1 つ付きます。 |
| `upcoming` | `data-status="upcoming"` | `status="upcoming"` | これから。Segment が点線になります。                 |

Variant の無い Item は普通の Item、Status の無い Item は Status なしです。

```html
<li class="toki-item" data-variant="milestone" data-status="current">…</li>
```

```tsx
<TimelineItem variant="milestone" status="current">
  …
</TimelineItem>
```

縦・横・Flow のどれでも使えます。Flow では、`upcoming` の Status が自分の Lane の線を点線にします。大きさと輪は `--toki-compact-marker-size`・`--toki-compact-gap`・`--toki-milestone-marker-size`・`--toki-milestone-card-border`・`--toki-current-ring-color` で変えられます ([Theming](#theming))。

Status は見た目だけで伝わります。tokiline は読み上げの文言を足さないので、Card か Meta に言葉を書いてください。

## Presets

Preset は、名前で選ぶ見た目のことです。Preset ごとに別の CSS ファイルとして配るので、使うものだけを読み込みます。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/presets-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/presets-light.png" alt="同じ 3 つの Item を 3 つの Preset で並べたもの。黄色に光る hotaru、done が青緑の実線で upcoming が破線の kawa、金色で current の Card に枠がある kinen。" width="944" />
</picture>

```js
import "tokiline/style.css"
import "tokiline/presets/hotaru.css"
```

そのうえで、Timeline に `data-preset` を付けます。その属性が付いた Timeline だけが変わるので、1 つのページで Preset を使い分けられます。

```html
<ol class="toki-timeline" data-preset="hotaru">
  …
</ol>
```

```tsx
<Timeline preset="hotaru">…</Timeline>
```

| Preset   | 見た目                                                                                                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hotaru` | 暗いページのための、蛍のような発光。光の帯が Line をゆっくり流れ、`current` の Marker が呼吸するように光り、ときどき波紋が広がります。                                                                                                                                       |
| `kawa`   | ロードマップや変更履歴のための、青磁から水色。`done` の Segment はアクセントの実線、`upcoming` の Segment は流れる点線になります。スクロール連動アニメーションに対応したブラウザでは、`done` の Segment が読んだところまで伸び、対応していなければ最初から全体が塗られます。 |
| `kinen`  | リリースや記念日のための、アイボリーと金色。`current` の Card の縁を光が一周し、`current` の Meta に光が走り、Card はホバーとフォーカスで浮きます。                                                                                                                          |

色を変えるときは、Timeline (またはその祖先) に `--toki-accent` を指定します。ほかの色はそのアクセントと `currentColor`・`Canvas` から作るので、Preset はライトとダークの両方のページに合います。Preset の規則は `@layer tokiline` の下位層の `@layer tokiline.preset` に入っているので、自分の CSS が `!important` なしで勝ちます。

動きはすべて `prefers-reduced-motion: no-preference` の中だけにあります。視差効果を減らす設定のときは止まります。`@property` とスクロール連動アニメーションは強化扱いです。対応していないブラウザでは止まった見た目になり、最初の状態で中身が隠れることもありません。

Preset は縦・横・Flow のどれでも使えます。Flow と一緒に使うと、Lane の線と Fork・Join の曲がり線はそのまま残ります。

## Flow

Flow は、Item が複数の Lane に分かれて走る Timeline です。並びは 1 本のリストのままで、各 Item はちょうど 1 つの Lane に乗り、Lane は Fork (分かれる) と Join (合わさる) をします。`flowAttributes()` が、`lane`・`fork`・`join` の名前から列の番号と各行の線を計算します。

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/flow-horizontal-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/flow-horizontal-light.png" alt="横向きの Flow。青い main の Lane が上を横に走り、緑の feature の Lane が 2 月に下へ Fork して 4 月に Join し、main の Lane は Launch で終わる。" width="944" />
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/flow-dark.png" />
  <img src="https://raw.githubusercontent.com/reeschan/tokiline/main/docs/images/flow-light.png" alt="青・緑・橙の 3 本の Lane がある縦の Flow。web と mobile の Lane が main の Lane から Fork し、順に Join して、main の Lane は Launch で終わる。" width="688" />
</picture>

```ts
import { flowAttributes } from "tokiline"

const layout = flowAttributes([{ lane: "main" }, { lane: "feature", fork: "main" }, { lane: "feature", join: "main" }, { lane: "main" }])

// layout.timeline
// { "data-flow": "2" }
// layout.items[1]
// { "data-lane": "feature", "data-flow-col": "2", "data-flow-through": "1", "data-flow-fork": "1", "data-flow-cap": "start" }
```

`flowAttributes()` は、時間の順に並べた Item ごとのオブジェクトを受け取ります。

| 項目   | 意味                                                                |
| ------ | ------------------------------------------------------------------- |
| `lane` | その Item が乗る Lane の名前。                                      |
| `fork` | その Item の Lane がここから分かれて始まるとき、分かれる元の Lane。 |
| `join` | その Item の後に、その Lane が合わさる先の Lane。                   |

最初の Lane は `fork` なしで始まり、ほかの Lane は Fork から始まります。Lane は、その Lane を参照する最後の行まで走ります。参照は、その Lane の Item、その Lane から Fork する Item、その Lane へ Join する Item です。その後、列は空いて、次の Fork が再利用します。`end` は、Lane の最後の Item が最後の参照でもあり、Join しないときだけ付きます。

`flowAttributes()` は `{ timeline, items }` を返します。Timeline に付ける属性 1 つと、Item ごとの属性の配列です。どちらも `data-*` だけで、style の変数は含みません。Flow にならない Item を渡すと `FlowError` を投げます。

- Join した Lane に、また Item を置いた。
- 走っていない Lane から Fork した。
- 走っていない Lane へ Join した。
- すでに走っている Lane の Item に `fork` を書いた。
- 根の Lane があるのに、`fork` なしで別の Lane を始めた。
- 自分の Lane へ Join した。
- `lane`・`fork`・`join` の名前に空文字を書いた。
- 同時に 5 本以上の Lane が走った。

### With React

`layout.timeline` を `Timeline` に、`layout.items[i]` を対応する `TimelineItem` に渡すと、属性が要素に展開されます。

```tsx
const layout = flowAttributes(items)

<Timeline flow={layout.timeline}>
  {items.map((item, index) => (
    <TimelineItem key={`${item.lane}-${index}`} flow={layout.items[index]}>
      …
    </TimelineItem>
  ))}
</Timeline>
```

### With HTML

`flowAttributes()` を使わず、属性を手で書くこともできます。

| 属性                                       | 付ける場所 | 意味                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-flow="<n>"`                          | Timeline   | 同時に走る Lane の本数の最大 (`1`〜`4`)。Lane の列の帯の幅は `n` × `--toki-lane-gap` です。                                                                                                                                                                                                                                                                                      |
| `data-lane="<名前>"`                       | Item       | Lane の名前。自分のスタイル用のフックで、描画には使いません。                                                                                                                                                                                                                                                                                                                    |
| `data-flow-col="<k>"`                      | Item       | その Item の Lane の列 (`1`〜`4`)。Marker はこの列に置かれます。                                                                                                                                                                                                                                                                                                                 |
| `data-flow-through="<k>…"`                 | Item       | その行を上端から下端まで通る、ほかの Lane の列。空白区切りです。無ければ付けません。CSS では `[data-flow-through~="2"]` で 1 つの列を選べます。                                                                                                                                                                                                                                  |
| `data-flow-fork="<j>"`                     | Item       | この行で、列 `j` の Lane から新しい Lane が分かれます。行の上端の列 `j` から Marker へ曲がる線を描きます。                                                                                                                                                                                                                                                                       |
| `data-flow-join="<j>"`                     | Item       | この Item の後で、その Lane が列 `j` の Lane へ合わさります。Marker から、行の下端の列 `j` へ曲がる線を描きます。                                                                                                                                                                                                                                                                |
| `data-flow-cap="start" \| "end" \| "both"` | Item       | その Lane の線が Marker のところでどこから始まり、どこで終わるか。`start` は Marker から始まる (根の Lane の最初の Item、または Fork。Fork には必ず `start` が付きます)。`end` は Marker で終わる (Lane の最後の Item が最後の参照でもあり、Join しないとき)。`both` は 1 つの Item で Lane 全体が始まり、終わります。Join には `end` が付きません。曲がる線が下へ続くためです。 |

```html
<ol class="toki-timeline" data-flow="2">
  <li class="toki-item" data-lane="main" data-flow-col="1" data-flow-cap="start">…</li>
  <li class="toki-item" data-lane="feature" data-flow-col="2" data-flow-through="1" data-flow-fork="1" data-flow-cap="start">…</li>
  <li class="toki-item" data-lane="feature" data-flow-col="2" data-flow-through="1" data-flow-join="1">…</li>
  <li class="toki-item" data-lane="main" data-flow-col="1" data-flow-cap="end">…</li>
</ol>
```

### Lane の色

`--toki-lane-gap` は Lane の列 1 本の幅 (既定 `3rem`) です。`--toki-lane-1-color` から `--toki-lane-4-color` で列ごとの色を決めます。指定しなければ、すべての Lane が `--toki-line-color` を使います。Marker の背景は `--toki-marker-bg`、自分の列の色、Marker の既定、の順に決まります。

```css
.toki-timeline {
  --toki-lane-gap: 3rem;
  --toki-lane-1-color: royalblue;
  --toki-lane-2-color: seagreen;
}
```

### 配置と向き

Flow の Side は、Timeline に `data-side="start"` を指定しなければ `end` です。`alternate` は `end` として描くので、Flow が交互に並ぶことはありません。横向きの Timeline でも Flow を使えます。Lane の列は block 方向に並び、Timeline が Collapse しているあいだは縦の Flow として描かれます。Side も Lane の順も論理方向なので、右から左に書く言語でも成り立ちます。Card の中に入れ子にした Flow は、外の Item の値を継承せず、自分の属性から始まります。

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

Reveal は CSS のスクロール連動アニメーションで動きます。対応していないブラウザ (2026-10 時点の Firefox) と、「視差効果を減らす」設定のときは、アニメーションせず、すべての Item が普通に表示されます。横向きの Timeline では、Reveal は Timeline 自身の横スクロールに合わせて動きます。横向きの Timeline が Collapse して Item が縦に並んでいるあいだは、Reveal は動きません。Timeline がスクロールコンテナのままで、`view()` が追う先が無いためです。中身は動かない状態で見えています。

## Theming

見た目の調整はすべて `--toki-*` の CSS 変数で行います。tokiline は各変数を `var(--toki-name, 既定値)` の形で読むので、祖先 (`:root` など)・Timeline・Item のどこで指定しても効きます。Item に指定した値は、その Item にだけ効きます。既定値は `currentColor` とシステムカラーの `Canvas` だけを使うので、ページの文字色と `color-scheme` に従います。

| 変数                           | 意味                                      | 既定値                                                         |
| ------------------------------ | ----------------------------------------- | -------------------------------------------------------------- |
| `--toki-accent`                | Marker の背景のもとになる色               | `currentColor`                                                 |
| `--toki-gap`                   | Item どうしの間隔                         | `2rem`                                                         |
| `--toki-compact-gap`           | `compact` の Item の後の間隔              | `1rem`                                                         |
| `--toki-gutter`                | Line と Card の間隔                       | `1rem`                                                         |
| `--toki-item-size`             | 横向きの Timeline の Item 1 つの幅        | `16rem`                                                        |
| `--toki-lane-1-color`          | Flow の Lane の列 1 の色                  | `--toki-line-color`                                            |
| `--toki-lane-2-color`          | Flow の Lane の列 2 の色                  | `--toki-line-color`                                            |
| `--toki-lane-3-color`          | Flow の Lane の列 3 の色                  | `--toki-line-color`                                            |
| `--toki-lane-4-color`          | Flow の Lane の列 4 の色                  | `--toki-line-color`                                            |
| `--toki-lane-gap`              | Flow の Lane の列 1 本の幅                | `3rem`                                                         |
| `--toki-line-color`            | Line の色                                 | `color-mix(in oklab, currentColor 25%, transparent)`           |
| `--toki-line-width`            | Line の太さ (`0` で消える)                | `2px`                                                          |
| `--toki-line-style`            | Line の線種 (`solid`・`dashed`・`dotted`) | `solid`                                                        |
| `--toki-marker-size`           | Marker の大きさ (`0` で消える)            | `2.5rem`                                                       |
| `--toki-compact-marker-size`   | `compact` の Item の Marker の大きさ      | `1rem`                                                         |
| `--toki-milestone-marker-size` | `milestone` の Item の Marker の大きさ    | `3.5rem`                                                       |
| `--toki-marker-bg`             | Marker の背景                             | `--toki-accent` の値                                           |
| `--toki-marker-fg`             | Marker の中身の色                         | `Canvas`                                                       |
| `--toki-marker-ring-width`     | Marker のまわりの輪の太さ                 | `0.25rem`                                                      |
| `--toki-marker-ring-color`     | Marker のまわりの輪の色                   | `Canvas`                                                       |
| `--toki-current-ring-color`    | `current` の Item の Marker に足す輪の色  | `var(--toki-accent, currentColor)`                             |
| `--toki-card-bg`               | Card の背景 (Arrow も同じ色になる)        | `color-mix(in oklab, currentColor 6%, Canvas)`                 |
| `--toki-card-fg`               | Card の文字色                             | `currentColor`                                                 |
| `--toki-card-border`           | Card の枠線                               | `1px solid color-mix(in oklab, currentColor 15%, transparent)` |
| `--toki-milestone-card-border` | `milestone` の Item の Card の枠線        | `2px solid var(--toki-accent, currentColor)`                   |
| `--toki-card-radius`           | Card の角の丸み                           | `0.5rem`                                                       |
| `--toki-card-padding`          | Card の内側の余白                         | `1rem`                                                         |
| `--toki-card-shadow`           | Card の影                                 | `0 1px 2px color-mix(in oklab, currentColor 12%, transparent)` |
| `--toki-arrow-size`            | Arrow の大きさ (`0` で消える)             | `0.5rem`                                                       |
| `--toki-meta-fg`               | Meta の文字色                             | `color-mix(in oklab, currentColor 70%, transparent)`           |

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

`tokiline` パッケージは、各部品の `class` と `data-*` の属性を返すヘルパを出しています。`timelineAttributes`・`itemAttributes`・`markerAttributes`・`cardAttributes`・`metaAttributes` と、Flow の `flowAttributes` です。Vue や Svelte などの部品を作るときに使います。

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

型の `Side`・`TimelineSide`・`Collapse`・`Reveal`・`Orientation`・`Variant`・`Status`・`Preset`・`TimelineOptions`・`ItemOptions`・`PartAttributes`・`FlowItem`・`FlowColumn`・`FlowCap`・`FlowLayout`・`FlowTimelineAttributes`・`FlowItemAttributes` も出しています。`FlowError` は `flowAttributes()` が投げるエラーです。

## Browser support

tokiline は、Baseline の「広く利用可能」な CSS の機能だけを使います。例外は 2 つで、どちらもあれば使うおまけとして扱います。Reveal と Preset の一部はスクロール連動アニメーションを使い、`kinen` は Card を回る光のために `@property` を使います。対応していなくても、Reveal は動かず、Preset は止まった見た目のままで、内容と配置は崩れません。

Timeline はコンテナ (`container-type: inline-size`) なので、横幅を中身から決められません。横幅が中身から決まる場所 (幅の指定の無い flex の子など) では、Timeline に幅を指定してください。

## Accessibility

- Timeline には `ol`、Item には `li` を使います。
- 日付は `<time>` に入れます。
- Marker は、自動では読み上げから外れません。飾りだけのアイコンには `aria-hidden="true"` を付けてください。
- Status は見た目だけで伝わります。tokiline は読み上げの文言を足さないので、Card か Meta に言葉を書いてください。
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
