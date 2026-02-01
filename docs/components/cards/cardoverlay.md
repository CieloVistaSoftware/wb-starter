# Card Overlay - wb-starter v3.0

Image card with text overlay.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardoverlay>` |
| Behavior | `cardoverlay` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card-overlay` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | `""` | Background image URL |
| `position` | string | `"bottom"` | Text position: `top`, `center`, `bottom` |
| `gradient` | boolean | `true` | Show gradient overlay for readability |
| `height` | string | `"300px"` | Card height |

## Usage

### Basic Overlay

```html
<wb-cardoverlay 
  title="Featured Story"
  subtitle="Read more about this"
  image="/images/background.jpg">
</wb-cardoverlay>
```

### Top Position

```html
<wb-cardoverlay 
  title="Top Overlay"
  image="/images/bg.jpg"
  position="top">
</wb-cardoverlay>
```

### Center Position

```html
<wb-cardoverlay 
  title="Centered"
  subtitle="Text in the middle"
  image="/images/bg.jpg"
  position="center">
</wb-cardoverlay>
```

### No Gradient

```html
<wb-cardoverlay 
  title="No Gradient"
  image="/images/light-bg.jpg"
  gradient="false">
</wb-cardoverlay>
```

### Custom Height

```html
<wb-cardoverlay 
  title="Tall Card"
  image="/images/bg.jpg"
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
