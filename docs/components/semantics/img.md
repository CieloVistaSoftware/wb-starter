# Image Component Design & User Guide

## 1. Design Philosophy

The `img` component is a utility wrapper for the `<img>` tag. It addresses common performance and UX issues associated with images on the web: layout shifts, slow loading, and lack of interactivity.

### Key Features
- **Lazy Loading**: Easy toggle for native lazy loading.
- **Aspect Ratio**: Prevents layout shifts (CLS) by enforcing dimensions.
- **Fallback Support**: Automatically swaps the source if the image fails to load.
- **Zoom/Lightbox**: Click-to-expand functionality.

## 2. User Guide

### Basic Usage
Add `data-wb="img"` to an `<img>` tag.

```html
<img data-wb="img" src="photo.jpg">
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-lazy` | Boolean | `false` | Enable lazy loading. |
| `data-zoomable` | Boolean | `false` | Enable click-to-zoom lightbox. |
| `data-aspect-ratio` | String | `''` | CSS aspect ratio (e.g., "16/9"). |
| `data-fallback` | String | `''` | URL of image to show on error. |

## 3. Examples

### Example 1: Performance Optimized
An image that loads lazily and reserves space to prevent layout shifts.

```html
<img 
  data-wb="img" 
  src="banner.jpg" 
  data-lazy="true" 
  data-aspect-ratio="16/9">
```

### Example 2: Robust Profile Picture
A user avatar with a fallback in case the link is broken.

```html
<img 
  data-wb="img" 
  src="user-123.jpg" 
  data-fallback="/assets/default-avatar.png" 
  alt="User Avatar">
```

## 4. Why It Works
The component sets the `loading="lazy"` attribute and applies `aspect-ratio` styles directly to the element. The fallback mechanism uses the native `onerror` event handler to swap the `src` attribute if the browser fails to load the initial image.
