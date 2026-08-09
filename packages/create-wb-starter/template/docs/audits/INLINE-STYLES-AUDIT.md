# Inline Styles Audit — Tier-1 Law 9 violation

**Date:** 2026-07-18
**Trigger:** John reviewing live-rendered `<wb-cardbutton>`/`<wb-card x-slidein>` markup,
flagging the sheer volume of inline `style="..."` attributes as "really noisy," then
identifying it as a standards violation.
**Standard violated:** `docs/claude/TIER1-LAWS.md`, Law 9 — "No One-Off Styles — Use
Existing CSS or Extend It": *"Never create inline styles, new CSS classes, or
duplicate existing styles."*

## Scope

`element.style.cssText = '...'` or `Object.assign(element.style, {...})` appears in
**33 files**, **250+ occurrences**, across `src/wb-viewmodels/`:

| File | Occurrences |
|---|---|
| `card.js` | **155** |
| `semantics/audio.js` | 19 |
| `enhancements.js` | 13 |
| `effects.js` | 13 |
| `overlay.js` | 12 |
| `helpers.js` | 11 |
| `semantics/code.js` | 6 |
| `password.js` | 6 |
| `semantics/input.js` | 5 |
| `notes.js` | 5 |
| `layouts.js` | 5 |
| `tabs.js` | 4 |
| `themecontrol.js` | 3 |
| `semantics/textarea.js` | 3 |
| `semantics/range.js` | 3 |
| `semantics/progress.js` | 3 |
| `semantics/details.js` | 3 |
| `progressbar.js` | 3 |
| `dropdown.js` | 3 |
| `codecontrol.js` | 3 |
| 13 more files | 1–2 each |

`card.js` alone accounts for over 60% of the total — its ~20 card-variant functions
(`cardhero`, `cardoverlay`, `cardproduct`, `cardminimizable`, `cardhorizontal`, etc.)
each build several inline-styled elements (title, subtitle, body, footer, buttons)
rather than using `card.css` classes. This is exactly the pattern that made tonight's
card-subtitle-margin bug (see main session log — several variants' inline
`style.cssText` silently overrode `card.css`'s correct `.wb-card__subtitle` rule)
possible in the first place: a class-based fix in the shared stylesheet can't reach
an element that never got the class-only treatment to begin with.

## Why this matters beyond "noisy"

- **Standards violation**: direct breach of Law 9, the project's highest-priority
  styling rule.
- **Cascade fights**: inline styles beat every stylesheet rule on specificity
  regardless of how the CSS is written — a theme override, a dark-mode fix, or a
  future `card.css` change can't reach an inline-styled element at all. This is not
  hypothetical: it already caused a real bug fixed tonight (subtitle margin-bottom
  silently dropped to 0 in several variants because inline styles won over the
  correct CSS rule).
- **DOM bloat**: every rendered card/audio-player/dropdown/etc. serializes a full
  style dump per element instead of a short class list — visible directly in the
  `<wb-cardbutton>`/`<wb-card>` markup John pasted.
- **No single source of truth**: the "same" visual property (e.g. subtitle margin)
  can be defined in up to N different places (once per variant's inline string) 
  instead of once in `card.css`, which is exactly how they drifted out of sync.

## Recommended approach (not started)

Given the size (250+ occurrences, one component library's worth of behaviors), this
needs to be its own dedicated, scoped effort — not folded into an unrelated bug-fix
session. Suggested order:

1. **`card.js` first** — biggest win by far (155/250+ occurrences in one file), and
   already has an established CSS home (`card.css`) with most of the BEM class names
   (`.wb-card__title`, `.wb-card__subtitle`, etc.) already defined — many of these
   inline styles are likely pure duplicates of an existing rule and can be deleted
   outright rather than migrated.
2. **`semantics/audio.js`, `enhancements.js`, `effects.js`, `overlay.js`,
   `helpers.js`** — the next tier (11–19 occurrences each), likely each needs a new
   or expanded CSS file under `src/styles/behaviors/`.
3. **The long tail** (13 files with 1–3 occurrences each) — low effort per file, but
   worth a pass since Tier 1 Law 9 has zero-tolerance framing ("Never").

Each pass should follow the same discipline as tonight's fixes: write a regression
test asserting the CSS-driven visual result BEFORE converting, convert, verify the
test still passes with the class-only version, confirm no visual regression via a
live screenshot check, then move to the next file.

## Status

Filed, not started. Tracking issue: [#370](https://github.com/CieloVistaSoftware/wb-starter/issues/370).
