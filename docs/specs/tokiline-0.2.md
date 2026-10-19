# tokiline 0.2

## Problem Statement

tokiline 0.1 は縦の Orientation しか出しておらず、横に並ぶ年表やロードマップを作れない。ADR-0002 で横向きを足せるように名前と用語を用意したが、中身はまだ無い。

また、0.1 の Timeline は 1 本の Line に Item を並べるだけなので、並行して進む流れ (複数のプロジェクト、git のブランチ、分かれて合わさる計画) を表せない。Svelte Flow のようなノードの図に近い柔軟さが欲しいが、tokiline の強みである「JS なしでサーバーで描け、最初の表示から崩れない」(ADR-0001) は失いたくない。

さらに、既定の見た目は意図して淡白にしてあるため、変更履歴やリリースの告知のように「目を引きたい」場面で、利用者が自分で一から動きを作る必要がある。出来事が完了したか、今か、これからか、を表す手段も無い。

## Solution

0.2 では、今の利用者を壊さずに次の 4 つを足す。

- **横向きの Orientation**: Timeline に `data-orientation="horizontal"` を付けると、Line が横に走る。Item は決まった幅で並び、Timeline 自身が横スクロールして Item の位置に止まる。狭い画面では Collapse で縦になる。
- **Flow**: Item に Lane を持たせ、Lane が Fork (分かれる) と Join (合わさる) をする静的な図を描く。どの行をどの Lane が通るかは、TS の純粋な関数 `flowAttributes()` がデータから計算する。JS は実行時に要らず、Server Component のまま描ける (ADR-0003)。
- **Variant と Status**: Item の重み (`compact` / `milestone`) と、今との関係 (`done` / `current` / `upcoming`) を契約に足す。
- **Preset**: 名前で選べる、動きのある見た目を 3 つ (`hotaru` / `kawa` / `kinen`)、別の CSS ファイルとして配る。どれも Web の作例から着想を得たオリジナルで、1 つの色相から色を作るので、ライトとダークの両方に合う (ADR-0004)。

## User Stories

