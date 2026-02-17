# PAGE REPAIR PLAN — Master Execution Guide
**Date:** 2026-02-15
**Goal:** All WB-Starter pages + demos pass validation. Tests enforce the contracts.


## EXECUTION PHASES (ARCHIVED)

**All actionable page and demo repair tasks are now tracked in `docs/_today/TODO.md` for unified prioritization and status.**

Refer to TODO.md for the current list and progress of all page and demo repair work. This file remains as a reference for the original plan and rules.

## RULES (enforced by tests)

### Page Fragment Rules (pages/*.html)
1. NO `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` tags
2. NO `<style>` blocks — use src/styles/pages/{name}.css
3. NO `<link>` to site.css or themes.css
4. NO `<script>` with WB.init()
5. MUST have `.page__hero` containing `<h1>`
6. MUST have at least one `.page__section` containing `<h2>`
7. MAX 3 inline styles per page (layout tweaks only)

### Demo Rules (demos/*.html)
1. MUST have `<!DOCTYPE html>`
2. MUST have `<html>` with `data-theme`
3. MUST have `<meta charset>` and `<meta viewport>`
4. MUST have `<title>`
5. If uses wb-* components, MUST import WB
