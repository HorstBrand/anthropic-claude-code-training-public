#!/usr/bin/env bash
# PreToolUse hook (Bash): enforces the Release Standard "no direct commits to main".
# Blocks `git commit` while the current branch is main, and any `git push` that targets main.
# Exit 2 blocks the tool call; stderr is shown to Claude.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$)'; then
  branch=$(git branch --show-current 2>/dev/null)
  if [ "$branch" = "main" ]; then
    echo "Blocked: no direct commits to main (Release Standards). Create a branch named after the ticket, e.g. NWP-201-issue-cards." >&2
    exit 2
  fi
fi

if printf '%s' "$cmd" | grep -Eq 'git[[:space:]].*push([[:space:]].*)?[[:space:]:+]main([[:space:]]|$)'; then
  echo "Blocked: no direct pushes to main (Release Standards). Push your ticket branch and open a pull request." >&2
  exit 2
fi

exit 0
