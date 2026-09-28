# CSS class convention — you can name the class without reading the code

**Convention over configuration.** A behavior's classes are *derivable* from its
name. No manifest, no lookup, no opening the JavaScript.

John, 2026-09-08: *"if we control how .js names classes then we can find them
based on convention"* — and *"the user must easily be able to find the class for
current element."*

---

## The rule

```
x-{behavior}                 the host element
x-{behavior}__{part}         DOM the behavior builds inside the host
x-{behavior}--{modifier}     a variant or state of the host
```

`{behavior}` is the behavior's **registered name** in `src/core/tag-map.js` —
not a concept, not an abbreviation, not a related word.

Observed on a real render, `<div x-alert>`:

```
host   x-alert  x-alert--info
built  x-alert__content  x-alert__icon  x-alert__message
```

So an author who wrote `x-alert` knows, without looking anything up, that
`.x-alert__icon` is the icon and `.x-alert--info` is the informational variant.

---

## Why the convention and not a manifest

A manifest is a second source of truth. It is correct on the day it is written
and wrong the first time someone adds a class without updating it — and nothing
notices, because a stale list looks exactly like a current one.

A convention cannot go stale. It can only be *broken*, and a broken convention is
detectable by a gate.

---

## What breaks it

**A base that is not the behavior's name.** The class names a concept instead of
the thing that applies it:

```
x-pricing        the behavior is `cardpricing`
x-stats          the behavior is `cardstats`
x-product        the behavior is `cardproduct`
```

Nobody can derive `x-pricing` from `cardpricing`. The chain breaks at the first
link.

**Single-dash compounds.** They are ambiguous by construction:

```
x-card-image     the `cardimage` behavior? or the `image` part of a `card`?
```

Those are different elements with different rules, and the name cannot
distinguish them. `x-cardimage` (a behavior) and `x-card__image` (a part) can.

Measured 2026-09-08: **184 of 333 classes conform (55%)**. 77 use a base that is
not a behavior name; 72 use the wrong shape. See #1096.

---

## Why inline styles are not an alternative

Whatever is not in a class ends up in `element.style`, and that is worse in three
specific ways:

- **Unfindable.** `grep .x-card--expanded src/styles/` returns nothing, and
  nothing points the reader at `card.js` instead.
- **Unoverridable.** An inline style beats every selector, so a page needing a
  different look has no route but `!important` — which is banned. The practical
  result is that it cannot be changed at all.
- **Unthemeable.** Themes work by redefining custom properties that *stylesheets*
  consume. A value written into `element.style` never sees them.

This repo has paid for it twice already: **#1003** removed `style.cssText` from
the fullscreen trigger because *"it also won against the page, so #1004 could not
size this button"*; **#520** traced crowded card buttons to `style.cssText` in
`cardpricing()` silently overriding the class's own padding.

Measured 2026-09-08: **1,004 inline style writes** across the behaviors. See
#1095.

**The one legitimate inline write is a custom property**, because only the value
varies and the rule still lives in CSS:

```js
element.style.setProperty('--x-frame-ratio', config.ratio);
```

---

## Every class must have a rule

A class with no rule is dead weight — and when it is a `--modifier`, it is worse
than that: the state becomes **invisible**. `x-card--expanded` styling nothing
means an expanded card looks identical to a collapsed one. The behavior believes
it is communicating; the reader sees nothing.

Measured 2026-09-08: **130 classes are applied and styled by nothing.**

---

## How to find the classes for an element

1. **Derive them.** `<article>` auto-injects `card`, so the classes are
   `x-card`, `x-card__*`, `x-card--*`.
2. **Read the doc.** Each behavior doc carries a `## Classes` table listing every
   class it applies and whether a stylesheet defines it — generated from a real
   render (`data/default-gui-census.json`), so it cannot drift from the code.
3. **Decline it entirely** with `x-ignore`, if the behavior is not wanted:
   `<article x-ignore>`.
