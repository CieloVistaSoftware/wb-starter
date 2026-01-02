# Card Minimizable Component

## Overview
The `cardminimizable` component allows the user to collapse the card body entirely, leaving only the header visible. This is common in dashboard widgets or accordion-like interfaces.

## Internals & Lifecycle

### Initialization
1.  **Header Controls**: Injects a minimize button (`−` or `+`) into the header, aligned to the right.
2.  **Content Transition**:
    - The main content area is styled with `transition: all 0.3s ease`.
    - When minimized, it applies: `max-height: 0`, `padding: 0 1rem`, `opacity: 0`.
3.  **Footer Handling**: If a footer exists, it is hidden (`display: none`) when the card is minimized.
4.  **Event Handling**:
    - Toggles the `wb-card--minimized` class.
    - Dispatches a custom event.

### Events
- **Event Name**: `wb:cardminimizable:toggle`
- **Bubbles**: `true`
- **Detail Object**: `{ minimized: boolean }`

### DOM Structure

<article class="wb-card wb-card--minimizable">
  <header class="wb-card__header">
    <h3>Title</h3>
    <!-- Toggle Button -->
    <button class="wb-card__minimize-btn">−</button>
  </header>
  
  <!-- Collapsible Body -->
  <main class="wb-card__minimizable-content" style="max-height: 1000px; opacity: 1;">
    ...
  </main>
</article>

```html
<article class="wb-card wb-card--minimizable">
  <header class="wb-card__header">
    <h3>Title</h3>
    <!-- Toggle Button -->
    <button class="wb-card__minimize-btn">−</button>
  </header>
  
  <!-- Collapsible Body -->
  <main class="wb-card__minimizable-content" style="max-height: 1000px; opacity: 1;">
    ...
  </main>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-minimized` | boolean | `false` | Initial state. |

## Usage Example

<div data-wb="cardminimizable" 
     data-title="Widget A" 
     data-content="Widget content..."
     data-minimized="false">
</div>

```html
<div data-wb="cardminimizable" 
     data-title="Widget A" 
     data-content="Widget content..."
     data-minimized="false">
</div>
```
