# CSS Ownership Migration Plan
**Created:** 2026-02-08  
**Last Updated:** 2026-02-08  
**Status:** Phase 1 in progress  
**Decision:** Option A — behavior CSS grouped in `src/styles/behaviors/`

---

## Problem

Component CSS is scattered across up to 3 monolithic files, causing duplication, conflicts, and hard-to-debug styling issues:

| Source File | Size | Components | Role |
|---|---|---|---|
| `src/styles/site.css` | 47.8 KB | ~85 base names (133 selectors) | Site layout + component styles mixed together |
| `src/styles/components.css` | 10.5 KB | ~22 base names (50 selectors) | Form controls + duplicated component styles |
| `src/styles/demo.css` | 15.2 KB | ~44 base names | Demo-page presentation styles |

**Total duplicated or competing CSS:** ~73.5 KB across 3 files.

---

## Target Architecture

Per `docs/css-standards.md`, the OOP CSS layer hierarchy is:

```
Layer 1: Foundation     → themes.css + site.css (layout only, no components)
Layer 2: Behaviors      → src/styles/behaviors/*.css (one file per behavior group)
Layer 3: Page-specific  → builder.css, etc. (standalone pages only)
Layer 4: Premium        → wb-signature.css (optional effects)
```

**Goal:** Extract all component styles out of site.css, components.css, and demo.css into Layer 2 behavior CSS files. Eventually delete components.css and demo.css; slim site.css down to pure layout.

---

## Already Extracted (Layer 2 Behavior CSS)

These files already exist in `src/styles/behaviors/`:

| File | Size | Components Covered |
|---|---|---|
| `card.css` | 8.2 KB | Card base + card variants |
| `navbar.css` | 6.6 KB | Navbar, navigation |
| `effects.css` | 7.2 KB | Animation keyframes |
| `notes.css` | 5.9 KB | Notes component |
| `hero.css` | 3.8 KB | Hero banner |
| `header.css` | 1.6 KB | Site header |
| `details.css` | 1.5 KB | Details/accordion |
| `footer.css` | 1.4 KB | Site footer |
| `audio.css` | 11.7 KB | Audio player |
| `stock.css` | 0.6 KB | Stock ticker |
| **Total** | **48.5 KB** | **10 behavior groups** |

---

## Duplicates Requiring Consolidation

Components with CSS in **multiple** source files (must pick one source of truth):

| Component | site.css | components.css | demo.css | behaviors/ | Action |
|---|---|---|---|---|---|
| **wb-dialog** | ✅ (full) | ✅ (full) | — | — | Consolidate → `behaviors/overlay.css` |
| **wb-button** | ✅ (variants) | ✅ (base+states) | — | — | Consolidate → `behaviors/inputs.css` |
| **wb-table** | ✅ (variants) | ✅ (base) | ✅ (base) | — | Consolidate → `behaviors/data.css` |
| **wb-progress** | ✅ (gradient/striped) | ✅ (stripes anim) | ✅ (base) | — | Consolidate → `behaviors/feedback.css` |
| **wb-switch** | — | ✅ (full) | ✅ (different impl) | — | Consolidate → `behaviors/inputs.css` |
| **wb-fade-in** | ✅ (keyframe) | ✅ (keyframe) | — | `effects.css`? | Dedupe → `behaviors/effects.css` |

---

## Phase 1: Critical Duplicates ⏳

Resolve components that have **conflicting** styles across files.

- [ ] **wb-card** — `behaviors/card.css` exists (8.2 KB) but `demo.css` has competing card styles (lines 209-230). Audit and remove demo.css card rules that conflict.
- [ ] **wb-table** — TRIPLE defined. Consolidate into new `behaviors/data.css`.
  - `site.css`: variants (striped, hover, bordered, compact)
  - `components.css`: base table + variants (duplicated)
  - `demo.css`: base table styles (line 357)

---

## Phase 2: Remaining Duplicates

Resolve components duplicated across exactly 2 files.

- [ ] **wb-dialog** — `site.css` + `components.css` both define full dialog styles. Consolidate → new `behaviors/overlay.css`.
- [ ] **wb-button** — `site.css` (glass/gradient variants) + `components.css` (base+primary+secondary). Consolidate → new `behaviors/inputs.css`.
- [ ] **wb-switch** — `components.css` + `demo.css` have different implementations. Pick winner → `behaviors/inputs.css`.
- [ ] **wb-progress** — All 3 files. Consolidate → new `behaviors/feedback.css`.
- [ ] **wb-fade-in** / **wb-progress-stripes** — Keyframe duplicates. Dedupe → `behaviors/effects.css`.

---

## Phase 3: demo.css Component Extraction

Move remaining demo.css component styles into behavior group files. demo.css should ultimately only contain demo-page layout styles (grids, spacing), not component visuals.

**Components still in demo.css (44 base names):**

