# Lock file policy and tooling

This repo uses an on-disk `/Lock` coordination folder for short-lived AI/editor locks. These are meant as an advisory mechanism only — the source of truth for changes is git.

New tooling
- `npm run lock:prune` — detect lock files older than a given age that are safe to delete (default: 30 days). Exits non-zero if candidates are found.
- `npm run lock:prune -- --apply` — delete matching lock files (only when they explicitly contain RELEASED/UNLOCKED or `ready-for-unlock`).

CI enforcement
- A GitHub Actions workflow (`.github/workflows/lock-prune.yml`) runs on PRs and weekly; it fails the job when stale locks are detected so PR authors can clean them up before merge.

Safe-delete rules
- The prune tool will only delete files that contain one of: `RELEASED`, `UNLOCKED`, `ready-for-unlock` (case-insensitive).
- The tool refuses to delete when the repo has uncommitted changes (safety guard).

How to use
- Detect: `npm run lock:prune -- --age 30`
- Delete (local): `npm run lock:prune -- --age 30 --apply` (ensure a clean git tree first)

If you need assistance auditing lock files, open a draft PR and mention `@maintainers`.