# wb-mdhtml

Markdown to HTML component that renders markdown content with syntax highlighting for code blocks.

## Overview

| Property | Value |
|----------|-------|
| Tag | `<wb-mdhtml>` |
| Behavior | `mdhtml` |
| Category | Content |
| Schema | `src/wb-models/mdhtml.schema.json` |

## Basic Usage

### Inline Markdown

```html
<wb-mdhtml>
# Heading
This is **bold** and *italic* text.
</wb-mdhtml>
```

### External File

```html
<wb-mdhtml src="/docs/readme.md"></wb-mdhtml>
```

## Code Examples with HTML Tags

When displaying HTML code examples (especially with `<wb-*>` custom elements), wrap content in a `<template>` child to preserve the literal HTML tags:

### The Problem

Without `<template>`, the browser parses `<wb-button>` as an actual element before JavaScript runs:

```html
<!-- ❌ WRONG - browser parses wb-button, code shows only "Click" -->
<wb-mdhtml>
```html
<wb-button>Click</wb-button>
```
</wb-mdhtml>
```

### The Solution

Use `<template>` to protect HTML from browser parsing:

```html
<!-- ✅ CORRECT - template preserves literal text -->
<wb-mdhtml>
  <template>
```html
<wb-button>Click</wb-button>
```
  </template>
</wb-mdhtml>
```

## Content Priority

The component reads content in this order:

1. **`src` attribute** - Fetches from external markdown file
2. **`<template>` child** - Uses template's innerHTML (preserves HTML tags)
3. **`textContent`** - Uses element's text content (HTML tags stripped by browser)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | - | Path to external markdown file |
| `data-sanitize` | boolean | `true` | Remove script tags and on* attributes |
| `data-gfm` | boolean | `true` | Enable GitHub Flavored Markdown |
| `data-breaks` | boolean | `true` | Convert newlines to `<br>` tags |
| `data-size` | enum | `xs` | Font size: xs, sm, md, lg, xl |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `wb:mdhtml:loaded` | `{ src, length }` | Fired after content is rendered |
| `wb:mdhtml:error` | `{ src, error }` | Fired if external file fails to load |
| `wb:mdhtml:hydrated` | - | Fired when component is fully initialized |

## Code Block Features

Code blocks within mdhtml automatically get:

- **Syntax highlighting** via marked.js
- **Line numbers** via x-pre behavior
- **Copy button** via x-code behavior
- **Language label** (e.g., "HTML", "JavaScript")

## Examples

### Rendered HTML Code Block

<wb-mdhtml data-sanitize="false">
  <template>
```html
<wb-button variant="primary">Primary Button</wb-button>
<wb-button variant="success">Success Button</wb-button>
<wb-button variant="error">Error Button</wb-button>
```
  </template>
</wb-mdhtml>

### Rendered JavaScript Code Block

<wb-mdhtml data-sanitize="false">
  <template>
```javascript
class WbButton extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    this.classList.add(`btn-${variant}`);
  }
}
customElements.define('wb-button', WbButton);
```
  </template>
</wb-mdhtml>

### Rendered Inline Markdown

<wb-mdhtml data-sanitize="false">
## This is a heading

This is **bold** and *italic* text with a [link](https://example.com).

- List item 1
- List item 2
- List item 3
</wb-mdhtml>

---

### How to Write These (Code Snippets)

```html
<wb-mdhtml>
  <template>
```html
<wb-button variant="primary">Primary Button</wb-button>
<wb-button variant="success">Success Button</wb-button>
<wb-button variant="error">Error Button</wb-button>
```
  </template>
</wb-mdhtml>
```

### JavaScript Code Block

```html
<wb-mdhtml>
  <template>
```javascript
class WbButton extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    this.classList.add(`btn-${variant}`);
  }
}
customElements.define('wb-button', WbButton);
```
  </template>
</wb-mdhtml>
```

### Inline Markdown (No Template Needed)

```html
<wb-mdhtml>
## This is a heading

This is **bold** and *italic* text with a [link](https://example.com).

- List item 1
- List item 2
- List item 3
</wb-mdhtml>
```

### Mixed: Markdown + Code Block

```html
<wb-mdhtml>
  <template>
### Component Usage

Use the `wb-card` component for content containers:

```html
<wb-card variant="elevated">
  <h3 slot="header">Card Title</h3>
  <p>Card content goes here.</p>
</wb-card>
```

The card supports these variants: `default`, `outline`, `elevated`.
  </template>
</wb-mdhtml>
```

### From External File

```html
<wb-mdhtml src="/docs/components/button.md" data-size="md"></wb-mdhtml>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-mdhtml` | Base class |
| `.wb-mdhtml--loading` | While fetching content |
| `.wb-mdhtml--loaded` | After successful render |
| `.wb-mdhtml--error` | If loading fails |

## See Also

- [x-pre](../semantics/pre.md) - Code block enhancement
- [x-code](../semantics/code.md) - Inline code enhancement
- [Escape Hatches](/docs/escape-hatches.md) - Override default options
