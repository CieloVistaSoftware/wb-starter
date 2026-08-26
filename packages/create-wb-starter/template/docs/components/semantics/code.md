# Code - wb-starter v3.0

Enhanced code display with copy button and language badge.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<code>` |
| Behavior | `code` |
| Semantic | `<code>` |
| Root CSS Class | `x-code` |
| Category | Content |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `language` | string | `""` | Language name to display (e.g., "JS", "HTML") |
| `showCopy` | boolean | `false` | Show copy button (block mode) |
| `variant` | string | `"inline"` | Display style: `inline`, `block` |
| `scrollable` | boolean | `false` | Enable horizontal scrolling |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<code
  language="Python">
  print("Hello")
</code>
</div>

## Usage

### Inline Code

```html
<code>const x = 1;</code>
```

### Block Code

```html
<code
  variant="block"
  language="JavaScript"
  showCopy>
  function hello() { console.log("Hello World"); }
</code>
```

### Native Code (Enhanced)

```html
<code
  language="Python">
  print("Hello")
</code>
```

### With Copy Button

```html
<code
  variant="block"
  showCopy>
  npm install x-framework
</code>
```

### Scrollable (Long Lines)

```html
<code
  variant="block"
  scrollable>
  const veryLongLine = "This is a very long line of code that will scroll horizontally";
</code>
```

## Generated Structure

### Inline
```html
<code class="x-code x-code--inline">const x = 1;</code>
```

### Block
```html
<div class="x-code x-code--block">
  <div class="x-code__header">
    <span class="x-code__language">JavaScript</span>
    <button class="x-code__copy">Copy</button>
  </div>
  <pre class="x-code__content">
    <code>function hello() { ... }</code>
  </pre>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-code` | Always | Base styling |
| `.x-code--inline` | `variant="inline"` | Inline display |
| `.x-code--block` | `variant="block"` | Block display |
| `.x-code--scrollable` | `scrollable` | Horizontal scroll |

## Methods

| Method | Description |
|--------|-------------|
| `copy()` | Copies code to clipboard |

```javascript
const code = document.querySelector('x-code');
code.copy();
```

## Events

| Event | Description |
|-------|-------------|
| `wb:code:copy` | Code copied to clipboard |

```javascript
code.addEventListener('wb:code:copy', () => {
  console.log('Code copied!');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-code-bg` | `var(--bg-tertiary)` | Background color |
| `--x-code-color` | `var(--text-primary)` | Text color |
| `--x-code-radius` | `4px` | Border radius |
| `--x-code-padding` | `0.25em 0.5em` | Inline padding |
| `--x-code-block-padding` | `1rem` | Block padding |
| `--x-code-font-family` | `monospace` | Font family |
| `--x-code-font-size` | `0.875em` | Font size |
