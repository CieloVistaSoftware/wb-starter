# Batch 004 — CSS Cleanup & Visual Polishing

Scope: Replace hardcoded colors with CSS variables, reduce `!important`, and adjust header styles for common header integration.

Tasks:
- Replace color literals with `var(--*)` tokens
- Remove or minimize `!important` overrides
- Adjust builder top-bar styles to align with site header (consistent sizing & spacing)
- Add visual regression smoke tests (where practical)

Files to check (examples):
- `src/styles/**/*.css`
- `src/styles/components/*`
- `src/builder/views/top-bar.html` adjustments

Notes:
- Visual changes should be validated visually and via tests where feasible.
