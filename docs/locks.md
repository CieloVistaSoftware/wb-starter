# Locking policy & operational SLA

This document describes how advisory locks in `/Lock` are used, triaged, and cleaned up.

Key points (short)
- Always add `owner:`, `reason:`, and `expires:` (ISO date) when you create a lock.
- CI will detect stale locks and open PRs; weekly reminders and auto-close policies enforce housekeeping.
- If a lock is not needed, remove it immediately and include `status: released` in the file prior to deletion.

Metadata (supported in top-of-file lines)
- owner: @github-username or Full Name <email>
- reason: short description
- status: active | released | resolved
- expires: 2026-02-15 (ISO date)
- related-pr: #123

Example lock (template)

```markdown
# LOCKED: src/wb-viewmodels/builder-app/builder-dom-init.js
owner: @alice
reason: migrating DOM init into MVVM viewmodels
status: active
expires: 2026-02-15
related-pr: #75

Started: 2026-01-31T20:00:00Z
ETA: 2026-02-02

---
Details: working on reducing inline handlers and adding tests.
```

SLA & automation
- Reminders: weekly workflow will create issues for locks older than 30 days without an `expires:` field.
- Auto-close: lock issues with no activity for 14 days will be warned and then closed if still idle after the next weekly run.
- Local guard: a pre-commit hook is available (`scripts/install-git-hooks.sh`) to block commits when obviously stale locks exist (age & RELEASED marker checks).

How to check and act (commands)
- List locks: `node scripts/lock-status.js --json` or `npm run lock:status`
- Annotate a lock: `npm run lock:annotate -- --file LOCKED-foo.md --set owner=@you expires=2026-02-10 --note "still working"`
- Detect stale locks (dry-run): `npm run lock:prune -- --age 30`
- Remove safe locks: `npm run lock:prune -- --age 30 --apply` (ensure clean git tree first)

If you disagree with automatic deletion for a specific lock, set `expires:` to a future date and add `reason:`. The weekly reminder will surface long-lived locks to the maintainers.
