Global margin normalization — 1rem
=================================

Summary
-------
This change normalizes margins across the site to **1rem** by default. It is:
- Implemented in a single CSS variable (`--global-margin`) in `src/styles/site.css`.
- Applied to common block-level elements (headings, paragraphs, structural elements).
- Non-destructive: components can opt-out using the `.no-global-margin` class.

Why
---
Consistency: ensure spacing across pages and demos matches the product requirement "all margins should be 1rem".

Opt-out
------
If a component must retain its original spacing, add the `.no-global-margin` class to the component root. Example:

<component class="no-global-margin">...</component>

Testing
-------
A Playwright regression `tests/views/margins.spec.ts` verifies computed margins for representative elements.

Rollback
--------
Revert the single block in `src/styles/site.css` (search for `--global-margin`) to roll back the change.
