# Proposal: v4 Golden-Ratio Layout Specification

**Status:** partially adopted (#472). `--golden-ratio: 1.618` and the
`--space-lg`/`--space-xl`/`--space-2xl` calc() chain in section 2 below are
now live in `src/styles/themes.css`. `--nav-width`/`--content-padding` are
still proposal-only — not implemented anywhere.

**Provenance:** the golden-ratio layout formulas below are adapted from a
real, pre-existing document — `Layout Formula System` in
`AI/wb/docs/reference/UnifiedInstructions.md` (a separate, older project,
not wb-starter). Reproduced here as the honest source, not reconstructed
from memory of an AI chat that fabricated a much larger "multiplier system"
and section-numbered spec around it — that elaborate version doesn't exist
anywhere and isn't part of this proposal.

---

## 1. Why

wb-starter's current spacing scale (`src/styles/themes.css`) is a flat,
hand-picked set:

```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
```

Nothing wrong with this — it's simple and predictable. The golden-ratio
approach below is an *alternative* worth evaluating, not a fix for a
known problem: each step is derived mathematically from the one before it
(×1.618) rather than chosen by eye, which some design systems use to keep
a visual rhythm consistent as the scale grows.

## 2. Core Variables (proposed)

```css
:root {
  /* Golden Ratio Foundation */
  --golden-ratio: 1.618;
  --inverse-golden-ratio: 0.618;

  /* Spacing Scale — derived, not hand-picked */
  --space-xs: 0.25rem;                                          /* 4px, unchanged base */
  --space-sm: 0.5rem;                                            /* 8px, unchanged base */
  --space-md: 1rem;                                              /* 16px, unchanged base */
  --space-lg: calc(1rem * var(--golden-ratio));                  /* ~26px */
  --space-xl: calc(1rem * var(--golden-ratio) * var(--golden-ratio)); /* ~42px */

  /* Layout Dimensions */
  --nav-width: calc(100vw / (var(--golden-ratio) * 2.75));       /* ~22.4% */
  --content-padding: calc(1rem * var(--golden-ratio));           /* ~26px */
}
```

Note this only changes `--space-lg`/`--space-xl`/`--space-2xl` — `xs`/`sm`/`md`
stay as today's real pixel values so small, already-tuned spacing (button
padding, badge padding, etc.) isn't disturbed. As adopted (#472), `--space-2xl`
continues the ×1.618 chain one more step (`--space-md * golden-ratio^3`,
~4.236rem) rather than staying hand-picked — see "Open Questions" below,
now resolved.

## 3. Where This Would Apply

wb-starter's real theme system (`src/styles/themes.css`) already defines
per-theme variables consumed throughout `src/styles/behaviors/*.css`. If
adopted, `--space-lg`/`--space-xl`/`--nav-width`/`--content-padding` would
be defined ONCE in the shared `:root` block (not per-theme — this is
layout math, not a color choice), the same way `--radius-md` and similar
structural tokens already work today.

## 4. Open Questions

- ~~Does `--space-2xl` continue the golden-ratio chain~~ Resolved (#472):
  yes, continues to `~4.236rem`.
- ~~Do any existing behaviors rely on the *current* `--space-lg`/`--space-xl`
  pixel values~~ Resolved (#472): checked via `demo-layout-standards.spec.ts`
  content-panel padding gate before adopting — no new failures vs. the
  pre-existing baseline.
- Still open: is `--nav-width`/`--content-padding` actually needed given wb-starter's
  existing layout behaviors (`x-sidebar`, `x-container`, etc. — see
  `docs/architecture/proposals/proposed-custom-elements.md`), or is this
  solving a problem that doesn't exist in wb-starter's actual layout system?

## 5. Explicitly Not Part of This Proposal

An earlier AI conversation (Copilot) elaborated this into a "three-tier
multiplier system" (element/context/theme multipliers), a numbered
`Section 1.6.18`, and a `/spec/v4/` folder tree with a dozen files
(`behavior-model.md`, `flow-model.md`, `hydration.md`, etc.). None of that
exists in the source document, in wb-starter, or anywhere else checked —
it was generated, not recalled. It's not reproduced here. If a fuller
multiplier system is wanted, it should be designed fresh and marked as new
work, not presented as something already established.
