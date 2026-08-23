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
| card | `<article>` | Default card |
| cardimage | `<article x-cardimage>` | Image card |
| cardvideo | `<article x-cardvideo>` | Video card |
| cardbutton | `<div x-cardbutton>` | Action buttons |
| cardhero | `<article x-cardhero>` | Hero banner |
| cardprofile | `<div x-cardprofile>` | User profile |
| cardtestimonial | `<div x-cardtestimonial>` | Testimonials |
| cardportfolio | `<div x-cardportfolio>` | Portfolio |
| cardpricing | `<div x-cardpricing>` | Pricing |
| cardproduct | `<div x-cardproduct>` | Products |
| cardfile | `<div x-cardfile>` | File downloads |
| cardlink | `<div x-cardlink>` | Link cards |
| cardhorizontal | `<div x-cardhorizontal>` | Horizontal layout |
| cardoverlay | `<div x-cardoverlay>` | Image overlays |
| carddraggable | `<div x-carddraggable>` | Draggable |
| cardexpandable | `<div x-cardexpandable>` | Expandable |
| cardminimizable | `<div x-cardminimizable>` | Minimizable |
| cardstats | `<articlestats>` | Statistics |

## Usage Examples

### Standard Semantic Article

**This is the actual selling point**: `autoInject` is **on by default**
site-wide (`src/core/config.js`) — a plain `<article>`, zero extra attributes,
zero `x-card`, gets real card behavior automatically. What you see rendered
below is exactly the markup above it, enhanced with nothing but semantic
HTML.

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

A page can still opt OUT via `WB.init({ autoInject: false })` if it genuinely
needs unenhanced semantic HTML (rare) — `x-card` below is the explicit form,
which works identically whether or not the page has opted out.

<wb-demo>
<article
  title="Card Title">
  Content here...
</article>
</wb-demo>

## Every Card Property, on a Plain `<article>`

An `<article>` enhanced into a card (via `autoInject` or explicit `x-card`)
gets the exact same properties as the `card` behavior itself -- there's no
reduced subset for the semantic form. See [Card](../cards/card.md) for the
full property reference; every one of them is demonstrated here directly on
`<article>`.

### title / subtitle / footer

<wb-demo>
<article
  title="Quarterly Report"
  subtitle="Q3 2026 summary"
  footer="Last updated: Today">
  <p>Revenue is up 12% quarter over quarter.</p>
</article>
</wb-demo>

### badge

<wb-demo>
<article
  title="New Feature"
  badge="NEW">
  <p>Badge text renders in the card header, next to the title.</p>
</article>
</wb-demo>

### elevated

<wb-demo>
<article
  title="Elevated Article"
  elevated>
  <p>Adds a drop shadow to separate this from surrounding content.</p>
</article>
</wb-demo>

### clickable

<wb-demo>
<article
  title="Click Me"
  clickable>
  <p>The whole article becomes a keyboard-focusable, clickable surface.</p>
</article>
</wb-demo>

### variant

<wb-demo>
<article
  title="Glass Variant"
  variant="glass">
  <p>Frosted glass effect with blur for layered content.</p>
</article>
</wb-demo>

### hoverable

`hoverable` defaults to `true`; setting it `false` opts an article out of the
default hover effect:

<wb-demo>
<article
  title="No Hover Effect"
  hoverable="false">
  <p>This article doesn't respond to hover.</p>
</article>
</wb-demo>

### tooltip

<wb-demo>
<article
  title="Hover for Detail"
  tooltip="Extra context shown on hover, themed, not the native title tooltip">
  <p>Hover this article to see a themed WB tooltip.</p>
</article>
</wb-demo>

### With Every Option Combined

<wb-demo>
<article
  title="Featured Article"
  subtitle="A brief description"
  badge="FEATURED"
  footer="Last updated: Today"
  elevated
  clickable
  variant="glass"
  tooltip="Every card property, on a plain article">
  <p>Review the latest release notes and open the project workspace.</p>
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