1. Web 制作者として、Timeline に属性を 1 つ足すだけで横向きにしたい。HTML を書き直さずに年表を作るためだ。
2. Web 制作者として、横向きの Timeline が Item の数に応じて横スクロールしてほしい。Item がいくつあっても崩れないようにするためだ。
3. 閲覧者として、横スクロールが Item の位置で止まってほしい。Item が半分に切れた状態で止まらないようにするためだ。
4. 閲覧者として、キーボードでも横向きの Timeline をスクロールしたい。マウスやタッチが使えなくても読めるようにするためだ。
5. Web 制作者として、横向きの Item の幅を CSS 変数で変えたい。Card の中身の量に合わせるためだ。
6. Web 制作者として、横向きでも Side (`start` = 上、`end` = 下) と Alternate (上下に交互) を使いたい。縦と同じ考え方で配置を決めるためだ。
7. 閲覧者として、横向きの Meta (日付) が Line をはさんで Card の反対側に、Marker にそろって並んでほしい。年表として日付を目で追いやすくするためだ。
8. 閲覧者として、狭い画面では横向きの Timeline が縦になってほしい。スマートフォンで横スクロールせずに読めるようにするためだ。
9. Web 制作者として、横向きが縦になる幅を、縦の Alternate と同じ `data-collapse` の段階で選びたい。覚える属性を増やさないためだ。
10. Web 制作者として、`data-collapse="never"` で、横向きをいつでも横のままにしたい。狭い場所でも横スクロールの年表として見せるためだ。
11. 右から左に書く言語の閲覧者として、横向きの Timeline も右から左に進んでほしい。読む向きと時間の向きをそろえるためだ。
12. 閲覧者として、横向きでも Reveal が、Timeline の横スクロールに合わせて Item を出してほしい。縦と同じ演出を横でも見るためだ。
13. 閲覧者として、横向きの Reveal では、Card が自分の Side の側 (上か下) から出てきてほしい。Line から離れる向きの動きにするためだ。
14. React 利用者として、`<Timeline orientation="horizontal">` で横向きにしたい。props だけで向きを選ぶためだ。
15. 0.1 の利用者として、0.2 に上げても何も変わらないでほしい。何もしなくても今の見た目を保つためだ。
16. Web 制作者として、細かな出来事の Item を `compact` にして、Card の枠を消して詰めて並べたい。大事な出来事と小さな出来事に差を付けるためだ。
17. Web 制作者として、節目の Item を `milestone` にして、大きな Marker と強調した Card で見せたい。節目をひと目で分かるようにするためだ。
18. Web 制作者として、Variant を縦・横・Flow のどれでも使いたい。向きや形を変えても重みの付け方を変えずに済ませるためだ。
19. Web 制作者として、Item に Status (`done` / `current` / `upcoming`) を付けたい。ロードマップのように、どこまで進んだかを示すためだ。
20. 閲覧者として、`upcoming` の Item の Segment が、Preset なしでも点線で見えてほしい。まだ起きていないことを、色に頼らずに見分けるためだ。
21. 支援技術の利用者として、Status が見た目だけで伝わるのでなく、利用者が書いた文言で伝わってほしい。tokiline が勝手に読み上げの文言を足さないことで、利用者が言葉を選べるようにするためだ。
22. Web 制作者として、Item を Lane に乗せて、並行する流れを 1 つの Timeline に描きたい。複数のプロジェクトやブランチの経緯を 1 枚で見せるためだ。
23. Web 制作者として、ある時点で新しい Lane が既存の Lane から分かれる (Fork) ことを描きたい。派生した流れの始まりを示すためだ。
24. Web 制作者として、ある Lane が別の Lane に合わさって終わる (Join) ことを描きたい。流れが合流したことを示すためだ。
25. Web 制作者として、Lane の名前 (`"main"` など) と Fork・Join だけを書いたデータから、配置を自動で計算してほしい。列の番号や線の通り方を手で考えずに済ませるためだ。
26. Web 制作者として、終わった Lane の列が、次に始まる Lane で再利用されてほしい。図が無駄に横へ広がらないようにするためだ。
27. Web 制作者として、矛盾したデータ (Join した Lane にまた Item を置く、存在しない Lane から Fork する、同時に 4 本を超える) を渡したら、分かりやすい例外を受け取りたい。壊れた図を本番に出さないためだ。
28. 閲覧者として、Flow の Card が、どの Lane の Item でも 1 本の列にそろって並んでほしい。Lane が増えても本文を読みやすくするためだ。
29. 閲覧者として、Flow の Marker が自分の Lane の線の上にあってほしい。どの流れの出来事かを見分けるためだ。
30. Web 制作者として、Lane ごとに線の色を変えたい。流れを色で区別するためだ。
31. Web 制作者として、Lane の色を指定しなければ、すべての Lane が今の Line の色になってほしい。何も設定しなくても成り立つようにするためだ。
32. Web 制作者として、Flow を縦でも横でも使いたい。年表の向きと流れの図を両立させるためだ。
33. Web 制作者として、Flow に Alternate を指定しても壊れず、`end` として描いてほしい。設定を間違えても図が崩れないようにするためだ。
34. Web 制作者として、`flowAttributes()` の結果と同じ属性を手で書けば、素の HTML でも Flow を描きたい。React や JS のビルドが無いサイトでも使うためだ。
35. Astro や Vue の利用者として、`flowAttributes()` をビルド時やサーバーで呼び、その結果を自分のテンプレートに流し込みたい。React 以外からも Flow を使うためだ。
36. React 利用者として、`flowAttributes()` の結果を `<Timeline flow>` と `<TimelineItem flow>` に渡すだけで Flow を描きたい。属性を自分で展開せずに済ませるためだ。
37. Next.js の App Router の利用者として、Flow を Server Component のまま描きたい。クライアントの JS を増やさないためだ。
38. Web 制作者として、Preset の CSS ファイルを読み込み、Timeline に `data-preset` を付けるだけで、動きのある見た目にしたい。一から動きを作らずに済ませるためだ。
39. Web 制作者として、使う Preset のファイルだけを読み込みたい。使わない CSS をページに載せないためだ。
40. Web 制作者として、1 つのページで、Timeline ごとに違う Preset を使いたい。セクションごとに雰囲気を変えるためだ。
41. Web 制作者として、Preset のファイルを読み込んでも、`data-preset` を付けていない Timeline は変わらないでほしい。意図しない Timeline に効かないようにするためだ。
42. Web 制作者として、Preset の上から `--toki-*` 変数や自分のクラスで、`!important` なしに上書きしたい。Preset を出発点にして調整するためだ。
43. Web 制作者として、Preset がライトとダークの両方に、何も設定せずに合ってほしい。ページの配色の切り替えに追いつかせるためだ。
44. Web 制作者として、Preset のアクセント色を 1 つの変数で変えたい。ブランドの色に合わせるためだ。
45. 閲覧者として、`hotaru` では、Line を光の粒がゆっくり流れ、`current` の Marker が呼吸するように光ってほしい。今がどこかを、静かに目立たせるためだ。
46. 閲覧者として、`kawa` では、`done` の区間は塗りつぶした線、`upcoming` の区間は流れる点線で見えてほしい。ロードマップの進み具合を読み取るためだ。
47. 閲覧者として、`kawa` を対応するブラウザで見るときは、読んだところまで Line が伸びてほしい。読み進めた手応えを得るためだ。
48. 閲覧者として、`kinen` では、`current` の Card の縁を光が一周し、Meta の日付に光が走ってほしい。リリースや節目を祝う雰囲気を出すためだ。
49. 閲覧者として、`kinen` の Card が、ホバーやキーボードでのフォーカスで浮いてほしい。どの Card を見ているかを分かりやすくするためだ。
50. 動きに弱い閲覧者として、視差効果を減らす設定にしたら、Preset の動きがすべて止まってほしい。気分が悪くならないようにするためだ。
51. 古いブラウザや Firefox の閲覧者として、新しめの CSS に対応していなくても、Preset の止まった見た目で内容が読めてほしい。ブラウザによって読めなくならないようにするためだ。
52. 閲覧者として、いつまでも動き続ける演出が、限られた Item だけにあってほしい。画面がうるさくならず、端末が重くならないようにするためだ。
53. React 利用者として、`<Timeline preset="hotaru">` で Preset を選びたい。props だけで見た目を選ぶためだ。
54. TS の利用者として、Orientation・Variant・Status・Preset・Flow の型を受け取りたい。値の書き間違いを型で防ぐためだ。
55. 利用を検討する人として、デモサイトで横向き・Flow・各 Preset の見本を、ライトとダークで見たい。導入する前に見た目を確かめるためだ。
56. 将来の保守者として、Flow を静的にした理由と、Preset を別ファイルにした理由を ADR で読みたい。対話的なキャンバスを足すときに、前提を誤解しないためだ。

