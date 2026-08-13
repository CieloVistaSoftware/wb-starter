# Button - wb-starter v3.0

Interactive button with variants, sizes, an optional built-in icon library, and a loading state.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-button>` |
| Behavior | `button` |
| Semantic | `<button>` |
| Root CSS Class | `wb-button` |
| Category | Forms |
| Schema | `src/wb-models/button.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Button text (also accepts plain text content) |
| `icon` | string | `""` | Name from the built-in icon library (`star`, `check`, `close`, `warning`, `info`, `error`, `heart`, `search`, `edit`, `trash`, `plus`, `minus`, `home`, `settings`, `download`, `upload`, `arrow_right`, `arrow_left`, `copy`, `save`), or any emoji/text |
| `icon-position` | string | `"start"` | `start` or `end` |
| `variant` | string | `"primary"` | `primary`, `secondary`, `success`, `warning`, `error`/`danger`, `ghost`, `link` |
| `size` | string | `"md"` | `xs`, `sm`, `md`, `lg`, `xl` |
| `disabled` | boolean | `false` | Disabled state -- blocks click/keyboard activation |
| `loading` | boolean | `false` | Shows a spinner in place of the icon |

## Usage

### Custom Element

<wb-demo>
<wb-button variant="primary">Click Me</wb-button>
</wb-demo>

### Variants

```html
<wb-button variant="primary">Primary</wb-button>
<wb-button variant="secondary">Secondary</wb-button>
<wb-button variant="success">Success</wb-button>
<wb-button variant="warning">Warning</wb-button>
<wb-button variant="error">Error</wb-button>
<wb-button variant="ghost">Ghost</wb-button>
<wb-button variant="link">Link</wb-button>
```

### Sizes

```html
<wb-button size="xs">Extra Small</wb-button>
<wb-button size="sm">Small</wb-button>
<wb-button size="md">Medium</wb-button>
<wb-button size="lg">Large</wb-button>
<wb-button size="xl">Extra Large</wb-button>
```

### With Icon

```html
<wb-button variant="primary" icon="download">Download</wb-button>
<wb-button variant="secondary" icon="arrow_right" icon-position="end">Next</wb-button>
```

### Loading State

```html
<wb-button variant="primary" loading>Saving...</wb-button>
```

### Disabled

```html
<wb-button variant="primary" disabled>Disabled</wb-button>
```

### Native `<button>` (Enhanced)

```html
<!-- x-button is auto-injected onto native <button> tags when autoInject is on -->
<button variant="primary" size="lg">Native Button</button>
```

## Generated Structure

```html
<wb-button variant="primary" size="lg" role="button" tabindex="0">
  <span class="wb-button__icon">
    <svg><!-- resolved icon --></svg>
  </span>
  Download
</wb-button>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `wb-button` (tag selector) | Always on `<wb-button>` | Full attribute-driven styling -- no inner `<button>`, no classes added on the custom tag |
| `.wb-button` | Native `<button>` auto-injected | Opt-in class-based styling for a plain `<button>` |
| `.wb-button--{xs,sm,md,lg,xl}` | `size` on a native `<button>` | Padding/font-size scale |
| `.wb-button--{primary,secondary,success,danger,warning,info,ghost,link}` | `variant` on a native `<button>` | Color scheme |
| `.wb-button__icon` | `icon` set | Icon wrapper |
| `.wb-button__spinner` | `loading` | Spinning loading glyph |

On `<wb-button>` itself, size/variant are matched via **attribute selectors** (`wb-button[size="lg"]`, `wb-button[variant="primary"]`) rather than classes.

## Methods

`button()` (`src/wb-viewmodels/semantics/button.js`) does not implement any of the methods below directly -- they come from `button.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`). None match the schema builder's common viewModel, so each is a stub that warns to the console and dispatches a `wb:{method}` event.

| Method | Description |
|--------|-------------|
| `enable()` | Declared (generic stub -- dispatches `wb:enable`) |
| `disable()` | Declared (generic stub -- dispatches `wb:disable`) |
| `startLoading()` | Declared (generic stub -- dispatches `wb:startLoading`) |
| `stopLoading()` | Declared (generic stub -- dispatches `wb:stopLoading`) |
| `click()` | Declared (generic stub -- dispatches `wb:click`; use the native `element.click()` instead) |
| `focus()` | Declared (generic stub -- use the native `element.focus()` instead) |
| `blur()` | Declared (generic stub -- use the native `element.blur()` instead) |

To toggle the `loading`/`disabled` look in practice, set the `loading`/`disabled` attribute and let the behavior re-run, rather than relying on the stub methods above.

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:button:click` | Fired when the button is activated (click, Enter, or Space) -- skipped while `disabled` | `{ originalEvent: Event }` |

```javascript
const button = document.querySelector('wb-button');

button.addEventListener('wb:button:click', (e) => {
  console.log('Button activated', e.detail.originalEvent);
});
```

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--radius-md` | Border radius | Falls back to `6px` |
| `--bg-secondary` | Default background | Falls back to `#2a2a2a` |
| `--primary` | `variant="primary"` background | Falls back to `#6366f1` |
| `--secondary` | `variant="secondary"` background | Falls back to `#64748b` |
| `--success-color` | `variant="success"` background | Falls back to `#22c55e` |
| `--danger-color` | `variant="danger"`/`"error"` background | Falls back to `#ef4444` |
| `--warning-color` | `variant="warning"` background | Falls back to `#f59e0b` |
| `--info-color` | `variant="info"` background | Falls back to `#3b82f6` |
| `--text-primary` | `variant="ghost"` text | Falls back to `#e5e5e5` |
| `--border-color` | `variant="ghost"` border | Falls back to `#404040` |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="button"` | Set on `<wb-button>` (a native `<button>` gets this implicitly) |
| `tabindex="0"` | Makes `<wb-button>` keyboard-focusable |
| `aria-disabled` | Reflects the `disabled` attribute |

Keyboard support:
- `Enter` and `Space` both activate a `<wb-button>` (dispatches a synthetic `click`), matching native `<button>` behavior.
