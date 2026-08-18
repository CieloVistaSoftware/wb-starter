# Button - wb-starter v3.0

Interactive button with variants, sizes, an optional built-in icon library, and a loading state.

## Overview

| Property | Value |
|----------|-------|
| Semantic Tag | `<button>` |
| Behavior | `button` |
| Root CSS Class | `wb-button` |
| Category | Forms |
| Schema | `src/wb-models/button.schema.json` |

**This is the actual selling point**: `autoInject` is **on by default** site-wide
(`src/core/config.js`) — a plain `<button>`, zero extra attributes, zero `x-button`,
gets the full attribute-driven look and behavior automatically. Every example on this
page is exactly the semantic HTML you'd write anyway.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Button text -- prefer real text content (`<button>Click Me</button>`) when authoring by hand; `label` exists for cases building the button from data/attributes only. Children win over `label` if the element already has content. |
| `icon` | string | `""` | Name from the built-in icon library (`star`, `check`, `close`, `warning`, `info`, `error`, `heart`, `search`, `edit`, `trash`, `plus`, `minus`, `home`, `settings`, `download`, `upload`, `arrow_right`, `arrow_left`, `copy`, `save`), or any emoji/text |
| `icon-position` | string | `"start"` | `start` or `end` |
| `variant` | string | `"primary"` | `primary`, `secondary`, `success`, `warning`, `error`/`danger`, `ghost`, `link` |
| `size` | string | `"md"` | `xs`, `sm`, `md`, `lg`, `xl` |
| `disabled` | boolean | `false` | Disabled state -- blocks click/keyboard activation |
| `loading` | boolean | `false` | Shows a spinner in place of the icon, and disables the button |

## Usage

### Basic

<wb-demo>
<button variant="primary">Click Me</button>
</wb-demo>

### Variants

<wb-demo columns="4">
<button variant="primary">Primary</button>
<button variant="secondary">Secondary</button>
<button variant="success">Success</button>
<button variant="warning">Warning</button>
<button variant="error">Error</button>
<button variant="ghost">Ghost</button>
<button variant="link">Link</button>
</wb-demo>

### Sizes

<wb-demo columns="5">
<button variant="primary" size="xs">Extra Small</button>
<button variant="primary" size="sm">Small</button>
<button variant="primary" size="md">Medium</button>
<button variant="primary" size="lg">Large</button>
<button variant="primary" size="xl">Extra Large</button>
</wb-demo>

### With Icon

<wb-demo columns="2">
<button variant="primary" icon="download">Download</button>
<button variant="secondary" icon="arrow_right" icon-position="end">Next</button>
</wb-demo>

### Loading State

<wb-demo>
<button variant="primary" loading>Saving...</button>
</wb-demo>

### Disabled

<wb-demo>
<button variant="primary" disabled>Disabled</button>
</wb-demo>

## Generated Structure

```html
<button variant="primary" size="lg" class="wb-button wb-button--lg wb-button--primary">
  <span class="wb-button__icon">
    <svg><!-- resolved icon --></svg>
  </span>
  Download
</button>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-button` | Always, once enhanced | Base attribute-driven styling |
| `.wb-button--{xs,sm,md,lg,xl}` | `size` set | Padding/font-size scale |
| `.wb-button--{primary,secondary,success,danger,warning,info,ghost,link}` | `variant` set | Color scheme |
| `.wb-button__icon` | `icon` set | Icon wrapper |
| `.wb-button__spinner` | `loading` | Spinning loading glyph |

`button()` (`src/wb-viewmodels/semantics/button.js`) reads `size`/`variant`/`icon`/
`icon-position`/`loading` straight off the element and maps them to these classes --
identical logic whether the host is a bare `<button>` (enhanced via `autoInject`'s
`nativeMap`) or an explicit `x-button` opt-in.

## Methods

`button()` does not implement any of the methods below directly -- they come from
`button.schema.json`'s `$methods`, bound generically by the schema builder
(`src/core/mvvm/schema-builder.js`). None match the schema builder's common viewModel,
so each is a stub that warns to the console and dispatches a `wb:{method}` event.

| Method | Description |
|--------|-------------|
| `enable()` | Declared (generic stub -- dispatches `wb:enable`) |
| `disable()` | Declared (generic stub -- dispatches `wb:disable`) |
| `startLoading()` | Declared (generic stub -- dispatches `wb:startLoading`) |
| `stopLoading()` | Declared (generic stub -- dispatches `wb:stopLoading`) |
| `click()` | Declared (generic stub -- use the native `element.click()` instead) |
| `focus()` | Declared (generic stub -- use the native `element.focus()` instead) |
| `blur()` | Declared (generic stub -- use the native `element.blur()` instead) |

To toggle the `loading`/`disabled` look in practice, set the `loading`/`disabled`
attribute and let the behavior re-run, rather than relying on the stub methods above.

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:button:click` | Fired when the button is activated (click, Enter, or Space) -- skipped while `disabled` | `{ originalEvent: Event }` |

```javascript
const button = document.querySelector('button[variant]');

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

A native `<button>` already carries an implicit `role="button"`, is keyboard-focusable,
and activates on Enter/Space for free -- none of that needs adding. `button()` itself
adds nothing accessibility-specific beyond honoring the standard `disabled` attribute
(blocks the `wb:button:click` dispatch; the browser's own native `disabled` behavior
handles focus/click/keyboard for free on top of that). `aria-disabled="true"` is
recognized as an equivalent to `disabled` if you set it yourself, but `button()` never
sets it for you.

Keyboard support: `Enter` and `Space` both activate the button, matching native
`<button>` behavior (built in, not added by this behavior).
