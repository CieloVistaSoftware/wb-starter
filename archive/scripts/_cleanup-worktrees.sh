#!/bin/bash
# Scratch cleanup script, not part of the repo's permanent tooling -- removed
# after use. Safely removes residual .claude/worktrees/agent-* directories.
# Never deletes a branch -- only the worktree directory -- so any unmerged
# commits remain reachable via their branch ref for later recovery/merge.
#
# IMPORTANT (learned the hard way): some worktrees have node_modules/out set
# up as a Windows directory JUNCTION pointing back at the MAIN checkout's
# real copy, to skip a slow reinstall. `git worktree remove --force`'s
# underlying recursive delete does NOT special-case junctions on Windows --
# it recurses INTO the junction and deletes the shared TARGET contents,
# not just the link. This wiped out the main checkout's real node_modules
# once already. Before removing each worktree, explicitly detect and
# unlink (not recursively delete) any junction at node_modules/out first,
# via `cmd /c rmdir` (a plain rmdir on a junction just removes the link).
set -u
cd "$(dirname "$0")/.."

MAIN="C:/Users/jwpmi/Downloads/AI/wb-starter"
KEEP_ACTIVE="agent-a90967baccf38cf55 agent-aaab8f911b7b46693"

LOG="/tmp/wt_cleanup_log2.tsv"
> "$LOG"

unlink_if_junction() {
  local p="$1"
  local winp
  winp=$(cygpath -w "$p" 2>/dev/null || echo "$p")
  if fsutil reparsepoint query "$winp" >/dev/null 2>&1; then
    cmd //c rmdir "$winp" >/dev/null 2>&1
    echo -e "UNLINKED_JUNCTION\t$p" >> "$LOG"
  fi
}

git worktree list --porcelain | awk '
/^worktree / {path=substr($0,10)}
/^locked/ {locked="yes"}
/^$/ {print locked"\t"path; path="";locked="no"}
END {if(path!="") print locked"\t"path}
' | while IFS=$'\t' read -r locked path; do
  [ -z "$path" ] && continue
  [ "$path" = "$MAIN" ] && continue

  base=$(basename "$path")
  skip=0
  for k in $KEEP_ACTIVE; do
    [ "$base" = "$k" ] && skip=1
  done
  if [ "$skip" = "1" ]; then
    echo -e "KEPT_ACTIVE\t$base" >> "$LOG"
    continue
  fi

  if [ "$locked" = "yes" ]; then
    git worktree unlock "$path" 2>/dev/null
  fi

  unlink_if_junction "$path/node_modules"
  unlink_if_junction "$path/out"

  out=$(git worktree remove "$path" 2>&1)
  if [ $? -eq 0 ]; then
    echo -e "REMOVED\t$base" >> "$LOG"
  else
    out2=$(git worktree remove --force "$path" 2>&1)
    if [ $? -eq 0 ]; then
      echo -e "FORCE_REMOVED\t$base" >> "$LOG"
    else
      echo -e "FAILED\t$base\t$out2" >> "$LOG"
    fi
  fi
done

git worktree prune -v >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
