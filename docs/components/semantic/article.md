# Article Element

The `<article>` element is the semantic foundation for all card components in the Web Behaviors (WB) library.

## Overview

An article represents a **self-contained composition** that could be distributed independently. It's the preferred container for cards, posts, comments, and widgets.

## When to Use

Use `<article>` when content:

- Makes sense on its own without surrounding context
- Could be syndicated (RSS feed, social media)
- Represents a complete, independent piece of content

### Good Examples

- Blog posts
- News articles
- Product cards
- User comments
- Forum posts
- Social media posts
- Profile cards

### Avoid Using For

- Navigation sections (use `<nav>`)
- Sidebars (use `<aside>`)
- Generic containers (use `<div>`)

## Structure

```html
<article>
  <header>
    <!-- Title, subtitle, metadata -->
  </header>
  <main>
    <!-- Primary content -->
  </main>
  <footer>
    <!-- Actions, author, timestamp -->
  </footer>
</article>
```

### Children

| Element | Purpose | Required |
|---------|---------|----------|
| `<header>` | Title, subtitle, metadata | No |
| `<main>` | Primary content area | No |
| `<footer>` | Actions, author info, timestamps | No |
| `<section>` | Content sections within article | No |
| `<aside>` | Related but separate content | No |
| `<figure>` | Images, diagrams with captions | No |

## Accessibility

| Attribute | Value | Purpose |
|-----------|-------|---------|
| Role | `article` (implicit) | Landmark role for assistive technology |
| Labelled by | Heading in header | Screen readers announce the article title |

### Requirements

1. Should contain a heading (`<h1>`-`<h6>`) in the header
2. Heading level should be appropriate to document outline
3. Content should be understandable when extracted from page context

## WB Components That Extend Article

All card components inherit from the article semantic element.

### AutoInject Behavior

With `autoInject: true`, the `<article>` element has **conditional auto-injection**:

| Condition | Behavior Applied | Notes |
|-----------|------------------|-------|
| `<article>` | None | Plain semantic article |
| `<article data-href="...">` | `cardlink` | Clickable link card |

This safe approach preserves semantic purity:
- Plain `<article>` elements remain standard HTML
- Only `<article data-href>` becomes a clickable card

```html
<!-- Plain article - no behavior injected -->
<article>
  <h2>Blog Post Title</h2>
  <p>Content...</p>
</article>

<!-- AutoInject: becomes cardlink -->
<article data-href="/demos/kitchen-sink.html" data-title="Kitchen Sink" data-badge="NEW">
</article>
```

### Explicit Card Assignment

To apply card styling and behavior explicitly, add the `data-wb="card"` attribute:

| Component | Purpose |
|-----------|---------|
| `card` | Base card with header/main/footer |
| `cardimage` | Card with featured image |
| `cardvideo` | Card with embedded video |
| `cardbutton` | Card with action buttons |
| `cardhero` | Hero banner card |
| `cardprofile` | User profile card |
| `cardtestimonial` | Quote/testimonial card |
| `cardportfolio` | Portfolio item card |
| `cardpricing` | Pricing tier card |
| `cardproduct` | E-commerce product card |
| `cardfile` | File/document card |
| `cardlink` | Clickable link card |
| `cardhorizontal` | Horizontal layout card |
| `cardoverlay` | Image with text overlay |
| `carddraggable` | Draggable card |
| `cardexpandable` | Expandable/collapsible card |
| `cardminimizable` | Minimizable card |
| `cardstats` | Statistics display card |

## Inheritance Chain

```
article (HTML5 semantic element)
    ↓
card.base (WB base schema)
    ↓
card (WB component)
    ↓
card variants (cardimage, cardprofile, etc.)
```

## Example

```html
<!-- 1. Standard Semantic Article (No Styling) -->
<article>
  <header>
    <h2>Article Title</h2>
    <p>Subtitle or description</p>
  </header>
  <main>
    <p>Main content goes here...</p>
  </main>
  <footer>
    <time datetime="2024-12-18">December 18, 2024</time>
  </footer>
</article>

<!-- 2. Enhanced Semantic Card (Preserves Structure) -->
<article data-wb="card">
  <header>
    <h2>Card Title</h2>
  </header>
  <main>
    <p>This article is now styled as a card.</p>
  </main>
  <footer>
    <button>Action</button>
  </footer>
</article>

<!-- 3. Config-Driven Card (Generates Structure) -->
<article data-wb="card" data-title="Card Title" data-subtitle="Subtitle">
  Main content goes here...
</article>
```

## Related

- [Card Base](../cards/index.md) - Base card component
- [Header Element](./header.md) - Semantic header
- [Footer Element](./footer.md) - Semantic footer
- [Figure Element](./figure.md) - Semantic figure
