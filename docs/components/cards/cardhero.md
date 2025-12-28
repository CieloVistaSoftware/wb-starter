# Card Hero

A hero banner card with a full-bleed background image. Ideal for featured content, call-to-action sections, and visual impact.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardhero` |
| Semantic | `<article>` |
| Base Class | `wb-card` |
| Category | Cards |
| Icon | 🦸 |

## Inheritance

```
article (semantic) → card.base → cardhero
```

Card Hero **IS-A** card, inheriting semantic structure.
Card Hero **HAS-A** background image as CSS property.

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `"Hero Title"` | Hero title text |
| `subtitle` | string | `""` | Subtitle below title |
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Hero Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `background` | string | **required** | Background image URL |
| `height` | string | `"300px"` | Card height |
| `overlay` | boolean | `true` | Show gradient overlay for readability |
| `align` | enum | `"center"` | Content alignment |

### Alignment Options

| Value | Description |
|-------|-------------|
| `left` | Left-aligned content |
| `center` | Centered content (default) |
| `right` | Right-aligned content |

## Usage

### Basic Hero

```html
<article data-wb="cardhero" 
         data-background="hero.jpg" 
         data-title="Welcome">
</article>
```

### Hero with Subtitle

```html
<article data-wb="cardhero"
         data-background="hero.jpg"
         data-title="Welcome to Our Site"
         data-subtitle="Discover amazing things">
</article>
```

### Tall Hero

```html
<article data-wb="cardhero"
         data-background="hero.jpg"
         data-title="Big Impact"
         data-height="500px">
</article>
```

### Left-Aligned Hero

```html
<article data-wb="cardhero"
         data-background="hero.jpg"
         data-title="Our Story"
         data-subtitle="Since 2020"
         data-align="left">
</article>
```

### No Overlay (High Contrast Image)

```html
<article data-wb="cardhero"
         data-background="dark-image.jpg"
         data-title="Clear Text"
         data-overlay="false">
</article>
```

## Structure

```html
<article class="wb-card wb-card--hero"
         style="background-image: url(hero.jpg);
                background-size: cover;
                background-position: center;
                height: 300px;">
  
  <!-- Gradient overlay for text readability -->
  <div class="wb-card__overlay"></div>
  
  <!-- Content centered over image -->
  <header class="wb-card__header" style="text-align: center;">
    <h3 class="wb-card__title">Hero Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
  </header>
</article>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card` | Base card styling |
| `.wb-card--hero` | Hero variant styling |
| `.wb-card__overlay` | Gradient overlay |
| `.wb-card__header` | Content container |

## Styling

### Background Properties

| CSS Property | Value |
|--------------|-------|
| `background-size` | `cover` |
| `background-position` | `center` |
| `background-repeat` | `no-repeat` |

### Overlay Gradient

When `overlay="true"` (default):

```css
.wb-card__overlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.7)
  );
}
```

### Text Styling

Hero text is styled for visibility over images:

```css
.wb-card--hero .wb-card__title {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Background image | Decorative, not in `<img>` tag |
| Text contrast | Overlay ensures WCAG AA compliance |
| Heading | H3 for proper document outline |

### Contrast Requirements

The overlay ensures text meets WCAG contrast requirements:

- Normal text: 4.5:1 ratio
- Large text (18px+): 3:1 ratio

## Builder Integration

### Sidebar

```
📁 Cards
└── 🦸 Card Hero
```

### Property Panel

| Group | Properties |
|-------|------------|
| Background | background, height, overlay |
| Content | title, subtitle |
| Layout | align |
| Style | elevated |

### Defaults

```json
{
  "background": "",
  "title": "Hero Title",
  "subtitle": "",
  "height": "300px",
  "overlay": true,
  "align": "center"
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `background="bg.jpg" title="Hero"` | Background image with title |
| `background="bg.jpg" title="H" subtitle="S"` | Title and subtitle |
| `background="bg.jpg" title="H" height="400px"` | Custom height |
| `background="bg.jpg" title="H" align="left"` | Left-aligned content |
| `background="bg.jpg" title="H" overlay="false"` | No gradient overlay |

## Examples

### Landing Page Hero

```html
<article data-wb="cardhero"
         data-background="https://picsum.photos/1200/600"
         data-title="Build Amazing Websites"
         data-subtitle="No coding required"
         data-height="400px"
         data-align="center">
</article>
```

### Feature Section

```html
<article data-wb="cardhero"
         data-background="feature-bg.jpg"
         data-title="Premium Features"
         data-subtitle="Everything you need to succeed"
         data-height="250px"
         data-align="left">
</article>
```

### Call to Action

```html
<article data-wb="cardhero"
         data-background="cta-bg.jpg"
         data-title="Get Started Today"
         data-subtitle="Join thousands of happy users"
         data-height="300px"
         data-elevated="true">
</article>
```

### Minimal Hero (No Overlay)

```html
<article data-wb="cardhero"
         data-background="dark-bg.jpg"
         data-title="Clean Design"
         data-overlay="false"
         data-height="350px">
</article>
```

## Best Practices

### Image Selection

1. Use high-resolution images (at least 1200px wide)
2. Choose images with areas of consistent color for text placement
3. Consider how image will crop at different viewport sizes

### Text Readability

1. Keep overlay enabled for most images
2. Use short, impactful titles
3. Avoid long subtitles that may wrap awkwardly

### Performance

1. Optimize images before use
2. Use appropriate image formats (WebP, JPEG)
3. Consider lazy loading for below-fold heroes

## Related

- [Card](./card.md) - Base card component
- [Card Image](./cardimage.md) - Image in card (not background)
- [Card Overlay](./cardoverlay.md) - Alternative overlay style
