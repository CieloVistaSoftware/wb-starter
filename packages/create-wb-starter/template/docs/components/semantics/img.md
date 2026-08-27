# Image - wb-starter v3.0

Enhanced image behavior with lazy loading, aspect ratio, and fallback support.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<img>` |
| Behavior | `img` |
| Semantic | `<img>` |
| Root CSS Class | `x-img` |
| Category | Media |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | Required | Image source URL |
| `alt` | string | `""` | Alt text for accessibility |
| `lazy` | boolean | `false` | Enable lazy loading |
| `zoomable` | boolean | `false` | Enable click-to-zoom lightbox |
| `aspectRatio` | string | `""` | CSS aspect ratio (e.g., "16/9") |
| `fallback` | string | `""` | URL of fallback image on error |
| `fit` | string | `"cover"` | Object-fit: `cover`, `contain`, `fill` |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<img
  src="https://placehold.co/600x400/1e293b/e2e8f0?text=Photo"
  alt="Photo">
</div>

## Usage

### Custom Element

```html
<img
  src="https://picsum.photos/seed/photo/600/400"
  alt="Photo description">
</img>
```

### Native Image (Enhanced)

```html
<img
  src="https://picsum.photos/seed/photo/600/400"
  alt="Photo">
```

### Lazy Loading

```html
<img
  src="https://picsum.photos/seed/large-image/600/400"
  lazy
  alt="Large photo">
</img>
```

### With Aspect Ratio

```html
<img
  src="https://picsum.photos/seed/banner/600/400"
  aspectRatio="16/9"
  alt="Banner">
</img>
```

### Zoomable

```html
<img
  src="https://picsum.photos/seed/artwork/600/400"
  zoomable
  alt="Click to zoom">
</img>
```

### With Fallback

```html
<img
  src="https://picsum.photos/seed/user-avatar/600/400"
  fallback="https://picsum.photos/seed/default-avatar/200/200"
  alt="User avatar">
</img>
```

### Object Fit

```html
<img
  src="https://picsum.photos/seed/photo/600/400"
  fit="contain"
  alt="Photo">
</img>
<img
  src="https://picsum.photos/seed/photo/600/400"
  fit="cover"
  alt="Photo">
</img>
```

## Generated Structure

```html
<div
  class="x-img"
  style="aspect-ratio: 16/9">
  <img
    class="x-img__image"
    src="https://picsum.photos/seed/photo/600/400"
    alt="Description"
    loading="lazy">
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-img` | Always | Base styling |
| `.x-img--lazy` | `lazy` | Lazy loading enabled |
| `.x-img--zoomable` | `zoomable` | Click-to-zoom enabled |
| `.x-img--loading` | Loading | Image loading |
| `.x-img--loaded` | Loaded | Image loaded |
| `.x-img--error` | Error | Failed to load |

## Methods

| Method | Description |
|--------|-------------|
| `zoom()` | Opens lightbox (if zoomable) |
| `load()` | Forces image load |

```javascript
const img = document.querySelector('x-img');

// Open lightbox
img.zoom();
```

## Events

| Event | Description |
|-------|-------------|
| `load` | Image loaded successfully |
| `error` | Image failed to load |
| `wb:img:zoom` | Lightbox opened |

```javascript
img.addEventListener('load', () => {
  console.log('Image loaded');
});

img.addEventListener('error', () => {
  console.log('Image failed to load');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-img-radius` | `0` | Border radius |
| `--x-img-bg` | `var(--bg-secondary)` | Placeholder background |
| `--x-img-transition` | `opacity 0.3s ease` | Load transition |

## Accessibility

| Attribute | Value |
|-----------|-------|
| `alt` | Always required for meaningful images |
| `role` | `img` (implicit) |

Best practices:
- Always provide descriptive `alt` text
- Use empty `alt=""` for decorative images
- Use `aspectRatio` to prevent layout shifts
