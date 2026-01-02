# Tabs Component

## Overview
The Tabs component organizes content into multiple panels where only one panel is visible at a time. It uses a list of controls (tabs) to switch between these panels.

## Semantic Structure

**Important:** The Tabs component must follow a strict semantic structure to ensure accessibility and HTML5 compliance.

1.  **Container**: The wrapper element should be a `<section>` (or `<div>`) that groups the entire component. It **should not** be a `<nav>` element, as it contains content panels.
2.  **Tab List**: The navigation controls are wrapped in a `<nav>` element with `role="tablist"`.
3.  **Panels**: Each content panel is a `<section>` (or `<div>`) with `role="tabpanel"`.

### Correct Structure

```html
<!-- Container (The element with data-wb="tabs") -->
<section class="wb-tabs" data-wb="tabs">
  
  <!-- Tab List (Generated as <nav>) -->
  <nav class="wb-tabs__nav" role="tablist">
    <button role="tab" aria-selected="true" aria-controls="panel-0" id="tab-0">Tab 1</button>
    <button role="tab" aria-selected="false" aria-controls="panel-1" id="tab-1">Tab 2</button>
  </nav>

  <!-- Panels Container -->
  <div class="wb-tabs__panels">
    <!-- Panel (Generated as <section>) -->
    <section role="tabpanel" id="panel-0" aria-labelledby="tab-0">
      Content 1
    </section>
    <section role="tabpanel" id="panel-1" aria-labelledby="tab-1" hidden>
      Content 2
    </section>
  </div>

</section>
```

## Usage

### Basic Usage
You can create tabs by simply providing child elements. The behavior will automatically generate the tab navigation based on `data-tab` attributes.

```html
<section data-wb="tabs">
  <div data-tab="Overview">
    <h3>Overview Content</h3>
    <p>...</p>
  </div>
  <div data-tab="Details">
    <h3>Details Content</h3>
    <p>...</p>
  </div>
</section>
```

### Accessibility
The component automatically handles ARIA attributes:
- `role="tablist"` on the navigation container
- `role="tab"` on the buttons
- `role="tabpanel"` on the content sections
- `aria-selected`, `aria-controls`, and `aria-labelledby` relationships
- Keyboard navigation (Left/Right arrows to switch tabs)
