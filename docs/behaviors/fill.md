# fill — as wide as the container allows

`x-fill` makes an element take all the width its container will give it.

```html
<div x-fill>I am as wide as my parent allows</div>
```

## Why this is not just `width: 100%`

"As wide as possible" depends on the layout the element lands in, and `width` is
the wrong property in three of the four common cases:

| Parent layout | What actually controls width | `width: 100%` alone |
|---|---|---|
| block | `width` + `box-sizing` | works, but overflows if padding/border are added |
| flex | `flex-basis` / `flex-grow` | loses to `flex-shrink` and to a sibling's `flex-grow` |
| grid | `justify-self`, column span | fills one track, not the row |
| inline element | nothing — `width` does not apply | does nothing at all |

`fill` reads the parent's computed `display` at upgrade time and applies the
property that governs width *there*. That has to happen at runtime: an element
cannot know from its own markup what kind of parent it is in.

## Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `ignore-max-width` | boolean | `false` | Also clear an inherited `max-width`. |

`max-width` is respected by default. A cap from a variant class or a design
token is usually somebody's deliberate decision, and "as wide as possible" still
means "as wide as you are *allowed* to be". Use `ignore-max-width` when the cap
is the thing in your way.

```html
<article x-fill ignore-max-width>Edge to edge, cap and all</article>
```

## What it sets

One class always, plus exactly one layout modifier:

| Class | When | Effect |
|---|---|---|
| `wb-fill` | always | `box-sizing: border-box`, `margin-inline: 0` |
| `wb-fill--block` | parent is a block container | `display: block; width: 100%` |
| `wb-fill--flex` | parent is `flex` / `inline-flex` | `flex: 1 1 0%; min-width: 0` |
| `wb-fill--grid` | parent is `grid` / `inline-grid` | `justify-self: stretch; grid-column: 1 / -1` |
| `wb-fill--ignore-max` | `ignore-max-width` is set | `max-width: none` |

`margin-inline: 0` is part of the base class on purpose: an element's own
margins eat into the space it is trying to fill, and a centring `margin: 0 auto`
is the usual reason a "filled" element still shows a gap.

`min-width: 0` appears on the flex and grid modifiers because the default
(`auto`) refuses to shrink below content size — one long unbroken word would
otherwise push the element wider than the container it is meant to fit.

## Notes

There is no semantic tag for this behavior, and that is deliberate: width is a
layout decision, not something an element *is*. Auto-injection maps tags to what
they mean, so `fill` is attribute-only.

Filed as [#764](https://github.com/CieloVistaSoftware/wb-starter/issues/764).