| Component | Target Behavior File |
|---|---|
| wb-accordion | `behaviors/data.css` |
| wb-alert | `behaviors/feedback.css` |
| wb-avatar | `behaviors/feedback.css` |
| wb-badge | `behaviors/feedback.css` |
| wb-breadcrumb | `behaviors/navigation.css` |
| wb-card (base) | Already in `behaviors/card.css` — remove from demo.css |
| wb-chip | `behaviors/feedback.css` |
| wb-divider | `behaviors/layouts.css` |
| wb-dropdown | `behaviors/overlay.css` |
| wb-empty | `behaviors/feedback.css` |
| wb-gallery | `behaviors/data.css` |
| wb-kbd | `behaviors/feedback.css` |
| wb-mdhtml | `behaviors/data.css` |
| wb-modal | `behaviors/overlay.css` |
| wb-otp | `behaviors/inputs.css` |
| wb-pagination | `behaviors/navigation.css` |
| wb-popover | `behaviors/overlay.css` |
| wb-progress | `behaviors/feedback.css` |
| wb-rating | `behaviors/inputs.css` |
| wb-skeleton | `behaviors/feedback.css` |
| wb-spinner | `behaviors/feedback.css` |
| wb-stat | `behaviors/data.css` |
| wb-steps | `behaviors/navigation.css` |
| wb-switch | `behaviors/inputs.css` |
| wb-table | `behaviors/data.css` |
| wb-tags | `behaviors/feedback.css` |
| wb-timeline | `behaviors/data.css` |
| wb-toast | `behaviors/feedback.css` |

---

## Phase 4: site.css Component Extraction

Extract component styles from site.css, leaving only pure site layout (grid, sidebar, scroll-lock, drawer layout).

**Components to extract from site.css (~85 base names):**

| Behavior Group | Components |
|---|---|
| `feedback.css` | wb-spinner, wb-badge-gradient, wb-dot-pulse, wb-pulse-dot |
| `card.css` | wb-card, wb-card-float (merge with existing) |
| `overlay.css` | wb-drawer (component styles, not layout) |
| `inputs.css` | wb-button, wb-btn-glass, wb-btn-gradient, wb-btn-rack, wb-input-glass |
| `effects.css` | wb-animate, wb-bounce, wb-fade-in/out, wb-flash, wb-flip, wb-heartbeat, wb-jello, wb-marquee, wb-pulse, wb-rotate, wb-rubberband, wb-shake, wb-slide-in-*, wb-spin, wb-swing, wb-tada, wb-wobble, wb-zoom-in/out |
| `layouts.css` | wb-divider-gradient, wb-glass, wb-gradient-shift, wb-gradient-text, wb-orb, wb-orb-float |
| `data.css` | wb-table (merge with Phase 1 consolidation) |
| `navigation.css` | (already in navbar.css, header.css, footer.css) |
| Keep in site.css | wb-grid, wb-row, wb-sidebar, wb-reel, wb-scroll-lock, wb-resizing, wb-content-auto |

---

## Phase 5: Delete & Cleanup

- [ ] Delete `src/styles/components.css` (all styles migrated out)
- [ ] Delete `src/styles/demo.css` (all component styles migrated; layout styles moved or eliminated)
- [ ] Slim `src/styles/site.css` to layout-only (~10-15 KB target, down from 47.8 KB)
- [ ] Update all HTML imports that reference deleted files
- [ ] Run full compliance tests to verify no visual regressions

---

## New Behavior CSS Files to Create

| File | Purpose | Source Components |
|---|---|---|
| `behaviors/feedback.css` | Alerts, badges, progress, spinner, toast, skeleton, chips, tags | demo.css + components.css + site.css |
| `behaviors/inputs.css` | Button, checkbox, switch, input, select, textarea, rating, OTP, range, radio | components.css + demo.css + site.css |
| `behaviors/overlay.css` | Dialog, modal, drawer, dropdown, popover | site.css + components.css + demo.css |
| `behaviors/data.css` | Table, timeline, accordion, gallery, stats, code, mdhtml | demo.css + site.css + components.css |
| `behaviors/navigation.css` | Breadcrumb, pagination, steps, tabs | demo.css |
| `behaviors/layouts.css` | Divider, glass, gradients, orbs | site.css + demo.css |

---

## Rules for Migration

1. **No duplication** — each selector lives in exactly ONE file
2. **Use theme variables** — no hardcoded colors (per `css-standards.md`)
3. **No `!important`** — fix specificity properly
4. **Test after each extraction** — run compliance tests to catch regressions
5. **One component at a time** — don't batch extract, verify each move
6. **Lock files before editing** — follow `/Lock` protocol

---


## Progress Tracking (ARCHIVED)

**All actionable migration tasks are now tracked in `docs/_today/TODO.md` for unified prioritization and status.**

Refer to TODO.md for the current list and progress of all CSS migration and extraction work. This file remains as a reference for the migration plan and background.
