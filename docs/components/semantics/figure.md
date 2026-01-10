# Figure Component Design & User Guide

## 1. Design Philosophy

The `figure` component upgrades the standard `<figure>` and `<figcaption>` elements into interactive media containers. It solves common needs like image zooming, lightboxes, and stylish caption overlays without requiring heavy external libraries.

### Key Features
- **Lightbox**: Built-in full-screen image viewer.
- **Lazy Loading**: Automatic `loading="lazy"` injection.
- **Caption Styles**: Options for standard or overlay captions.
- **Zoom Interaction**: Hover effects to indicate interactivity.

## 2. User Guide

### Basic Usage
The `figure` behavior is automatically injected into `<figure>` elements.

```html
<figure>
  <img src="image.jpg" alt="View">
  <figcaption>A beautiful view</figcaption>
</figure>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-lightbox` | Boolean | `false` | Enable click-to-expand lightbox. |
| `data-lazy` | Boolean | `false` | Enable lazy loading for the image. |
| `data-zoom` | Boolean | `false` | Enable hover zoom effect. |
| `data-caption-position` | String | `bottom` | Caption style: `bottom`, `overlay`. |

## 3. Examples

### Example 1: Interactive Gallery Item
An image that zooms on hover and opens in a lightbox.

```html
<figure 
  data-lightbox="true" 
  data-zoom="true">
  <img src="photo.jpg" alt="Photo">
  <figcaption>Click to expand</figcaption>
</figure>
```

### Example 2: Overlay Caption
A card-like figure with text overlay.

```html
<figure 
  data-caption-position="overlay">
  <img src="card-bg.jpg" alt="Background">
  <figcaption>Title Text</figcaption>
</figure>
```

## 4. Why It Works
The component attaches event listeners to the image for the lightbox functionality. When clicked, it creates a temporary overlay `div` with a cloned, high-resolution version of the image. The caption styling is handled via dynamic CSS injection, allowing for the "overlay" effect where the text sits on top of the image with a gradient background.