## Implementation Decisions

### 互換性と版

- 追加するのは、すべて既定値が「今と同じ」になる属性と変数だけにする。0.1 の HTML は 0.2 でも同じ見た目になる。changeset で minor (0.2.0) として出す。
- 新しく足す `data-*` の値、`--toki-*` 変数、Preset のファイル名と名前、export は、すべて公開 API になる。

### 横向きの Orientation

- Timeline の `data-orientation` を足す。値は `vertical` と `horizontal`。指定が無ければ縦とし、ヘルパは既定値の `vertical` を属性に出さない。
- 横向きの Side: `start` は Line の上、`end` は下。block 方向の論理で決めるので、書字方向が右から左なら、時間は右から左へ進む。
- 横向きの Item の中: Marker は Line の上。Card は Side の側に置く。Meta は Line をはさんで Card の反対側に置き、Marker にそろえる。Alternate では Item ごとに上下を入れ替え、Meta はいつも Card の反対側に来る。Arrow は Line の方を向く (上か下)。
- Item の幅は `--toki-item-size` で決める (既定は `16rem`)。Item どうしの間隔には、今の `--toki-gap` を inline 方向に使う。
- 横向きの Timeline は、自身が inline 方向のスクロールコンテナになる。Item の先頭に scroll-snap で止まる。キーボードでのスクロールは、ブラウザの「スクロールコンテナにフォーカスできる」動作に任せ、tokiline は `tabindex` を足さない。
- Segment は、Item の inline 方向の全幅にわたり、Marker の中心を通る。
- Collapse: 横向きの Timeline は、`data-collapse` の閾値 (`sm` / `md` / `lg`) より狭いと縦になる。縦になったあとは縦の決まりに従う (Alternate なら全部 `end`)。`never` ならいつでも横、`always` ならいつでも縦。閾値は、今と同じく Timeline 自身の inline 方向の大きさで判断する。
- Reveal: 横向きでは、Timeline 自身の inline 方向のスクロールを timeline にする。Card と Meta は、自分の Side の側から block 方向に入ってくる。対応しないブラウザや、視差効果を減らす設定のときは、今と同じく動かない。 横向きの Timeline が Collapse して縦に並んでいるあいだも、Timeline はスクロールコンテナのまま (container の toki が Timeline 自身にあり、自分の overflow を container query で切り替えられないため) なので、`view()` が働かず Reveal は動かない。中身は動かない状態で見えている。

