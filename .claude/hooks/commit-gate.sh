#!/bin/sh
input="$(cat)"
printf '%s' "$input" | grep -Eq 'git[^"]*[[:space:]]commit([[:space:]]|")' || exit 0
cd "$CLAUDE_PROJECT_DIR" && sh scripts/commit-gate.sh verify >&2 || exit 2
