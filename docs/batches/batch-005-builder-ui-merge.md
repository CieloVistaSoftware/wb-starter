# Batch 005 — Builder UI Merge (Top-bar → Common Header)

Scope: Fully merge the Builder top-bar into the shared `wb-navbar` header (common header), finalize visual parity, and remove duplicate controls.

Tasks:
- Replace top-bar markup with `wb-navbar` extras or ensure consistent buttons
- Validate Issues button behavior (already wired in an earlier PR, finalize styling)
- Polish spacing, responsive behaviors, and header-specific controls (Save, Preview, Test)
- Add Playwright tests to confirm visual and functional parity

Files to check (examples):
- `src/builder/views/top-bar.html`
- `src/styles/builder.css` and `src/styles/components/common-header.css`
- `tests/behaviors/ui/*` for header and builder tests

Notes:
- Medium-high risk: visual regressions possible; require design sign-off.
