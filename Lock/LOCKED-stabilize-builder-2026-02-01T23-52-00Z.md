id: copilot-stabilize-builder
ts: 2026-02-01T23:52:00Z
purpose: Stabilization run to get Builder smoke tests passing (user-requested)
own er: GitHub Copilot
status: completed
notes: Focused fix applied: made `del()` return boolean in core and shortcuts modules to satisfy Builder API contract for `remove()`. Ran targeted Playwright test(s); all affected Builder smoke tests now pass locally. Created per-file locks and cleared them.
verification: Playwright `tests/behaviors/ui/builder-api.spec.ts -g "remove"` passed locally; trace saved to `tmp/playwright-builder-remove/.../trace.zip`. Commit message updated to record this verification.