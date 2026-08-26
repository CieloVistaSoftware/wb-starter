# Dialog - wb-starter v3.0

Modal dialog using native HTML5 dialog element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<dialog>` |
| Behavior | `dialog` |
| Semantic | `<dialog>` |
| Root CSS Class | `x-dialog` |
| Category | Overlay |
| Schema | `src/wb-models/dialog.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Dialog title |
| `content` | string | `""` | Dialog body content |
| `size` | string | `"md"` | Size: `sm`, `md`, `lg`, `xl`, `full` |
| `closeOnBackdrop` | boolean | `true` | Close on backdrop click |
| `closeOnEscape` | boolean | `true` | Close on Escape key |
| `showClose` | boolean | `true` | Show close button |
| `variant` | string | `"default"` | Variant: `default`, `centered`, `fullscreen` |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<dialog
  title="Welcome"
  id="my-dialog">
  <p>Click Me</p>
</dialog>
</div>

## Usage

### Custom Element

```html
<dialog
  title="Welcome"
  id="my-dialog">
  <p>Dialog content goes here.</p>
</dialog>
<button onclick="document.getElementById('my-dialog').open()"> Open Dialog </button>
```

### Trigger Button

```html
<button
  x-dialog
  title="Confirm"
  content="Are you sure?">
  Open Confirmation
</button>
```

### Sizes

```html
<dialog
  title="Small"
  size="sm">
  Small dialog
</dialog>
<dialog
  title="Medium"
  size="md">
  Medium dialog
</dialog>
<dialog
  title="Large"
  size="lg">
  Large dialog
</dialog>
<dialog
  title="Full"
  size="full">
  Full dialog
</dialog>
```

### Centered Variant

```html
<dialog
  title="Centered"
  variant="centered">
  This dialog is vertically centered.
</dialog>
```

### Without Close Button

```html
<dialog
  title="Required Action"
  showClose="false">
  You must complete this action.
</dialog>
```

## Generated Structure

```html
<dialog class="x-dialog x-dialog--md">
  <div class="x-dialog__container">
    <header class="x-dialog__header">
      <h2 class="x-dialog__title">Title</h2>
      <button class="x-dialog__close">×</button>
    </header>
    <main class="x-dialog__body"> Content here </main>
    <footer class="x-dialog__footer"> Footer content </footer>
  </div>
</dialog>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-dialog` | Always | Base styling |
| `.x-dialog--sm` | `size="sm"` | Small size |
| `.x-dialog--md` | `size="md"` | Medium size |
| `.x-dialog--lg` | `size="lg"` | Large size |
| `.x-dialog--xl` | `size="xl"` | Extra large size |
| `.x-dialog--full` | `size="full"` | Full screen |
| `.x-dialog--centered` | `variant="centered"` | Centered variant |
| `.x-dialog--fullscreen` | `variant="fullscreen"` | Fullscreen variant |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `open()` | Opens the dialog | `Promise` |
| `close()` | Closes the dialog | `Promise` |
| `toggle()` | Toggles the dialog | - |
| `isOpen()` | Returns open state | `boolean` |
| `setContent(content)` | Updates body content | - |
| `setTitle(title)` | Updates title | - |

```javascript
const dialog = document.querySelector('x-dialog');

// Open/close
await dialog.open();
await dialog.close();

// Check state
if (dialog.isOpen()) {
  console.log('Dialog is open');
}

// Update content
dialog.setTitle('New Title');
dialog.setContent('<p>Updated content</p>');
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:dialog:open` | Dialog opened | `{ title: string }` |
| `wb:dialog:close` | Dialog closed | `{}` |
| `wb:dialog:cancel` | Cancelled (Escape/backdrop) | `{}` |

```javascript
dialog.addEventListener('wb:dialog:open', (e) => {
  console.log('Dialog opened:', e.detail.title);
});

dialog.addEventListener('wb:dialog:close', () => {
  console.log('Dialog closed');
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-dialog-width` | `500px` | Dialog width |
| `--x-dialog-max-width` | `90vw` | Max dialog width |
| `--x-dialog-max-height` | `85vh` | Max dialog height |
| `--x-dialog-radius` | `8px` | Border radius |
| `--x-dialog-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--x-dialog-shadow` | `0 20px 60px rgba(0,0,0,0.3)` | Box shadow |
| `--x-dialog-padding` | `1.5rem` | Content padding |
| `--x-dialog-header-gap` | `1rem` | Header gap |
| `--x-dialog-title-size` | `1.25rem` | Title font size |
| `--x-dialog-title-weight` | `600` | Title font weight |
| `--x-dialog-backdrop-bg` | `rgba(0,0,0,0.5)` | Backdrop background |
| `--x-dialog-backdrop-blur` | `0` | Backdrop blur |
| `--x-dialog-enter-animation` | `dialogFadeIn 0.2s ease` | Enter animation |
| `--x-dialog-exit-animation` | `dialogFadeOut 0.15s ease` | Exit animation |
| `--x-dialog-z-index` | `1000` | Z-index |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `dialog` | Implicit |
| `aria-modal` | `true` | Always |
| `aria-labelledby` | Dialog title ID | When title exists |

Built-in accessibility features:
- Focus trap inside dialog
- Escape key to close
- Return focus on close
- Screen reader announcements

## Schema

Location: `src/wb-models/dialog.schema.json`
