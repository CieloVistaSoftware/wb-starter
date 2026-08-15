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

## WB-Starter Components Using Article

All card components use the `<article>` semantic element:

| Component | Custom Tag | Usage |
|-----------|------------|-------|
| card | `<wb-card>` | Default card |
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

This page's doc-viewer runs with `autoInject` **off** (the site-wide default —
see `src/core/config.js`), so this plain `<article>` renders exactly as
written, unenhanced. It's shown first specifically so you can see the
difference against the enhanced version right below it.

<wb-demo>
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
</wb-demo>

**"Automatic" specifically means**: on a page that calls
`WB.init({ autoInject: true })`, this exact same plain `<article>` markup —
zero extra attributes — gets card behavior applied with no `x-card` needed at
all. That mode can't be demonstrated live here (this viewer intentionally
keeps autoInject off so *other* elements on the page aren't unexpectedly
enhanced) — see it running for real on
[demos/autoinject.html](../../../demos/autoinject.html). The `x-card` example
below is the explicit, opt-in equivalent that works regardless of the page's
autoInject setting.

### WB Card (Custom Element)
<wb-demo>
<wb-card
  title="Card Title"
  subtitle="Subtitle">
  Main content goes here...
</wb-card>
</wb-demo>

### WB Card (Data Attributes)
<wb-demo>
<article
  x-card
  title="Card Title">
  Content here...
</article>
</wb-demo>

## Composition

Card variants compose, rather than inherit, their structure:

```
<article> (HTML5 semantic element)
    +
card behavior (adds header/main/footer structure)
    +
variant-specific behavior and markup
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
