# Context Menu — Issue #7 Progress

**Status:** In Progress

**Started:** 2026-01-23 ~23:00 UTC

**Summary:**
- Created Playwright test: `tests/debug/debug-component-context-menu-inspect.spec.ts` to verify that the component context menu's "Inspect" action sets `window.$i` and logs an Inspect-related message.
- Investigation targets: `src/builder/builder-init.js` (contextmenu handler) and `src/builder/builder-ui.js` (showComponentContextMenu / inspectElement).

**Next steps:**
1. Run the Playwright test locally to confirm behavior and capture failures.
2. If failing, modify `inspectElement` to set `window.$i` and ensure console logs are emitted prior to triggering `debugger` fallback.
3. Add unit/test coverage to prevent regressions and update `docs/_today/TODO.md` once verified.

