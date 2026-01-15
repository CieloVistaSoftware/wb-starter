# Code - WB Framework v3.0

Enhanced code display with copy button and language badge.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-code>` |
| Behavior | `code` |
| Semantic | `<code>` |
| Base Class | `wb-code` |
| Category | Content |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `language` | string | `""` | Language name to display (e.g., "JS", "HTML") |
| `showCopy` | boolean | `false` | Show copy button (block mode) |
| `variant` | string | `"inline"` | Display style: `inline`, `block` |
| `scrollable` | boolean | `false` | Enable horizontal scrolling |

## Usage

### Inline Code

```html
<wb-code>const x = 1;</wb-code>
```

### Block Code

```html
<wb-code variant="block" language="JavaScript" showCopy>
function hello() {
  console.log("Hello World");
}
</wb-code>
```

### Native Code (Enhanced)

```html
<code data-wb="code" data-wb-language="Python">
print("Hello")
</code>
```

### With Copy Button

```html
<wb-code variant="block" showCopy>
npm install wb-framework
</wb-code>
```

### Scrollable (Long Lines)

```html
<wb-code variant="block" scrollable>
const veryLongLine = "This is a very long line of code that will scroll horizontally";
</wb-code>
```

## Generated Structure

### Inline
```html
<code class="wb-code wb-code--inline">const x = 1;</code>
```

### Block
```html
<div class="wb-code wb-code--block">
  <div class="wb-code__header">
    <span class="wb-code__language">JavaScript</span>
    <button class="wb-code__copy">Copy</button>
  </div>
  <pre class="wb-code__content">
    <code>function hello() { ... }</code>
  </pre>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-code` | Always | Base styling |
| `.wb-code--inline` | `variant="inline"` | Inline display |
| `.wb-code--block` | `variant="block"` | Block display |
| `.wb-code--scrollable` | `scrollable` | Horizontal scroll |

## Methods

| Method | Description |
|--------|-------------|
| `copy()` | Copies code to clipboard |

```javascript
const code = document.querySelector('wb-code');
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
| `--wb-code-bg` | `var(--bg-tertiary)` | Background color |
| `--wb-code-color` | `var(--text-primary)` | Text color |
| `--wb-code-radius` | `4px` | Border radius |
| `--wb-code-padding` | `0.25em 0.5em` | Inline padding |
| `--wb-code-block-padding` | `1rem` | Block padding |
| `--wb-code-font-family` | `monospace` | Font family |
| `--wb-code-font-size` | `0.875em` | Font size |
