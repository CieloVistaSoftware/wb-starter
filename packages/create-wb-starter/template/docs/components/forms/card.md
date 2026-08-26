# Card - wb-starter v3.0

Content container composing a header (title/subtitle/badge), main body, and footer -- with variant, size, elevation, hover, and clickable styles. Base for the whole card family (`x-cardimage`, `x-cardhero`, `x-cardprofile`, `x-cardpricing`, and more).

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<article>` |
| Behavior | `card` (`composeCard()`) |
| Semantic | `<article>` |
| Root CSS Class | `x-card` |
| Category | Forms / Cards |
| Schema | `src/wb-models/card.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Title shown in the header |
| `subtitle` | string | `""` | Subtitle shown below the title |
| `footer` | string | `""` | Footer text |
| `badge` | string | `""` | Badge text shown in the header |
| `variant` | string | `"default"` | `default`, `glass`, `bordered`, `flat`, `minimal`, `elevated`, `rack` |
| `size` | string | `"auto"` | `xs`, `sm`, `md`, `lg`, `xl`, `full`, `auto` -- controls max/min width |
| `elevated` | boolean | `false` | Adds a drop shadow and a lighter background |
| `hoverable` | boolean | `true` (unless explicitly `"false"`) | Lift + shadow + accent border on hover |
| `clickable` | boolean | `false` | Makes the whole card focusable/clickable, toggles `.x-card--active` |
| `tooltip` / `hover-text` | string | `""` | Hover text shown as a themed WB tooltip (`tooltip` takes priority if both are set) |

## Usage

### Custom Element

<div x-demo>
<article title="Card Title" subtitle="A short subtitle">
  Card body content goes here.
</article>
</div>

### Variants

```html
<article variant="default" title="Default">Standard surface</article>
<article variant="glass" title="Glass">Translucent, blurred surface</article>
<article variant="bordered" title="Bordered">Border-forward, flat surface</article>
<article variant="flat" title="Flat">No border, no shadow</article>
```

### With Footer and Badge

```html
<article title="Release Notes" subtitle="v3.0" badge="New" footer="Updated today">
  Composition over inheritance, everywhere.
</article>
```

### Elevated and Clickable

```html
<article title="Elevated" elevated>Lifted with a stronger shadow.</article>
<article title="Clickable" clickable>Click or press Enter/Space to activate.</article>
```

### Sizes

```html
<article title="Small" size="sm">Compact width</article>
<article title="Large" size="lg">Wider layout</article>
```

### Semantic Structure (Enhanced)

```html
<!-- header/main/footer children are enhanced in place, not rebuilt -->
<article>
  <header><h3>Explicit Header</h3></header>
  <main>Explicit main content.</main>
  <footer>Explicit footer.</footer>
</article>
```

## Generated Structure

```html
<article class="x-card--glass x-card--hoverable">
  <header class="x-card__header">
    <div class="x-card__header-content">
      <h3 class="x-card__title">Card Title</h3>
      <div class="x-card__subtitle">A short subtitle</div>
    </div>
    <span class="x-card__badge">New</span>
  </header>
  <main class="x-card__main">Card body content goes here.</main>
  <footer class="x-card__footer">Updated today</footer>
</article>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `x-card` (tag selector) / `.x-card` | Always | Base surface, border-radius, flex column layout |
| `.x-card--{glass,bordered,flat,minimal,elevated,rack}` | `variant` (non-`default`) | Variant surface treatment |
| `.x-card--{xs,sm,md,lg,xl,full,auto}` | `size` | Width scale |
| `.x-card--elevated` | `elevated` | Drop shadow + lighter background |
| `.x-card--hoverable` | `hoverable` (default) | Lift/shadow/border-color on `:hover` |
| `.x-card--clickable` | `clickable` | Pointer cursor, `tabindex="0"`, `role="button"` |
| `.x-card--active` | Toggled on each click while `clickable` | Active/pressed state |
| `.x-card__header` / `.x-card__header-content` | Title/subtitle/badge present, or an explicit `<header>` | Header row |
| `.x-card__title` / `.x-card__subtitle` | `title` / `subtitle` | Heading text |
| `.x-card__badge` | `badge` | Badge pill in the header |
| `.x-card__main` | Body content present | Main content area |
| `.x-card__footer` | `footer` present, or an explicit `<footer>` | Footer row |

## Methods

`card()`/`composeCard()` (`src/wb-viewmodels/card.js`) build and enhance the DOM directly; they do not implement the methods below themselves. These come from `card.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`). `show`/`hide`/`toggle`/`update` resolve to the schema builder's real generic implementation.

| Method | Description |
|--------|-------------|
| `show()` | Shows the card (`element.hidden = false`) |
| `hide()` | Hides the card (`element.hidden = true`) |
| `toggle()` | Toggles between `show()`/`hide()` |
| `update(options)` | Re-applies schema data and rebuilds structure (generic `update`) |

```javascript
const card = document.querySelector('x-card');

card.hide();
card.show();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `click` (native) | Fired on activation when `clickable` -- also toggles `.x-card--active` | -- |
| `wb:show` / `wb:hide` / `wb:update` | Fired by the generic `show()`/`hide()`/`update()` methods above | varies |

```javascript
card.addEventListener('click', () => {
  console.log('Card active:', card.classList.contains('x-card--active'));
});
```

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--bg-secondary` | Default surface background | Falls back to `#1f2937` |
| `--border-color` | Default surface border | Falls back to `#374151` |
| `--radius-lg` | Border radius | Falls back to `8px` |
| `--bg-elevated` | `elevated` background | Falls back to `--bg-secondary` |
| `--shadow-elevated` | `elevated` shadow | `0 4px 12px rgba(0,0,0,0.15)` |
| `--shadow-hover` | Hover shadow | `0 8px 24px rgba(0,0,0,0.2)` |
| `--primary` | Hover border accent | Border color while hovered |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="button"` | Set when `clickable` |
| `tabindex="0"` | Set when `clickable`, making the card keyboard-focusable |
| `x-tooltip` | Set when `tooltip`/`hover-text` is provided, wiring the themed tooltip behavior |

Keyboard support:
- `Enter`/`Space` activate a `clickable` card the same as a mouse click.
