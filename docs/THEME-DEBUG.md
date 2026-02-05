Theme debugging (FOUC / data-theme overrides)
===============================================

What this provides
- A small, non-invasive browser helper at `src/tools/theme-debug.js` you can paste into DevTools or load as a snippet.
- A Playwright diagnostic (`tests/views/theme-debug.spec.ts`) that instruments the page early and captures any writes to `data-theme` (including `dataset.theme`) with stack traces where possible.

Quick manual steps
1. Open the affected page in Chrome/Edge/Firefox.
2. Open DevTools → Console and paste:
   (copy/paste the contents of `src/tools/theme-debug.js` or run it as a Snippet)
3. Reload the page and observe the `WB Theme Debug — quick report` console group. It shows:
   - whether `site.css` loaded
   - computed `--bg-color`
   - any explicit writes to `data-theme` (with stack snippets)

Run the Playwright diagnostic locally
------------------------------------
- npm ci
- npx playwright test tests/views/theme-debug.spec.ts -o

Interpreting results
- If `site.css` is loaded and `--bg-color` is the dark token, but the page still appears light, look for `writes` that set `data-theme` to `light` — the stack snippet (if present) indicates the originating script.
- If `localStorage['wb-theme'] === 'light'` and a script applies persisted preferences *before* site paint, the Playwright diagnostic will capture that write.

Non-invasive remediation policy
- Do NOT change CSS as part of the fix. Prefer a JS runtime fix (Theme resolution) that:
  - honors explicit authorial `[data-theme]` attributes
  - if no authorial attribute and `site.css` is present, prefer CSS-derived dark default for first paint
  - persist/restore user preference only after the first paint (so demos use the CSS-first contract)

Next steps I can do for you
- Run the diagnostic across a set of problem pages and produce a prioritized list of offenders (scripts or persisted prefs).
- Implement a JS-only fix in `src/core/theme.js` that respects the CSS-first contract (requires your explicit approval before changing runtime code).
