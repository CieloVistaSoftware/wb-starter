# Batch 001 — Quick Wins & Docs

Scope: small, low-risk documentation and housekeeping fixes.

Tasks:
- Fix small doc typos and broken links referenced by tests
- Add missing `.md` files in `docs/` referenced by manifest
- Adjust timeout values for heavy demo pages (kitchen-sink, frameworks) as immediate mitigation
- Add/update tests that validate these doc-driven behaviors

Files to check (examples):
- `docs/*` (search for broken links)
- `manifest.json`
- `pages/*` for stale references
- `playwright.config.ts` / test timeout settings

Notes:
- Low-risk PR; run unit + compliance tests before merging.
