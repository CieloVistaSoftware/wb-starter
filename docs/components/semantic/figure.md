# `<figure>` and `<figcaption>` Elements

The `<figure>` element represents self-contained content with an optional caption. In Web Behaviors (WB), it's used for images, videos, code snippets, and file previews.

## Semantic Meaning

- Self-contained content referenced from main flow
- Can be moved without affecting document flow
- Optional `<figcaption>` provides caption/label
- Can contain: images, videos, code, diagrams, charts

## WB Components Using `<figure>`

### 1. Card Image (`cardimage`)

```html
<article data-wb="cardimage" data-src="image.jpg" data-alt="Description">
  <figure class="wb-card__figure">
    <img src="image.jpg" alt="A beautiful sunset" class="wb-card__image">
    <figcaption class="wb-card__caption">
      Sunset over the Pacific Ocean
    </figcaption>
  </figure>
  <div class="wb-card__content">
    <h3 class="wb-card__title">Card Title</h3>
  </div>
</article>
```

### 2. Card Video (`cardvideo`)

```html
<article data-wb="cardvideo" data-src="video.mp4">
  <figure class="wb-card__figure">
    <video controls class="wb-card__video">
      <source src="video.mp4" type="video/mp4">
    </video>
    <figcaption class="wb-card__caption">
      Product Demo Video
    </figcaption>
  </figure>
</article>
```

### 3. Card File (`cardfile`)

```html
<article data-wb="cardfile" data-filename="report.pdf" data-type="pdf">
  <figure class="wb-card__file-preview">
    <div class="wb-card__file-icon" aria-hidden="true">📄</div>
    <figcaption class="wb-card__filename">
      report.pdf
      <span class="wb-card__file-meta">2.4 MB • PDF</span>
    </figcaption>
  </figure>
</article>
```

### 4. Card Product (`cardproduct`)

```html
<article data-wb="cardproduct" data-image="product.jpg">
  <figure class="wb-card__product-image">
    <img src="product.jpg" alt="Product Name">
    <span class="wb-card__badge">Sale</span>
  </figure>
  <div class="wb-card__product-info">
    <!-- Product details -->
  </div>
</article>
```

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `alt` on images | Descriptive text for screen readers |
| `<figcaption>` | Visible caption for all users |
| `aria-describedby` | Link figure to extended description |
| `role="group"` | Group figure with caption (implicit) |

## Example: Image Gallery with Figures

```html
<div class="gallery" role="group" aria-label="Photo Gallery">
  <figure class="wb-card__figure">
    <img src="photo1.jpg" alt="Mountain landscape at sunrise">
    <figcaption>
      <strong>Alpine Sunrise</strong>
      <span>Rocky Mountains, Colorado</span>
    </figcaption>
  </figure>
  
  <figure class="wb-card__figure">
    <img src="photo2.jpg" alt="Ocean waves crashing on rocks">
    <figcaption>
      <strong>Pacific Coast</strong>
      <span>Big Sur, California</span>
    </figcaption>
  </figure>
</div>
```

## CSS Styling

```css
figure.wb-card__figure {
  margin: 0; /* Reset browser default margin */
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

figure.wb-card__figure img,
figure.wb-card__figure video {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

figcaption {
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Overlay caption style */
figure.wb-card__figure--overlay figcaption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
}
```

## Best Practices

1. **Always include `alt`** - Describe the image content
2. **Use `<figcaption>` wisely** - For visible captions, not hidden descriptions
3. **Don't duplicate** - `alt` and `<figcaption>` should complement, not repeat
4. **Reset margins** - Browser default is often unwanted
5. **Aspect ratios** - Use CSS `aspect-ratio` for consistent sizing
