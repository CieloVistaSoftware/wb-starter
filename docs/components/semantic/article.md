# Article Element - wb-starter v3.0

The `<article>` element is the semantic foundation for all card components.

## Overview

An article represents a **self-contained composition** that could be distributed independently. It's the preferred container for cards, posts, comments, and widgets.

## When to Use

Use `<article>` when content:

- Makes sense on its own without surrounding context
- Could be syndicated (RSS feed, social media)
- Represents a complete, independent piece of content

### Good Examples
- Blog posts, news articles, product cards
- User comments, forum posts, social media posts
- Profile cards, widgets

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

## Web Behaviors (WB) Components Using Article

All card components use the `<article>` semantic element:

| Component | Custom Tag | Usage |
|-----------|------------|-------|
| card | `<wb-card>` | Base card |
| cardimage | `<wb-cardimage>` | Image card |
| cardvideo | `<wb-cardvideo>` | Video card |
| cardbutton | `<wb-cardbutton>` | Action buttons |
| cardhero | `<wb-cardhero>` | Hero banner |
| cardprofile | `<wb-cardprofile>` | User profile |
| cardtestimonial | `<wb-cardtestimonial>` | Testimonials |
| cardportfolio | `<wb-cardportfolio>` | Portfolio |
| cardpricing | `<wb-cardpricing>` | Pricing |
| cardproduct | `<wb-cardproduct>` | Products |
| cardfile | `<wb-cardfile>` | File downloads |
| cardlink | `<wb-cardlink>` | Link cards |
| cardhorizontal | `<wb-cardhorizontal>` | Horizontal layout |
| cardoverlay | `<wb-cardoverlay>` | Image overlays |
| carddraggable | `<wb-carddraggable>` | Draggable |
| cardexpandable | `<wb-cardexpandable>` | Expandable |
| cardminimizable | `<wb-cardminimizable>` | Minimizable |
| cardstats | `<wb-cardstats>` | Statistics |

## Usage Examples

### Standard Semantic Article
```html
<article>
  <header>
    <h2>Article Title</h2>
  </header>
  <main>
    <p>Content goes here...</p>
  </main>
  <footer>
    <time datetime="2024-12-18">December 18, 2024</time>
  </footer>
</article>
```

### WB Card (Custom Element)
```html
<wb-card title="Card Title" subtitle="Subtitle">
  Main content goes here...
</wb-card>
```

### WB Card (Data Attributes)
```html
<article data-wb="card" data-wb-title="Card Title">
  Content here...
</article>
```

## Inheritance Chain

```
<article> (HTML5 semantic)
    ↓
cardBase (WB base)
    ↓
card (WB component)
    ↓
card variants
```

## Accessibility

| Attribute | Value | Purpose |
|-----------|-------|---------|
| Role | `article` (implicit) | Landmark for assistive technology |
| Labelled by | Heading in header | Screen readers announce title |

### Requirements
1. Should contain a heading (`<h1>`-`<h6>`)
2. Heading level appropriate to document outline
3. Content understandable when extracted from context

## Related

- [Cards Overview](../cards/cards.index.md)
- [Figure Element](./figure.md)