### Variant

- Item の `data-variant` を足す。値は `compact` と `milestone`。指定が無ければ普通の Item。
- `compact`: Card の枠・背景・影・Arrow を消し、Marker を小さくし、文字だけを並べる。Item の間隔も詰める。
- `milestone`: Marker を大きくし、Card を強調する (アクセントの色を使った縁など)。
- 大きさや強調の具合は、Variant 用の `--toki-*` 変数で上書きできるようにする (名前は実装時に、今の変数の命名に合わせて決める)。

### Status

- Item の `data-status` を足す。値は `done`・`current`・`upcoming`。指定が無ければ Status は無い。
- 既定の見た目では、`upcoming` の Item の Segment を点線 (`--toki-line-style` の既定を `dashed` に変える) にし、`current` の Marker にアクセントの輪を足す程度にとどめる。`done` は既定の見た目では変えない。
- tokiline は Status を読み上げの文言にしない。必要なら利用者が Card や Meta に書く。

### Flow

- Flow は、Item を時間の順に並べた 1 本のリストのまま描く。Item はそれぞれちょうど 1 つの Lane に乗る。
- Lane の線を細い帯にまとめて並べ (1 本ぶんの幅は `--toki-lane-gap`)、Card はどの Lane の Item でも、その帯の外側にある 1 本の列に置く。Item の Marker は自分の Lane の位置に来る。Lane は、Line と直交する方向に並ぶ (縦なら inline 方向、横なら block 方向)。
- Flow の Side は `start` か `end`。Alternate を指定しても `end` として描く。
- 同時に並ぶ Lane は最大 4 本。各行で、どの列を Lane が通っているか、その行で Fork か Join が起きるかを、`data-*` と `--toki-*` で表す。Fork と Join の線は、角を丸めた曲がりとして CSS で描く。
- Lane の色は、指定が無ければ全部 `--toki-line-color`。Timeline に `--toki-lane-1-color` 〜 `--toki-lane-4-color` を付けると、列ごとに色が変わる。Marker の背景も、自分の列の色に従う。
- Flow でも Variant と Status を使える。Status の点線は、その Item の Lane の線に効く。
- `flowAttributes(items)` は TS のコアにある純粋な関数で、DOM に触らない。サーバーでもブラウザでも、ビルド時にも呼べる。入力は Item ごとの次の形 (この型の形は、話し合いで決めたもの)。

  ```ts
  { lane: string; fork?: string; join?: string }
  ```

  - `lane`: その Item が乗る Lane の名前。
  - `fork`: その Item の Lane が、この行で、`fork` に書いた Lane から分かれて始まる。
  - `join`: その Item の後で、その Item の Lane が、`join` に書いた Lane に合わさって終わる。
  - 最初に現れる Lane は、`fork` が無くても始まる (根の Lane)。
  - Lane を何列目に置くかは関数が決め、終わった Lane の列は再利用する。
  - 例外を投げる場合: Join した Lane にまた Item を置く。まだ無い Lane から Fork する、またはまだ無い Lane へ Join する。すでに走っている Lane へ Fork する。同時に 4 本を超える。

