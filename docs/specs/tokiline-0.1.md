# tokiline 0.1

## Problem Statement

縦型タイムラインの React 部品 react-vertical-timeline-component (上流: stephane-monnot/react-vertical-timeline、MIT) は、ほぼ保守されていない。利用者 (reeschan) は reeschan/react-vertical-timeline としてフォークしているが、独自のコミットは無く、手を入れられる状態にない。上流には次の問題がある。

- Next.js の App Router や SSR で壊れる。上流で最も議論の多い issue は「Next.js で動かない」(#166・#171、あわせて約 60 コメント) で、初回描画で線が出ない (#160)、ハイドレーションの警告 (#169) も出ている。原因は、描画中に JS から `document` へ CSS 変数を書き込むことと、クライアントでしか動かない IntersectionObserver に頼っていること。
- 見た目を変えにくい。色はインラインスタイルの props で個別に渡す仕組みで、それ以外は `!important` で上書きするしかない。my-portfolio-second の旧版でも、`globals.css` に `!important` の上書きが並んでいた。Tailwind v4 との相性 (#191)、折りたたむ幅を変えたい (#155)、狭い画面でも 2 カラムにしたい (#152・#172)、線の種類を変えたい (#170)、線やアイコンを消したい (#156) といった要望も解決されていない。
- 後から項目を足すとアニメーションが崩れる (#164)。
- React 専用なので、素の HTML・Astro・Vue などからは使えない。

その結果、my-portfolio-second は 2026-09-23 に経歴タイムラインを Tailwind の自前実装へ置き換えた。再利用できるタイムラインの部品が、手元に無い状態になっている。

## Solution

フレームワークに依存しないタイムラインの部品 **tokiline** を新しく作り、npm にスコープなしの OSS (0.x) として公開する。

- 正本は CSS と HTML の決まり。部品はクラス名、種類と状態は data 属性、見た目は `--toki-*` の CSS 変数で表す。素の HTML だけで使える。
- TypeScript のコアは、型と、決まりどおりのクラス名と data 属性を組み立てる小さなヘルパだけを持つ。
- React 版は任意の薄い層で、決まりどおりの HTML を出すだけ。フックも `"use client"` も使わないので、Next.js の App Router では Server Component のまま動き、Pages Router でも動く。React 18.2 以上と 19 に対応する。
- 0.1 は実行時の JS がゼロ。スクロールで現れる Reveal は、CSS のスクロール連動アニメーションで行い、利用者が指定したときだけ有効になる。
- CSS はすべて cascade layer に入れ、利用者の CSS や Tailwind のクラスが `!important` なしで勝つようにする。Alternate の折りたたみは、画面幅ではなくタイムライン自身の幅で決める。左右は論理方向 (start / end) で表し、右から左に書く言語でも反転する。
- 名前と用語は向きに依らないものにし (ADR-0002)、0.1 は縦の Orientation だけを出す。
- 上流 API との互換層は作らず、移行ガイドを書く。LICENSE は MIT で、自分と上流の著作権表示を併記し、README に謝辞を書く。
- 受け入れ条件は、my-portfolio-second の経歴タイムラインの見た目を `!important` なしで再現できること。0.1.0 を公開したあと、my-portfolio-second の自前実装を tokiline で置き換える。

## User Stories

1. Web 制作者として、素の HTML とクラス名だけで縦型タイムラインを組みたい。React を入れなくても使えるようにするためだ。
2. Web 制作者として、1 つの CSS ファイルを読み込むだけで既定の見た目になってほしい。最初の表示までの手間を減らすためだ。
3. React 開発者として、`Timeline`・`TimelineItem`・`TimelineMarker`・`TimelineCard`・`TimelineMeta` の部品を並べて組みたい。HTML の構造と 1 対 1 に対応していて、迷わずに組めるようにするためだ。
4. React 開発者として、どの部品にも `className`・`style`・任意の属性を渡したい。Tailwind のクラスやテスト用の属性をそのまま付けられるようにするためだ。
5. Next.js の App Router の開発者として、`"use client"` を書かずに Server Component からタイムラインを描画したい。クライアントに送る JS を増やさないためだ。
6. Next.js の Pages Router の開発者として、React 18 のままでもタイムラインを使いたい。React を上げずに導入するためだ。
7. Next.js の開発者として、初回描画から線とマーカーが正しく出てほしい。上流で起きていた「線が出ない」「ハイドレーションの警告」を避けるためだ。
8. React 19 の開発者として、部品に `ref` を渡したい。特定の Item へスクロールさせるなどの操作をするためだ。
9. TypeScript の利用者として、`side` などの props に入れられる値を型で縛ってほしい。書き間違いをビルド時に見つけるためだ。
10. TypeScript の利用者として、`style` に `--toki-*` の CSS 変数を書いても型エラーにならないでほしい。Item ごとの調整を型安全に書くためだ。
11. 利用者として、カードを線の両側に交互に並べたい (Alternate)。長い経歴でも左右のバランスよく見せるためだ。
12. 利用者として、カードをすべて線の片側に寄せたい (Side の start / end)。狭い場所や、シンプルな一覧として見せるためだ。
13. 利用者として、Alternate の中で特定の Item だけ Side を指定したい。強調したい出来事を決まった側に出すためだ。
14. 利用者として、タイムラインが置かれた場所の幅が狭いときは、自動で片側に折りたたんでほしい (Collapse)。サイドバーやカードの中に置いても崩れないようにするためだ。
15. 利用者として、折りたたむ幅を何段階かから選びたい。自分のレイアウトに合う所で切り替えるためだ。
16. 利用者として、Alternate を決して折りたたまない指定も、常に折りたたむ指定もしたい。狭い画面でも 2 列を保ちたい場合などに対応するためだ。
17. 利用者として、線の色・太さ・線種 (実線・破線・点線) を CSS 変数で変えたい。サイトのデザインに合わせるためだ。
18. 利用者として、Item ごとに線の区間 (Segment) の色や線種を変えたい。終わった所は実線、これからの所は破線、のように進み具合を見せるためだ。
19. 利用者として、線やマーカーを消したい。カードだけを縦に並べた見た目にも使うためだ。
20. 利用者として、マーカーにアイコンを入れたい。出来事の種類 (仕事・学歴など) をひと目で分かるようにするためだ。
21. 利用者として、中身の無いマーカーも置きたい。タイムラインの始まりや終わりの印に使うためだ。
22. 利用者として、マーカーの中のアイコンが常に真ん中に来てほしい。上流の #173 のようなずれを直す手間をなくすためだ。
23. 利用者として、マーカーの大きさ・背景・文字色・縁取りを CSS 変数で変えたい。上流の shadowSize のような固定の選択肢に縛られないためだ。
24. 利用者として、カードの背景・文字色・角丸・余白・影・枠線を CSS 変数で変えたい。デザインシステムの値をそのまま当てるためだ。
25. 利用者として、カードの矢印 (Arrow) がカードの背景色に自動で合ってほしい。上流のように矢印の色を別に指定する手間をなくすためだ。
26. 利用者として、矢印を消したい。フラットなカードのデザインにも合わせるためだ。
27. 利用者として、日付・期間・「継続中」の印などを、カードの外 (Meta) に置きたい。本文と補足を見分けやすくするためだ。
28. 利用者として、Alternate で幅が広いときは、Meta が線を挟んでカードの反対側に出てほしい。上流と同じ読みやすい配置にするためだ。
29. 利用者として、片側に寄せたときや折りたたんだときは、Meta がカードの上に出てほしい。日付から読み始められるようにするためだ。
30. 利用者として、カードの中にボタンやリンク、ダイアログを開く要素を自由に置きたい。カードを押したときの動きを自分で決めるためだ。
31. 利用者として、スクロールに合わせて Item が現れる演出 (Reveal) を、指定したときだけ有効にしたい。印刷やスクリーンショットで項目が欠けないようにするためだ。
32. OS の「視差効果を減らす」設定を使う人として、Reveal が指定されていても動かないでほしい。動きで気分が悪くならないようにするためだ。
33. Firefox の利用者として、Reveal が動かなくても、すべての Item が最初から普通に見えていてほしい。ブラウザによって内容が欠けないようにするためだ。
34. 利用者として、後から Item を足しても (「もっと見る」など)、何もしなくても Reveal が効いてほしい。上流の #164 のような崩れを避けるためだ。
35. Tailwind v4 の利用者として、Tailwind のクラスで tokiline の見た目を `!important` なしで上書きしたい。普段の書き方のまま調整するためだ。
36. Tailwind v4 と shadcn/ui の利用者として、自分のテーマの変数 (`--border`・`--card`・`--primary` など) を tokiline の変数に対応づける例を README で読みたい。数行でサイトの色に合わせるためだ。
37. ダークモードのあるサイトの運営者として、既定の見た目がライトとダークのどちらでも破綻しないでほしい。テーマごとに色を指定し直す手間をなくすためだ。
38. 右から左に書く言語のサイトの運営者として、`dir="rtl"` を付けるだけで左右が反転してほしい。言語ごとに CSS を書き分けないためだ。
39. スクリーンリーダーの利用者として、タイムラインが順序付きのリストとして読み上げられてほしい。出来事の数と順番が分かるようにするためだ。
40. スクリーンリーダーの利用者として、日付が `<time>` などの意味のある要素で書かれていてほしい。内容を正しく伝えるためだ。
41. キーボードの利用者として、クリックで動く要素はすべてボタンかリンクであってほしい。マウスなしでも操作できるようにするためだ。
42. Vue・Svelte・Astro の開発者として、TS のヘルパを使って、決まりどおりのクラス名と data 属性を出したい。自分のフレームワーク用の部品を簡単に作るためだ。
43. 上流 (react-vertical-timeline-component) からの移行者として、旧 props と新しい書き方の対応表を読みたい。迷わずに乗り換えるためだ。
44. 日本語の利用者として、README の日本語版を読みたい。英語に不慣れでも導入できるようにするためだ。
45. 利用者として、デモのページで各設定の見た目を確かめたい。導入する前に、自分の用途に合うかを判断するためだ。
46. 保守者 (reeschan) として、見た目の変化をスクリーンショットの比較で検出したい。CSS の変更で別の設定の見た目を壊さないためだ。
47. 保守者として、Next.js の App Router と Pages Router、React 18 と 19 で動くことを CI で確かめたい。対応を宣言した範囲を守り続けるためだ。
48. 保守者として、Changesets で変更を記録し、GitHub Actions から provenance 付きで npm に公開したい。リリースを手作業に頼らないためだ。
49. 保守者として、my-portfolio-second の経歴タイムラインの再現ページをテストとして持ち続けたい。「`!important` なしで再現できる」という受け入れ条件を、版を重ねても守るためだ。
50. 保守者として、0.1.0 の公開後に my-portfolio-second の自前実装を tokiline に置き換えたい。自分のサイトで実際に使って、使い勝手を確かめるためだ。
51. 将来の保守者として、横向きの Orientation を、既存の名前を変えずに足したい。0.1 の利用者を壊さずに機能を広げるためだ。
52. 上流の作者と貢献者に対して、出典と謝辞が README と LICENSE に明記されていてほしい。元の仕事に敬意を払うためだ。

## Implementation Decisions

### パッケージと配布

- パッケージ名は `tokiline` (スコープなし)。リポジトリは新規の public リポジトリ `reeschan/tokiline` とし、上流のフォークは使わない。
- 1 つのパッケージにまとめ、サブパスで分ける。本体 (`tokiline`) は型と TS のヘルパ、`tokiline/react` は React の部品、`tokiline/style.css` は CSS。
- ESM だけを出す。型定義を同梱する。実行時の依存は持たない。
- `react` は任意の peerDependency (18.2 以上) にする。React を使わない利用者には入れさせない。`react-dom` は要求しない。
- パッケージの JS は自分の CSS を読み込まない。Next.js の Pages Router は、パッケージの JS が自分の CSS を読み込む形に対応していないため。CSS は利用者が読み込む。
- CSS ファイルだけを副作用ありとして宣言し、JS が tree-shaking されるようにする。

### CSS と HTML の決まり (正本)

**部品とクラス名**: 接頭辞は `toki-`。部品は `toki-timeline` (Timeline)・`toki-item` (Item)・`toki-marker` (Marker)・`toki-card` (Card)・`toki-meta` (Meta) の 5 つ。Arrow は Card の疑似要素で描き、HTML の部品にはしない。推奨する要素は、Timeline が `ol`、Item が `li`。見た目はクラスで当てるので、他の要素でも崩れない。Item の中の並び順は Marker → Meta → Card を推奨する。読み上げの順番がこの順になり、見た目の配置は CSS のグリッドで決めるので、並び順には左右されない。

**data 属性**:

| 付ける部品 | 属性            | 値                                      | 既定                  |
| ---------- | --------------- | --------------------------------------- | --------------------- |
| Timeline   | `data-side`     | `alternate` / `start` / `end`           | `alternate`           |
| Timeline   | `data-collapse` | `sm` / `md` / `lg` / `never` / `always` | `md`                  |
| Timeline   | `data-reveal`   | `scroll`                                | 無し (Reveal は無効)  |
| Item       | `data-side`     | `start` / `end`                         | Timeline の設定に従う |

- `data-collapse` は Alternate のときだけ効く。`sm`・`md`・`lg` は、タイムライン自身の幅が 32rem・48rem・64rem を下回ると折りたたむ (コンテナクエリ)。任意の幅を指定する仕組みは 0.1 では入れない。CSS のコンテナクエリの条件には変数が使えず、変数で切り替えられる仕組み (スタイルクエリなど) はまだ Baseline に入っていないため。
- `data-reveal` は、将来「画面に入ったら 1 回だけ」の JS 方式を `once` として足せるよう、真偽ではなく値で持つ。
- 横向き用の `data-orientation` は 0.1 では用意しない。後から既定値を縦にして足せば、既存の利用者を壊さない。

**CSS 変数 (公開 API)**: 見た目の調整はすべて次の変数で行う。Item に付けた変数は、その Item の Segment・Marker・Card にだけ効く。

| 対象            | 変数                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 全体            | `--toki-accent` (Marker の背景などの既定のもとになる色)、`--toki-gap` (Item どうしの間隔)、`--toki-gutter` (Line と Card の間隔)  |
| Line と Segment | `--toki-line-color`、`--toki-line-width` (0 で消える)、`--toki-line-style` (`solid` / `dashed` / `dotted`)                        |
| Marker          | `--toki-marker-size` (0 で消える)、`--toki-marker-bg`、`--toki-marker-fg`、`--toki-marker-ring-width`、`--toki-marker-ring-color` |
| Card            | `--toki-card-bg`、`--toki-card-fg`、`--toki-card-border`、`--toki-card-radius`、`--toki-card-padding`、`--toki-card-shadow`       |
| Arrow           | `--toki-arrow-size` (0 で消える。色は `--toki-card-bg` に合わせる)                                                                |
| Meta            | `--toki-meta-fg`                                                                                                                  |

変数の名前と意味は公開 API として扱い、変える場合は破壊的変更として記録する。

**配置**:

- Side は論理方向で表す。縦の Orientation では、start が書字方向の始まりの側 (左から右なら左)、end が終わりの側になる。
- Alternate では、Side を指定していない Item が、1 つ目から start・end・start… と交互に並ぶ。
- Collapse すると、すべての Card が end の側に移り、Line は start の側の端に寄る。
- Meta は、幅の広い Alternate では、Line を挟んで Card の反対側に、Marker の高さに合わせて置く。start / end の指定時や Collapse した状態では、Card のすぐ上 (同じ側) に置く。
- Marker は、Item の先頭の行 (Meta があれば Meta、無ければ Card の上端) の高さに合わせる。

**Line と Segment**: 線は Timeline 全体で 1 本描かずに、各 Item が自分の Segment を描く。Segment は、その Item の先頭から次の Item の先頭まで (Item どうしの間隔を含む) を受け持つ。最後の Item の Segment は、その Item の終わりで止める。

**Marker**: 中身 (アイコンなど) は、縦横とも Marker の中央に置く。中身が無いときは、ただの丸として描く。Marker は自動では `aria-hidden` にしない。アイコンが意味を持つ場合があるため、飾りのアイコンを読み上げから外すかどうかは利用者が決める。

**Card と Arrow**: Arrow は Card の Line 側の縁に付き、Line の方を向く。Collapse したときも、Card のある側に合わせて向きを変える。

**Reveal**: `data-reveal="scroll"` のときだけ、CSS のスクロール連動アニメーションで、Item が画面に入ってくる間に現れる (Marker は拡大しながら、Card は自分の Side の側から滑り込む)。次の場合は、アニメーションせずに最初から最終の状態で表示する。

- ブラウザがスクロール連動アニメーションに対応していない (2026-10 時点の Firefox)
- OS の「視差効果を減らす」設定が有効
- 見え方の範囲は、Item が画面に入りきった時点で終わるように取る。ページの最後の Item が、半透明のまま止まらないようにするため。

**既定の見た目**: 控えめで、周りになじむ見た目にする。文字の色とフォントはページから受け継ぐ。色は、ライトとダークのどちらでも破綻しないものを既定にする (ページの `color-scheme` に従う)。形は上流に近づける (丸い Marker、Arrow 付きの Card、Alternate が既定)。

**cascade layer と読み込み順**:

- すべての規則を `@layer tokiline` に入れる。layer に入っていない利用者の CSS は、詳細度に関係なく常に勝つ。
- Tailwind v4 のユーティリティも `@layer utilities` という layer に入っている。layer どうしの優先順位は、最初に宣言された順で決まる。このため、tokiline の CSS を Tailwind より後に読み込むと、`tokiline` の layer が `utilities` より強くなり、Tailwind のクラスが負ける。Tailwind v4 の利用者には、自分の CSS で Tailwind を読み込んだ後に、tokiline の CSS を `components` の layer の中へ読み込む手順 (CSS の `@import` の `layer()` 指定) を README で勧める。こうすると、tokiline は Tailwind の初期化 (base) より強く、ユーティリティより弱くなる。
- この組み合わせは受け入れの再現ページ (Tailwind v4 + shadcn/ui の配色) で確かめる。

**書字方向**: 物理方向のプロパティを使わず、論理プロパティだけで書く。`dir="rtl"` で左右が反転する。

**CSS の書き方とビルド**:

- 標準の CSS (ネスト・`light-dark()` など新しい書き方を含む) で書く。
- Lightning CSS で 1 ファイルにまとめ、対応範囲のブラウザ向けに変換・圧縮して、素の CSS として配る。
- Tailwind では書かない。Tailwind でビルドすると、利用者のページ全体に効く初期化や、`:root` の Tailwind の変数・`@property` が出力に混ざるため (作業用フォルダでの試しで確認)。
- 上流の CSS は流用せず、すべて書き直す。上流のアニメーション名 (`cd-bounce-*`) は、上流自身の出どころが明記されていない別の素材から来ている可能性があるため。

**対応範囲**: 見た目と読みやすさに関わる機能は、Baseline の「広く利用可能」(Widely available) までに限る。それより新しい機能 (スクロール連動アニメーションなど) は、無くても内容と配置が壊れない「おまけ」としてだけ使う。Lightning CSS に渡す対象ブラウザの指定も、この方針に合わせる。

### TS のコア (`tokiline`)

- 型: Item の Side (`start` / `end`)、Timeline の Side (Item の Side に `alternate` を足したもの)、Collapse の段階、Reveal の方式。
- クラス名の定数: 5 つの部品のクラス名を 1 か所で定義する。
- 部品ごとの属性ヘルパ: Timeline (Side・Collapse・Reveal)、Item (Side)、Marker・Card・Meta (引数なし) の 5 つ。どれも、`class` と必要な `data-*` を持つ、フレームワークに依存しない属性の集まりを返す。既定値と同じ値の属性は出さない。
- このヘルパが HTML の決まりの正本になる。React 版も、テストも、Vue などで部品を作る利用者も、これを使う。

### React 版 (`tokiline/react`)

- 部品は `Timeline`・`TimelineItem`・`TimelineMarker`・`TimelineCard`・`TimelineMeta` の 5 つで、名前付き export にする。`Timeline.Item` のようなドット形式は使わない。Server Component の側から Client Component のモジュールにドットで入ると `undefined` になり、将来一部を Client Component にしたときに壊れるため。
- `Timeline` は `side`・`collapse`・`reveal` を受け取る。`reveal` は 0.1 では真偽値で、真のとき `data-reveal="scroll"` を出す。後から方式名の文字列も受け取れるように広げられる。`TimelineItem` は `side` を受け取る。
- どの部品も、対応する HTML 要素の props (`className`・`style`・`aria-*`・`data-*`・イベントなど) をすべてそのまま渡す。利用者の `className` は、部品のクラス名の後ろに付け足す。
- フック・コンテキスト・`"use client"`・`forwardRef` を使わない。React 19 では `ref` が普通の props として要素まで届く。React 18 では `ref` は届かないので、ドキュメントに明記する。`forwardRef` を使わないのは、React のドキュメントが Client Component 向けとしていて、Server Component として動かす方針とぶつかるため。
- `style` に `--toki-*` の変数を書けるように、React の CSS プロパティの型を `--toki-` で始まるキーに限って広げる。
- 要素の差し替え (`as`・`asChild`) は入れない。

### Next.js での使い方

- App Router: 部品は Server Component のまま使える。CSS は root layout で 1 回読み込むか、Tailwind の利用者は上の layer の手順で自分の CSS から読み込む。
- Pages Router: CSS は `_app` で読み込む (Next.js の推奨)。部品の使い方は App Router と同じ。
- 対象は、App Router と Pages Router の両方。

### ドキュメントとデモ

- 英語の README を正本にし、日本語版の README.ja.md を置く。用語集 (CONTEXT.md) と ADR も英語で書く。
- README に書くこと: 導入、素の HTML での使い方、React での使い方、Next.js の App Router と Pages Router での CSS の読み込み方、Tailwind v4 での layer の手順と shadcn/ui の変数の対応づけの例、CSS 変数の一覧、ブラウザの対応 (Reveal は Firefox では動かないこと)、上流からの移行ガイド (旧 props と新しい書き方の対応表)、謝辞。
- デモは Vite のページを GitHub Pages に置く。Side・Alternate・Collapse の各段階・Reveal・右から左・ダーク・Segment の線種、そして my-portfolio-second の再現ページを載せる。

### リリースと品質

- バージョンは 0.x で始める。0.x の間は、破壊的変更を minor の上げ (0.1 → 0.2) で出す。CSS 変数の名前、data 属性、クラス名も公開 API に含める。
- 変更は Changesets で記録する。GitHub Actions から、trusted publishing で provenance 付きで npm に公開する。
- lint・書式・型・CI などの品質の仕組みは、リポジトリを作るときに `stack-setup` スキルで入れる。
- ビルドは、JS と型が tsdown、CSS が Lightning CSS。パッケージ管理は pnpm。

### リポジトリとライセンス

- LICENSE は MIT とし、自分 (2026 reeschan) と上流 (2016 Stéphane Monnot、react-vertical-timeline-component) の著作権表示を両方書く。
- README に謝辞 (上流の名前・作者・リンク、作り直したものであること) を書く。

## Testing Decisions

**良いテストの条件**: 外から観察できる振る舞いだけを確かめる。具体的には、利用者に見える HTML (クラス名・data 属性・要素) と、ブラウザでの見た目。CSS の規則の書き方や内部の変数の名前の付け方など、利用者に見えない実装は確かめない。

**合意済みの seam** (テストを書く境界。下流の実装 (tdd) はここでテストを書く):

1. **TS のヘルパ**: 各部品のヘルパが、引数に応じて正しい `class` と `data-*` を返すか。既定値の属性を出さないことも含めて、Vitest の単体テストで確かめる。
2. **React の部品が出す HTML**: `react-dom/server` で描画した HTML が、HTML の決まりどおりか (要素・クラス名・data 属性、`className` の付け足し、任意の属性の受け渡し)。React 18 と 19 の両方で確かめる。React 19 では `ref` が要素に届くことも確かめる。
3. **CSS の見た目**: React を使わない素の HTML のテスト用ページを用意し、Playwright のスクリーンショット比較で確かめる。対象ブラウザは Chromium・WebKit・Firefox。見る項目は、Side の 3 種、Alternate の Collapse の各段階と `never` / `always`、右から左、ライトとダーク、Segment の線種と Item ごとの変数、Marker と Arrow を消す指定、Reveal (Chromium と WebKit ではスクロール位置ごと、Firefox ではアニメーションせず最終の状態で表示されること)、視差効果を減らす設定。同じページに、axe によるアクセシビリティの検査もかける。
4. **Next.js で動くか**: `app/` と `pages/` の両方を持つ example を、Next.js 16 (React 19) と Next.js 14 (React 18) でビルドし、両方の Router で表示を軽く確かめる。App Router では、部品が Server Component として描画されることを確かめる。
5. **受け入れ**: my-portfolio-second の経歴タイムライン (左寄せ 1 列、アイコン入りの Marker、日付と「継続中」の印を入れた Meta、上辺に色の付いた Card、Card の中のボタン) を、Tailwind v4 + shadcn/ui の配色のもとで `!important` なしに再現したページを、スクリーンショット比較で確かめる。

**スクリーンショットを安定させる工夫**: 比較は固定の Linux コンテナ (Playwright の公式イメージ) の中で行い、テスト用ページのフォントはリポジトリに置いたものを使う。OS やフォントの違いで差分が出ないようにするため。

**既存の例**:

- 上流の Jest と React Testing Library のテスト (部品を描画してクラスを確かめるもの)。seam 2 がこれに代わる。
- my-portfolio-second の Vitest 5 の単体テスト、Playwright 1.64 の E2E、`@axe-core/playwright` によるアクセシビリティの検査。seam 1・3・5 の書き方の参考にする。

## Out of Scope

- 横向きの Orientation (0.1 では出さないが、名前と用語は横を足せるようにしてある)
- 「画面に入ったら 1 回だけ」動く、JS による Reveal
- 上流 API との互換層 (移行ガイドで代える)
- 折りたたむ幅を任意の値で指定する仕組み (0.1 は段階から選ぶ)
- Tailwind 用のプリセットや、shadcn/ui 用の配色ファイルの配布 (0.1 は README の例だけ)
- 配置だけの CSS ファイル (見た目を持たない版) の配布
- 要素の差し替え (`as`・`asChild`)
- Vue・Svelte・Astro などの専用の部品 (TS のヘルパで作れるようにするだけ)
- Web Components
- データを渡すとタイムラインを丸ごと描画する API
- 日付による並べ替え (データの側でやること)
- アイコンやマーカーのクリック用の props (利用者がボタンやリンクを置く)
- React 18.2 より古い React
- README とデモ以外のドキュメントサイト

## Further Notes

- **Firefox**: 2026-10-12 時点の正式版 (157、翌日公開の 158) は、スクロール連動アニメーションに対応していない (Nightly だけで有効)。対応すれば、tokiline 側を変えなくても Reveal が動き始める。
- **名前**: スコープなしの `timeline-kit` は、npm が記号を除いて既存の名前 (`timelinekit`) と比べる規則で公開できなかった。`tokiline` は 2026-10-12 時点で npm・GitHub・Web に同名が無かった。商標の登録までは調べていない。
- **初回の公開**: trusted publishing を、パッケージがまだ存在しない状態で設定できるかは確かめていない。できなければ、0.1.0 だけは npm のアカウントで手動で公開し、その後に trusted publishing へ切り替える。
- **my-portfolio-second の置き換え**: 0.1.0 の公開後に、あのリポジトリの通常の手順 (origin/develop から切った worktree で作業し、commit-gate を通し、PR を出す) で行う。
- **上流のフォーク** (reeschan/react-vertical-timeline): 残すかアーカイブするかは、tokiline を公開した後で決める。
- **上流への紹介**: 公開後に上流の issue で tokiline を紹介するかどうかは任意。外に向けた行動なので、そのときに改めて判断する。
- **この仕様の言語**: 公開ドキュメント (README・CONTEXT.md・ADR) は英語に決めたが、この仕様は設計の進め方 (design-flow) の決まりに従って日本語で書いている。
- 関連する記録: 用語は CONTEXT.md、判断の理由は ADR-0001 (CSS と HTML の決まりをコアにする) と ADR-0002 (汎用の名前で、0.1 は縦だけ) にある。
