---
labels: [QA, priority:high]
---

# Fix Home Page Content: hero variant & missing sections

Description
- Several home page assertions fail: hero variant is `gradient` (expected `cosmic`), and sections like "Why WB Behaviors", live demo glass card, bottom CTA heading, and the image grid are missing or not visible.

Steps to reproduce
- Run `npm run test:compliance` and review `tests/compliance/home-page.spec.ts` failure contexts.

Proposed fix
- Inspect `pages/index.html` and related partials (e.g., `src/wb-views/partials/hero-cosmic.html` and `spa-home.html`) to restore expected markup and variants.

Acceptance criteria
- The hero has `variant=