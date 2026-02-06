# TODO
**Moved from `CURRENT-STATUS.md`**
**Updated:** 2026-02-06 02:00

- [ ] **FIND ALL :5174 STRINGS AND REPLACE WITH BASEURL** — themes-showcase.spec.ts was hardcoded to localhost:5174 instead of using Playwright baseURL. Audit all test files for hardcoded ports.
- [ ] **Fix builder app** — builder-app/index.js has 30+ module imports; the ES module chain breaks silently. All builder tests skipped until operational.
- [ ] **Fix schema-viewer** — #schemaSelector dropdown never populates with schemas. All schema-viewer tests skipped.
- [ ] **wb-card status** — CSS ownership migration COMPLETE (card.css created, self-load added, demo.css cleaned). Update `CURRENT-STATUS.md` table above.

---

> NOTE: These items were moved from `CURRENT-STATUS.md` to keep the status document focused. If an item is completed, remove it from this list and update `CURRENT-STATUS.md` accordingly.
