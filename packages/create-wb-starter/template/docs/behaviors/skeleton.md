# skeleton

A shimmering placeholder block for loading states — a single line, multiple
stacked lines, a circle, or a rectangle. Implemented by `skeleton()` in
[src/wb-viewmodels/feedback.js](../../src/wb-viewmodels/feedback.js).

## Overview

| Property | Value |
|----------|-------|
| Attribute | `x-skeleton` |
| Custom Tag | `<div x-skeleton>` |
| Behavior function | `skeleton()` — `src/wb-viewmodels/feedback.js` |
| Semantic element | `<div role="status">` |
| Root CSS Class | none added by JS — `skeleton.css` styles the `x-skeleton` **tag** directly, so `x-skeleton` on any other element gets no shimmer styling from the base rule (only the `.x-skeleton--{variant}` modifier class is added) |
| Category | Feedback |
| Schema | [skeleton.schema.json](../../src/wb-models/skeleton.schema.json) — declares an `animated` property the JS never reads; the shimmer animation always runs, it isn't toggleable |

## Properties

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | string | `"text"` | `text`, `circle`, `rect` (schema also lists `card`, but no CSS rule styles that value differently from the default block) |
| `lines` | number | `1` | For `variant="text"` only — when greater than 1, replaces the block with that many stacked `<span>` line placeholders (the last one rendered narrower for realism) |
| `width` | string (CSS value) | none | Applied as inline `element.style.width` |
| `height` | string (CSS value) | none | Applied as inline `element.style.height` |

## Usage

### Single line

<div x-demo>
<div x-skeleton variant="text"></div>
</div>

### Multiple lines

<div x-demo>
<div x-skeleton variant="text" lines="3"></div>
</div>

### Circle (e.g. an avatar placeholder)

<div x-demo>
<div x-skeleton variant="circle" width="48px" height="48px"></div>
</div>

### Rectangle (e.g. an image placeholder)

<div x-demo>
<div x-skeleton variant="rect" height="150px"></div>
</div>

> `x-skeleton` on a non-`<div x-skeleton>` element still runs `skeleton()`, but only
> gets the `.x-skeleton--{variant}` modifier class — the shimmer gradient and
> sizing come from `skeleton.css`'s `x-skeleton { ... }` **tag** selector, which
> a different tag never matches. Use the `<div x-skeleton>` custom tag to get the
> full visual, not `x-skeleton` on an arbitrary element.

## CSS Classes

| Class | Applied when | Description |
|-------|--------------|-------------|
| `x-skeleton` (tag selector, not a class) | the host is a literal `<div x-skeleton>` | Base shimmering block: gradient background, `1rem` height, animated |
| `.x-skeleton--{variant}` | Always | `text`/`circle`/`rect` modifier |
| `x-skeleton[variant="circle"]` | `variant="circle"` | 1:1 aspect ratio, fully rounded |
| `x-skeleton[variant="rect"]` | `variant="rect"` | Sharp-ish corners (`4px` radius), height comes from the `height` attribute |
| `x-skeleton > span` | `variant="text"` and `lines > 1` | Each stacked line gets its own shimmer; the last line is narrower (`60%` width) |

## Events

`skeleton()` does not dispatch any custom events.

- [Demo](../../demos/site/feedback.html#skeleton-skeleton)
- [Schema](../../src/wb-models/skeleton.schema.json)
