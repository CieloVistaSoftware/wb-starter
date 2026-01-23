---
labels: [QA, priority:medium]
---

# Migrate remaining data-* attributes in `demos/` and `docs/`

Description
- `tests/compliance/no-data-attributes.spec.ts` reports ~101 remaining `data-*` attributes primarily in `demos/` and `docs/` (e.g., `data-theme`, `data-columns`). The prior automated migration covered `src/` files but not demos/docs.

Proposed plan
- Run scanning and migration on `demos/` and `docs/` (or apply targeted replacements), update affected tests, and review any semantic differences.

Acceptance criteria
- No `data-*` violations reported by `tests/compliance/no-data-attributes.spec.ts`.
- Migration changes are documented and reviewed.

Tasks
- [ ] Run `node scripts/scan-migration.js --targets=demos,docs` (or equivalent) to list occurrences
- [ ] Run `node scripts/migrate-data-attributes.js --targets=demos,docs --dry-run` and review
- [ ] Apply migration and update tests/docs
- [ ] Re-run `npm run test:compliance`

Estimate: 2-6 hours depending on findings
