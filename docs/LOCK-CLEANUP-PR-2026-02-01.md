# Lock cleanup PR (audit)

This PR records the lock cleanup audit performed on 2026-02-01 and proposes removal of released/stale lock files.

Summary of findings
- No remaining `RELEASED` / `UNLOCKED` markers were found in `Lock/` at the time of the audit.
- Files removed from disk during the audit (some were git-ignored; two tracked deletions were committed earlier):
  - Lock/LOCKED-builder-dom-init.md (disk-only)
  - Lock/LOCKED-builder.html.md (committed deletion)
  - Lock/LOCKED-public--builder.html.md (disk-only)
  - Lock/LOCKED-mcp-restart.md (disk-only)
  - Lock/LOCKED-mcp-server.md (disk-only)
  - Lock/LOCKED-test-failures.md (committed deletion)

Repro
- Detect: `npm run lock:prune -- --age 30`
- Delete (local, safe): `npm run lock:prune -- --age 30 --apply` (ensure clean git tree first)

Recommendation
- Approve this audit; no additional file deletions are required now.
- Merge #78 (lock-prune) first — it adds the automation and CI checks that will prevent future drift.

Audit performed by: GitHub Copilot — 2026-02-01T00:00:00Z
