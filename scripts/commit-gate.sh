#!/bin/sh
# 確認コマンドが通ったら、そのときのステージ内容 (ツリー ID) を「合格の印」として残す。
# verify は今のステージ内容が合格済みかだけを確かめる (フックから呼ぶ)
set -eu
stamp="$(git rev-parse --absolute-git-dir)/commit-gate.stamp"
tree="$(git write-tree)"
if [ "${1:-}" = "verify" ]; then
  [ -z "$(git diff --cached --name-only)" ] && exit 0
  if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$tree" ]; then exit 0; fi
  echo "commit-gate: 未検査か、検査後にステージ内容が変わりました。git add のあと scripts/commit-gate.sh を実行してください" >&2
  exit 1
fi
# 検査するのはステージ内容と同じ作業ツリーである前提。未ステージの変更があれば止める
if ! git diff --quiet; then
  echo "commit-gate: ステージしていない変更があります。stash するかステージしてください" >&2
  exit 1
fi
pnpm check
echo "$tree" > "$stamp"
echo "commit-gate: 合格"
