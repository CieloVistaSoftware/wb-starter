# `<figure>` and `<figcaption>` Elements

The `<figure>` element represents self-contained content with an optional caption. In WB-Starter, it's used for images, videos, code snippets, and file previews.

## Semantic Meaning

- Self-contained content referenced from main flow
- Can be moved without affecting document flow
- Optional `<figcaption>` provides caption/label
- Can contain: images, videos, code, diagrams, charts

## WB Components Using `<figure>`

### 1. Card Image (`cardimage`)

`x-cardimage` builds its own `<figure><img></figure>` from `src`/`alt` —
hand-authored children are replaced, not merged. **Note:** it does not
support a caption; there's no `<figcaption>` in the rendered output. Use
`title`/`subtitle` (rendered in the card header) for a label instead.

<wb-demo>
<article
  x-cardimage
  src="https://picsum.photos/seed/sunset/400/225"
  alt="Sunset over the Pacific Ocean"
  title="Card Title">
</article>
</wb-demo>

### 2. Card Video (`cardvideo`)

Same pattern as `cardimage`: `x-cardvideo` builds its own `<figure><video></figure>`
from `src`/`poster`. **Note:** no `<figcaption>` support here either.

<wb-demo>
<article
  x-cardvideo
  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  title="Product Demo Video">
</article>
</wb-demo>

### 3. Card File (`cardfile`)

**Note:** `cardfile` does not use `<figure>`/`<figcaption>` at all — it
renders a plain icon `<span>` + `<h3 class="wb-card__filename">` instead.
Listed here only because it's the closest analog to a file-preview figure;
included for completeness, not as a `<figure>` usage example.

<wb-demo>
<article
  x-cardfile
  filename="report.pdf"
  type="pdf"
  size="2.4 MB">
</article>
</wb-demo>

### 4. Card Product (`cardproduct`)

`x-cardproduct` builds its own `<figure><img></figure>` from `image`.
**Note:** it reads a `badge` attribute but never renders it — currently dead
config, not a supported feature.

<wb-demo>
<article
  x-cardproduct
  image="https://picsum.photos/seed/product/400/267"
  title="Product Name"
  price="$49.99">
</article>
</wb-demo>

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `alt` on images | Descriptive text for screen readers |
| `<figcaption>` | Visible caption for all users |
| `aria-describedby` | Link figure to extended description |
| `role="group"` | Group figure with caption (implicit) |

## Example: Image Gallery with Figures

<wb-demo>
<div
  class="gallery"
  role="group"
  aria-label="Photo Gallery">
  <figure class="wb-card__figure">
    <img
      src="https://picsum.photos/seed/alpine/300/200"
      alt="Mountain landscape at sunrise">
    <figcaption>
      <strong>Alpine Sunrise</strong>
      <span>Rocky Mountains, Colorado</span>
    </figcaption>
  </figure>
  <figure class="wb-card__figure">
    <img
      src="https://picsum.photos/seed/coast/300/200"
      alt="Ocean waves crashing on rocks">
    <figcaption>
      <strong>Pacific Coast</strong>
      <span>Big Sur, California</span>
    </figcaption>
  </figure>
</div>
</wb-demo>

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
