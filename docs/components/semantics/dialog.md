# Dialog - WB Framework v3.0

Modal dialog using native HTML5 dialog element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-dialog>` |
| Behavior | `dialog` |
| Semantic | `<dialog>` |
| Base Class | `wb-dialog` |
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

## Usage

### Custom Element

```html
<wb-dialog title="Welcome" id="my-dialog">
  <p>Dialog content goes here.</p>
</wb-dialog>

<button onclick="document.getElementById('my-dialog').open()">
  Open Dialog
</button>
```

### Trigger Button

```html
<button 
  data-wb="dialog" 
  data-wb-title="Confirm" 
  data-wb-content="Are you sure?">
  Open Confirmation
</button>
```

### Sizes

```html
<wb-dialog title="Small" size="sm">Small dialog</wb-dialog>
<wb-dialog title="Medium" size="md">Medium dialog</wb-dialog>
<wb-dialog title="Large" size="lg">Large dialog</wb-dialog>
<wb-dialog title="Full" size="full">Full dialog</wb-dialog>
```

### Centered Variant

```html
<wb-dialog title="Centered" variant="centered">
  This dialog is vertically centered.
</wb-dialog>
```

### Without Close Button

```html
<wb-dialog title="Required Action" showClose="false">
  You must complete this action.
</wb-dialog>
```

## Generated Structure

```html
<dialog class="wb-dialog wb-dialog--md">
  <div class="wb-dialog__container">
    <header class="wb-dialog__header">
      <h2 class="wb-dialog__title">Title</h2>
      <button class="wb-dialog__close">×</button>
    </header>
    <main class="wb-dialog__body">
      Content here
    </main>
    <footer class="wb-dialog__footer">
      Footer content
    </footer>
  </div>
</dialog>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-dialog` | Always | Base styling |
| `.wb-dialog--sm` | `size="sm"` | Small size |
| `.wb-dialog--md` | `size="md"` | Medium size |
| `.wb-dialog--lg` | `size="lg"` | Large size |
| `.wb-dialog--xl` | `size="xl"` | Extra large size |
| `.wb-dialog--full` | `size="full"` | Full screen |
| `.wb-dialog--centered` | `variant="centered"` | Centered variant |
| `.wb-dialog--fullscreen` | `variant="fullscreen"` | Fullscreen variant |

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
const dialog = document.querySelector('wb-dialog');

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
| `--wb-dialog-width` | `500px` | Dialog width |
| `--wb-dialog-max-width` | `90vw` | Max dialog width |
| `--wb-dialog-max-height` | `85vh` | Max dialog height |
| `--wb-dialog-radius` | `8px` | Border radius |
| `--wb-dialog-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--wb-dialog-shadow` | `0 20px 60px rgba(0,0,0,0.3)` | Box shadow |
| `--wb-dialog-padding` | `1.5rem` | Content padding |
| `--wb-dialog-header-gap` | `1rem` | Header gap |
| `--wb-dialog-title-size` | `1.25rem` | Title font size |
| `--wb-dialog-title-weight` | `600` | Title font weight |
| `--wb-dialog-backdrop-bg` | `rgba(0,0,0,0.5)` | Backdrop background |
| `--wb-dialog-backdrop-blur` | `0` | Backdrop blur |
| `--wb-dialog-enter-animation` | `dialogFadeIn 0.2s ease` | Enter animation |
| `--wb-dialog-exit-animation` | `dialogFadeOut 0.15s ease` | Exit animation |
| `--wb-dialog-z-index` | `1000` | Z-index |

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
