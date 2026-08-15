# Card Overlay - wb-starter v3.0

Image card with text overlay.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardoverlay>` |
| Behavior | `cardoverlay` |
| Semantic | `<article>` |
| Root CSS Class | `wb-card wb-card-overlay` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | `""` | Background image URL |
| `position` | string | `"bottom"` | Text position: `top`, `center`, `bottom` |
| `gradient` | boolean | `true` | Show gradient overlay for readability |
| `height` | string | `"300px"` | Card height |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardoverlay
  title="Featured Story"
  subtitle="Read more about this"
  image="https://picsum.photos/seed/cardoverlay-basic/1000/800">
</wb-cardoverlay>
</wb-demo>

## Usage

### Basic Overlay

```html
<wb-cardoverlay
  title="Featured Story"
  subtitle="Read more about this"
  image="https://picsum.photos/seed/cardoverlay-usage/1000/800">
</wb-cardoverlay>
```

### Top Position

```html
<wb-cardoverlay
  title="Top Overlay"
  image="https://picsum.photos/seed/cardoverlay-top/1000/800"
  position="top">
</wb-cardoverlay>
```

### Center Position

```html
<wb-cardoverlay
  title="Centered"
  subtitle="Text in the middle"
  image="https://picsum.photos/seed/cardoverlay-center/1000/800"
  position="center">
</wb-cardoverlay>
```

### No Gradient

```html
<wb-cardoverlay
  title="No Gradient"
  image="https://picsum.photos/seed/cardoverlay-nogradient/1000/800"
  gradient="false">
</wb-cardoverlay>
```

### Custom Height

```html
<wb-cardoverlay
  title="Tall Card"
  image="https://picsum.photos/seed/cardoverlay-tall/1000/800"
  height="500px">
</wb-cardoverlay>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card--overlay-card` | Base overlay styling |
| `.wb-card--overlay-top` | Top position |
| `.wb-card--overlay-center` | Center position |
| `.wb-card--overlay-bottom` | Bottom position |

## Schema

Location: `src/wb-models/cardoverlay.schema.json`
