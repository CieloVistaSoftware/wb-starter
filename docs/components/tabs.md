# Tabs - wb-starter v3.0

Tabbed interface for organizing content into switchable panels.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-tabs>` |
| Behavior | `tabs` |
| Semantic | `<section>` + `<nav>` |
| Base Class | `wb-tabs` |
| Schema | `src/wb-models/tabs.schema.json` |

## Semantic Structure

```html
<section class="wb-tabs">
  <!-- Tab List -->
  <nav class="wb-tabs__nav" role="tablist">
    <button role="tab" aria-selected="true" aria-controls="panel-0">Tab 1</button>
    <button role="tab" aria-selected="false" aria-controls="panel-1">Tab 2</button>
  </nav>

  <!-- Panels -->
  <div class="wb-tabs__panels">
    <section role="tabpanel" id="panel-0">Content 1</section>
    <section role="tabpanel" id="panel-1" hidden>Content 2</section>
  </div>
</section>
```

## Usage

### Custom Element

```html
<wb-tabs>
  <div data-tab="Overview">
    <h3>Overview Content</h3>
    <p>Overview details...</p>
  </div>
  <div data-tab="Details">
    <h3>Details Content</h3>
    <p>More information...</p>
  </div>
  <div data-tab="Settings">
    <h3>Settings</h3>
    <p>Configuration options...</p>
  </div>
</wb-tabs>
```

### Data Attribute

```html
<section data-wb="tabs">
  <div data-tab="First">First panel content</div>
  <div data-tab="Second">Second panel content</div>
</section>
```

## Accessibility

The component automatically handles:

- `role="tablist"` on navigation container
- `role="tab"` on buttons
- `role="tabpanel"` on content sections
- `aria-selected` for active tab
- `aria-controls` and `aria-labelledby` relationships
- Keyboard navigation (←/→ arrows)

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `←` | Previous tab |
| `→` | Next tab |
| `Home` | First tab |
| `End` | Last tab |

## Events

### wb:tabs:change

```javascript
tabs.addEventListener('wb:tabs:change', (e) => {
  console.log('Active tab:', e.detail.index);
  console.log('Tab label:', e.detail.label);
});
```

## JavaScript API

```javascript
const tabs = document.querySelector('wb-tabs');

// Switch to tab by index
tabs.setActiveTab(2);

// Get active tab index
const activeIndex = tabs.getActiveTab();
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-tabs` | Container |
| `.wb-tabs__nav` | Tab list |
| `.wb-tabs__tab` | Individual tab button |
| `.wb-tabs__tab--active` | Active tab |
| `.wb-tabs__panels` | Panels container |
| `.wb-tabs__panel` | Individual panel |

## Schema

Location: `src/wb-models/tabs.schema.json`
