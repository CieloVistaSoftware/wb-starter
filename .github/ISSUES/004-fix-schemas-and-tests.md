---
labels: [QA, priority:medium]
---

# Fix schema validation errors & test examples

Description
- Compliance tests report missing `type` for `settings` in `builder-pages.schema.json` and `page-builder.schema.json` and multiple `setup` examples that are invalid (not strings or missing `<wb-*>` tags). `features.schema.json` also missing `$methods` and `$cssAPI` sections.

Proposed fix
- Add missing `type` fields, correct `setup` examples to valid HTML strings referencing correct `<wb-*>` usage, and add required schema metadata sections where applicable.

Acceptance criteria
- `tests/compliance/schema-validation.spec.ts` and `v3-syntax-compliance.spec.ts` pass for the updated schemas.

Tasks
- [ ] Update `builder-pages.schema.json` and `page-builder.schema.json` to include `type` for `settings`
- [ ] Validate and fix `setup` examples for `draggable`, `resizable`, and others
- [ ] Add `$methods` and `$cssAPI` sections to `features.schema.json` if required
- [ ] Add or update schema tests to cover corrected items
- [ ] Re-run compliance tests

Estimate: 2-5 hours