- 出力は、Timeline に付ける属性と、Item ごとの属性の配列 (`{ timeline, items }`)。どちらも `data-*` と `--toki-*` (style) からなり、手で書いた HTML と同じものになる。
- 手で HTML を書く人のために、Flow の属性と変数の一覧を README に載せる。

### Preset

- Preset は別の CSS ファイル (`tokiline/presets/<名前>.css`) として配り、package の exports に足す。読み込んだうえで、Timeline に `data-preset="<名前>"` が付いたときだけ効く。中身は `@layer tokiline` の下の層に入れ、利用者の CSS が `!important` なしで勝つようにする。
- Preset が変えるのは `--toki-*` の値と動きだけで、配置は変えない。縦・横・Flow のどれでも成り立つようにし、動きの向きは論理的な軸から決める。
- 色は Preset ごとに 1 つの色相 (アクセント) を持ち、`--toki-accent` で上書きできる。他の色は `currentColor` と `Canvas` から作る。
- 動かすのは `transform` と `opacity` だけにする。発光は、ぼかしを最初から描いた疑似要素の `opacity` で表す。いつまでも動き続ける演出は、`current` の Item など限られた Item にだけ付ける。
- `prefers-reduced-motion: reduce` のときは、すべての動きを止める (動きは `no-preference` の中でだけ足す)。
- widely available でない機能 (`@property`、スクロール連動アニメーション) は強化扱いにする。対応しないブラウザでは、止まった見た目で成り立つ。最初の状態で中身を隠さない。
- 0.2 で出す Preset:
  - **`hotaru`**: Line をゆっくり流れる光の粒、`current` の Marker の呼吸、ときどき出る波紋。暗い背景に映える発光の雰囲気。
  - **`kawa`**: `done` の区間は塗りつぶした線、`upcoming` の区間は流れる点線。対応するブラウザでは、読んだところまで Line が伸びる (対応しなければ全部塗った状態)。ロードマップや変更履歴に向く。
  - **`kinen`**: `current` の Card の縁を光が一周し (`@property` が無ければ止まった縁)、Meta の日付に光が走る。Card はホバーとフォーカスで浮く。リリースの告知に向く。
- どれも Web の作例 (Aceternity・Magic UI・web.dev などの動きの型) を下調べしたうえでのオリジナルで、コードは写さない。

### TS のコア (`tokiline`)

- 型を足す: `Orientation`、`Variant`、`Status`、`Preset`、Flow の入力と出力の型。
- `TimelineOptions` に `orientation` と `preset` を足す。`ItemOptions` に `variant` と `status` を足す。ヘルパは今と同じく、既定値と、サポートしない値を属性に出さない。
- `flowAttributes()` を export する。

### React 版 (`tokiline/react`)

- `Timeline` に `orientation`・`preset`・`flow` を足す。`TimelineItem` に `variant`・`status`・`flow` を足す。`flow` には `flowAttributes()` の結果 (`timeline` と `items[i]`) を渡し、`data-*` と `style` の `--toki-*` に展開する。利用者の `style` とは混ぜ、利用者の値が勝つ。
- hook・context・`"use client"`・`forwardRef` は今までどおり使わない。

### ドキュメントとデモ

- 用語集 (CONTEXT.md) に Orientation の使い方、Collapse の広げた定義、Variant・Status・Flow・Lane・Fork・Join・Preset が入っている。README とテストもこの用語を使う。
- ADR-0003 (Flow を静的にする) と ADR-0004 (Preset を別ファイルにする) を足した。
- デモサイトに、横向き・Flow・Variant と Status・各 Preset の見本ページを足す。README (英語と日本語) に使い方と画像を足し、アーキテクチャ図に Preset のファイルと `flowAttributes()` を足す。

## Testing Decisions

**良いテストの条件**: 0.1 と同じく、外から観察できる振る舞いだけを確かめる。利用者に見える HTML (クラス名・data 属性・style の変数) と、ブラウザでの見た目と、`flowAttributes()` の入出力。CSS の規則の書き方や、内部の `--_toki-*` 変数は確かめない。

