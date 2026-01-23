# Batch 002 — Schema Fixes

Scope: Update JSON schemas and fix schema-related tests.

Tasks:
- Add missing `type` fields to properties where tests expect them
- Add `interactions.elements` for schemas that include interactive buttons
- Align schema property names with behavior expectations (e.g., title ↔ heading)
- Run schema validation tests and adjust behavior code as needed

Files to check (examples):
- `src/wb-models/*.schema.json`
- `tests/compliance/schema-validation.spec.ts`

Notes:
- Medium risk: requires schema changes and test updates; run test-suite locally before PR merge.
