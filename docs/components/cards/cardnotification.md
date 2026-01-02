# Card Notification Component

## Overview
The `cardnotification` component is a specialized card used for alerts, notices, and status updates. It supports semantic coloring, icons, and dismissibility.

## Internals & Lifecycle

### Initialization
1.  **Role Assignment**: Automatically sets `role="alert"` for accessibility.
2.  **Theme Application**:
    - Maps `data-type` (info, success, warning, error) to specific color palettes.
    - Applies a left border (`4px solid`) and a light background tint (`rgba(..., 0.15)`).
3.  **Icon Logic**: Uses a default emoji map based on type if no custom `data-icon` is provided.
    - `info` → ℹ️
    - `success` → ✅
    - `warning` → ⚠️
    - `error` → ❌
4.  **Dismissal Logic**:
    - If `data-dismissible` is true, adds a close button (`×`).
    - Attaches a click handler to the close button that calls `element.remove()`, removing the card from the DOM entirely.

### DOM Structure

<article class="wb-card wb-card--notification" role="alert" style="border-left: 4px solid ...">
  <!-- Icon -->
  <span>ℹ️</span>
  
  <!-- Content -->
  <div>
    <strong class="wb-card__notif-title">Title</strong>
    <p class="wb-card__notif-message">Message content...</p>
  </div>
  
  <!-- Close Button (Optional) -->
  <button>×<button>
</article>

```html
<article class="wb-card wb-card--notification" role="alert" style="border-left: 4px solid ...">
  <!-- Icon -->
  <span>ℹ️</span>
  
  <!-- Content -->
  <div>
    <strong class="wb-card__notif-title">Title</strong>
    <p class="wb-card__notif-message">Message content...</p>
  </div>
  
  <!-- Close Button (Optional) -->
  <button>×<button>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-type` | enum | `info` | Alert type: `info`, `success`, `warning`, `error`. |
| `data-message` | string | textContent | The main notification text. |
| `data-dismissible` | boolean | `true` | Whether to show the close button. |
| `data-icon` | string | auto | Custom icon to override the default. |

## Usage Example

<div data-wb="cardnotification" 
     data-type="warning" 
     data-title="System Maintenance"
     data-message="Scheduled maintenance will occur tonight at 2 AM."
     data-dismissible="true">
</div>

```html
<div data-wb="cardnotification" 
     data-type="warning" 
     data-title="System Maintenance"
     data-message="Scheduled maintenance will occur tonight at 2 AM."
     data-dismissible="true">
</div>
```
