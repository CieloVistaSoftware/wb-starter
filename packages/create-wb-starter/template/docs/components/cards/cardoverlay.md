# Card Overlay - wb-starter v3.0

Image card with text overlay.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardoverlay>` |
| Behavior | `cardoverlay` |
| Semantic | `<article>` |
| Root CSS Class | `x-card x-card-overlay` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | `""` | Background image URL |
| `position` | string | `"bottom"` | Text position: `top`, `center`, `bottom` |
| `gradient` | boolean | `true` | Show gradient overlay for readability |
| `height` | string | `"300px"` | Card height |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-cardoverlay
  title="Featured Story"
  subtitle="Read more about this"
  image="https://picsum.photos/seed/cardoverlay-basic/1000/800">
</div>
</div>

## Usage

### Basic Overlay

```html
<div x-cardoverlay
  title="Featured Story"
  subtitle="Read more about this"
  image="https://picsum.photos/seed/cardoverlay-usage/1000/800">
</div>
```

### Top Position

```html
<div x-cardoverlay
  title="Top Overlay"
  image="https://picsum.photos/seed/cardoverlay-top/1000/800"
  position="top">
</div>
```

### Center Position

```html
<div x-cardoverlay
  title="Centered"
  subtitle="Text in the middle"
  image="https://picsum.photos/seed/cardoverlay-center/1000/800"
  position="center">
</div>
```

### No Gradient

```html
<div x-cardoverlay
  title="No Gradient"
  image="https://picsum.photos/seed/cardoverlay-nogradient/1000/800"
  gradient="false">
</div>
```

### Custom Height

```html
<div x-cardoverlay
  title="Tall Card"
  image="https://picsum.photos/seed/cardoverlay-tall/1000/800"
  height="500px">
</div>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.x-card--overlay-card` | Base overlay styling |
| `.x-card--overlay-top` | Top position |
| `.x-card--overlay-center` | Center position |
| `.x-card--overlay-bottom` | Bottom position |

## Schema

Location: `src/wb-models/cardoverlay.schema.json`
