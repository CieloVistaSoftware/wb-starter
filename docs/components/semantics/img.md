# Image - WB Framework v3.0

Enhanced image component with lazy loading, aspect ratio, and fallback support.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-img>` |
| Behavior | `img` |
| Semantic | `<img>` |
| Base Class | `wb-img` |
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

## Usage

### Custom Element

```html
<wb-img src="photo.jpg" alt="Photo description"></wb-img>
```

### Native Image (Enhanced)

```html
<img data-wb="img" src="photo.jpg" alt="Photo">
```

### Lazy Loading

```html
<wb-img src="large-image.jpg" lazy alt="Large photo"></wb-img>
```

### With Aspect Ratio

```html
<wb-img 
  src="banner.jpg" 
  aspectRatio="16/9" 
  alt="Banner">
</wb-img>
```

### Zoomable

```html
<wb-img src="artwork.jpg" zoomable alt="Click to zoom"></wb-img>
```

### With Fallback

```html
<wb-img 
  src="user-avatar.jpg" 
  fallback="/assets/default-avatar.png"
  alt="User avatar">
</wb-img>
```

### Object Fit

```html
<wb-img src="photo.jpg" fit="contain" alt="Photo"></wb-img>
<wb-img src="photo.jpg" fit="cover" alt="Photo"></wb-img>
```

## Generated Structure

```html
<div class="wb-img" style="aspect-ratio: 16/9">
  <img 
    class="wb-img__image"
    src="photo.jpg"
    alt="Description"
    loading="lazy">
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-img` | Always | Base styling |
| `.wb-img--lazy` | `lazy` | Lazy loading enabled |
| `.wb-img--zoomable` | `zoomable` | Click-to-zoom enabled |
| `.wb-img--loading` | Loading | Image loading |
| `.wb-img--loaded` | Loaded | Image loaded |
| `.wb-img--error` | Error | Failed to load |

## Methods

| Method | Description |
|--------|-------------|
| `zoom()` | Opens lightbox (if zoomable) |
| `load()` | Forces image load |

```javascript
const img = document.querySelector('wb-img');

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
| `--wb-img-radius` | `0` | Border radius |
| `--wb-img-bg` | `var(--bg-secondary)` | Placeholder background |
| `--wb-img-transition` | `opacity 0.3s ease` | Load transition |

## Accessibility

| Attribute | Value |
|-----------|-------|
| `alt` | Always required for meaningful images |
| `role` | `img` (implicit) |

Best practices:
- Always provide descriptive `alt` text
- Use empty `alt=""` for decorative images
- Use `aspectRatio` to prevent layout shifts
