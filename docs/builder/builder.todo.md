# Builder TODO

## Phase 1: Foundation Fixes ✅ COMPLETE

...existing code...

---

## Diagnostics & Startup — audit items (new)

- [ ] **Audit startup self-test log messages** — verify messages are accurate, remove noisy entries, and add automated assertions. (see startup console output shown in PR/CI). /owner: @team

- [ ] **Fix overwrite-detection trackedFunctions list** — remove non-configurable functions from `trackedFunctions` in `src/builder/builder-init.js` so overwrite-detection doesn't warn for protected functions. (log: "OVERWRITE DETECTION: Configuration Issues Found") /file: `src/builder/builder-init.js` /owner: @frontend

- [ ] **Add regression for HTML view readiness** — ensure `toggleComponentHtml()` exposes a readiness signal and populate `.component-html-code` synchronously; add Playwright test to guard against flake. (log: `builder-html-editor.js:278 [BuilderHtmlEditor] ✅ Loaded`) /file: `src/builder/builder-html-editor.js` /owner: @frontend

- [ ] **Verify Design-by-Contract load sequence** — confirm `builder-contracts.js` and `builder-state.js` load before components and add a smoke-test asserting the specific startup messages are present. (logs: `builder-contracts.js:421`, `builder-state.js:535`) /owner: @qa

- [ ] **Confirm component modules loaded order** — verify `builder-component-core`, `builder-html-editor`, `builder-semantic`, `builder-drag-drop` are listed in the module aggregator and document expected ordering. (logs: `builder-components.js:16-17`) /owner: @arch

- [ ] **Surface overwrite-detection remediation in docs** — add a short note to `docs/builder/builder.md` explaining when functions should be excluded from tracking and why (non-configurable / DBC). /owner: @docs

---

## QA / Follow-ups (low)

- [ ] **Create CI assertion** that startup emits the canonical loader messages (sanity-check for regressions).
- [ ] **Add debugging guide** for interpreting the builder init/overwrite warnings and recommended fixes (link to `docs/builder/BUILDER-PROPERTIES-SPEC.md`).