**合意済みの seam** (0.1 と同じ 4 つ。新しい seam は作らない。下流の実装 (tdd) はここでテストを書く):

1. **TS のヘルパと `flowAttributes()`** (Vitest): 新しい options が正しい `data-*` を返すこと、既定値と不正な値を出さないこと。`flowAttributes()` では、根の Lane、Fork、Join、列の再利用、Lane が通る列の表し方、出力が手で書く HTML の決まりと一致すること、例外を投げる各場合 (Join 後の Item、無い Lane からの Fork と無い Lane への Join、走っている Lane への Fork、4 本を超える) を確かめる。
2. **React の部品が出す HTML** (React 18 と 19): 新しい props が契約どおりの属性になること、`flow` が `data-*` と `style` に展開され、利用者の `style` と混ざること。
3. **CSS の見た目** (Playwright のスクリーンショット比較と axe。Chromium・WebKit・Firefox): React を使わない素の HTML のテスト用ページで、横向き (Side の 3 種、Alternate、Collapse の各段階と `never` / `always`、右から左、スクロールが Item で止まること)、Variant、Status、Flow (縦と横、Fork と Join、列の再利用、Lane の色)、各 Preset (ライトとダーク、視差効果を減らす設定、強化の機能が無いときの止まった見た目) を確かめる。アニメーションは、スクリーンショットを撮るときだけ止める。
4. **Next.js で動くか**: Next.js 16 と 14 の example に、横向き・Flow・Preset を使うページを足し、App Router で Server Component のまま描かれること、Preset の CSS を利用者が自分で読み込む形で動くことを確かめる。

**既存の例**: 0.1 の `test/contract.test.ts` (ヘルパ)、`test/react/` (React 18 と 19 の描画)、`e2e/visual.spec.ts` と `e2e/acceptance.spec.ts` (スクリーンショットと axe)、`examples/check.mjs` (Next.js の確認)。

## Out of Scope

- 対話的なキャンバス (ドラッグ・パン・ズーム・線のつなぎ直し)。後から、同じ契約の上に任意の Client Component として足す (ADR-0003)。
- 任意の 2 つの Item をつなぐ矢印 (依存関係の図)。キャンバスと一緒に後回し。
- 同時に 5 本以上の Lane。
- Flow での Alternate。
- `tsumugi` などの 4 つ目以降の Preset。Item が順に現れる演出は Reveal と重なるので見送った。
- Preset ごとの固定の配色と `light-dark()`。
- JS による「画面に入ったら 1 回だけ」の Reveal (0.1 から引き続き対象外)。
- Status を読み上げの文言にする仕組み。
- Item の幅を中身に合わせて自動で決める横向き。
- 横向きで、Item を等分して幅いっぱいに詰める並べ方。

## Further Notes

- **ブラウザの対応 (2026-10 時点)**: スクロール連動アニメーションは Firefox の正式版で未対応。`@property` は Baseline 2024 の newly available で、widely available になる見込みは 2027 年 1 月ごろ。どちらも強化扱いなので、対応しても tokiline の変更は要らない。
- **横向きの Reveal**: Timeline 自身がスクロールコンテナになるので、`view()` は Timeline の inline 方向の軸で動く。対応するブラウザで、スクロール位置ごとの見た目を確かめる。
- **キーボードでのスクロール**: 今の Chromium と Firefox は、フォーカスできる子を持たないスクロールコンテナにもキーボードのフォーカスを当てる。WebKit の動作は実装時に確かめ、足りなければ README で `tabindex="0"` を付けるよう案内する (tokiline 自身は足さない)。
- **Preset の下調べ**: 参考にした動きの型は、Line を流れる光、Marker の波紋と呼吸、Card の縁を回る光 (`@property` と `conic-gradient`)、流れる点線、読んだところまで伸びる Line、文字を走る光、ホバーで浮く Card。どれも作例のコードは写さず、tokiline の部品と変数に合わせて作り直す。
- **実装の順番**: 横向き → Variant と Status → Preset → Flow。Flow の実装が想定より大きいと分かったら、Flow だけ 0.3 に切り出す。
