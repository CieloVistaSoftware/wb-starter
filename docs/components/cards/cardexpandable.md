# Card Expandable Component

## Overview
The `cardexpandable` component features a "Show More / Show Less" toggle mechanism. It is useful for cards with long content that should be initially truncated.

## Internals & Lifecycle

### Initialization
1.  **Content Wrapping**: Wraps the main content in a container with `overflow: hidden` and `transition: max-height`.
2.  **State Management**:
    - Reads `data-expanded` (default: false).
    - Reads `data-max-height` (default: "100px").
    - Sets the initial inline style: `max-height: [1000px | 100px]`.
3.  **Control Injection**: Appends a button footer with an arrow icon (▼/▲) and text label.
4.  **Event Handling**:
    - Toggles the `max-height` between the limit and a large value (1000px).
    - Toggles the `wb-card--expanded` class.
    - Dispatches a custom event.

### Events
- **Event Name**: `wb:cardexpandable:toggle`
- **Bubbles**: `true`
- **Detail Object**: `{ expanded: boolean }`

### DOM Structure

<article class="wb-card wb-card--expandable">
  <header>...</header>
  
  <!-- Collapsible Content -->
  <div class="wb-card__expandable-content" style="max-height: 100px; transition: max-height 0.3s;">
    ...long content...
  </div>
  
  <!-- Toggle Button -->
  <div>
    <button class="wb-card__expand-btn">
      <span>▼</span> <span>Show More</span>
    </button>
  </div>
</article>

```html
<article class="wb-card wb-card--expandable">
  <header>...</header>
  
  <!-- Collapsible Content -->
  <div class="wb-card__expandable-content" style="max-height: 100px; transition: max-height 0.3s;">
    ...long content...
  </div>
  
  <!-- Toggle Button -->
  <div>
    <button class="wb-card__expand-btn">
      <span>▼</span> <span>Show More</span>
    </button>
  </div>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-expanded` | boolean | `false` | Initial state. |
| `data-max-height` | string | `100px` | The height when collapsed. |

## Usage Example

<div data-wb="cardexpandable" 
     data-title="Terms of Service"
     data-max-height="80px"
     data-content="Lorem ipsum dolor sit amet... (lots of text)">
</div>

```html
<div data-wb="cardexpandable" 
     data-title="Terms of Service"
     data-max-height="80px"
     data-content="Lorem ipsum dolor sit amet... (lots of text)">
</div>
```
