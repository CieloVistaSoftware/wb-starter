# Tabs - Web Behaviors (WB) v3.0

Tabbed interface for organizing content into switchable panels.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-tabs>` |
| Child Tag | `<wb-tab>` |
| Behavior | `tabs` / `tab` |
| Semantic | `<section>` + `<nav>` |
| Base Class | `wb-tabs` / `wb-tab` |
| Schema | `src/wb-models/tabs.schema.json` / `tab.schema.json` |

## Usage

### Recommended: Using `<wb-tab>`

```html
<wb-tabs>
  <wb-tab title="Overview">
    <h3>Overview Content</h3>
    <p>Overview details...</p>
  </wb-tab>
  <wb-tab title="Details">
    <h3>Details Content</h3>
    <p>More information...</p>
  </wb-tab>
  <wb-tab title="Settings">
    <h3>Settings</h3>
    <p>Configuration options...</p>
  </wb-tab>
</wb-tabs>
```

### Legacy: Using data attributes

```html
<wb-tabs>
  <div data-tab-title="Overview">Content 1</div>
  <div data-tab-title="Details">Content 2</div>
</wb-tabs>
```

## `<wb-tabs>` Properties

| Property | Type | Default | Values | Description |
|----------|------|---------|--------|-------------|
| `variant` | string | `default` | `default`, `pills`, `underline`, `bordered` | Visual style |
| `size` | string | `md` | `sm`, `md`, `lg` | Tab size |
| `full-width` | boolean | `false` | — | Tabs fill container width |
| `vertical` | boolean | `false` | — | Vertical tab layout |

## `<wb-tab>` Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | *required* | Tab button label text |
| `icon` | string | — | Icon (emoji or class) shown before title |
| `disabled` | boolean | `false` | Tab cannot be selected |
| `closable` | boolean | `false` | Shows close button on tab |
| `badge` | string | — | Badge text/count shown on tab |
| `lazy` | boolean | `false` | Content renders only when first activated |
| `active` | boolean | `false` | Tab is initially active |

## Examples

### With Icons

```html
<wb-tabs>
  <wb-tab title="Dashboard" icon="📊">Dashboard content</wb-tab>
  <wb-tab title="Settings" icon="⚙️">Settings content</wb-tab>
  <wb-tab title="Profile" icon="👤">Profile content</wb-tab>
</wb-tabs>
```

### With Badges

```html
<wb-tabs>
  <wb-tab title="Inbox" badge="12">Inbox messages...</wb-tab>
  <wb-tab title="Sent">Sent messages...</wb-tab>
  <wb-tab title="Drafts" badge="3">Draft messages...</wb-tab>
</wb-tabs>
```

### Disabled Tab

```html
<wb-tabs>
  <wb-tab title="Active">Available content</wb-tab>
  <wb-tab title="Coming Soon" disabled>Locked content</wb-tab>
</wb-tabs>
```

### Closable Tabs

```html
<wb-tabs>
  <wb-tab title="File 1" closable>Document content...</wb-tab>
  <wb-tab title="File 2" closable>Document content...</wb-tab>
  <wb-tab title="File 3" closable>Document content...</wb-tab>
</wb-tabs>
```

### Lazy Loading

```html
<wb-tabs>
  <wb-tab title="Overview">Loads immediately</wb-tab>
  <wb-tab title="Heavy Content" lazy>
    <!-- This content only loads when tab is first clicked -->
    <wb-chart data-src="/api/chart-data"></wb-chart>
  </wb-tab>
</wb-tabs>
```

### Initially Active Tab

```html
<wb-tabs>
  <wb-tab title="First">Content 1</wb-tab>
  <wb-tab title="Second" active>This tab is active on load</wb-tab>
  <wb-tab title="Third">Content 3</wb-tab>
</wb-tabs>
```

### Combined Features

```html
<wb-tabs variant="underline" size="lg">
  <wb-tab title="Home" icon="🏠" active>Welcome content</wb-tab>
  <wb-tab title="Messages" icon="💬" badge="5">Messages list</wb-tab>
  <wb-tab title="Reports" icon="📈" lazy>Heavy report data</wb-tab>
  <wb-tab title="Admin" icon="🔒" disabled>Admin only</wb-tab>
</wb-tabs>
```

## Semantic Structure (Generated)

```html
<wb-tabs class="wb-tabs">
  <!-- Tab List -->
  <nav class="wb-tabs__nav" role="tablist">
    <button class="wb-tabs__tab wb-tabs__tab--active" role="tab" 
            aria-selected="true" aria-controls="panel-0" id="tab-0">
      <span class="wb-tabs__icon">📊</span>
      <span class="wb-tabs__title">Dashboard</span>
      <span class="wb-tabs__badge">5</span>
    </button>
    <button class="wb-tabs__tab" role="tab" 
            aria-selected="false" aria-controls="panel-1" id="tab-1">
      <span class="wb-tabs__title">Settings</span>
    </button>
  </nav>

  <!-- Panels -->
  <div class="wb-tabs__panels">
    <section class="wb-tabs__panel" role="tabpanel" id="panel-0">Content 1</section>
    <section class="wb-tabs__panel" role="tabpanel" id="panel-1" hidden>Content 2</section>
  </div>
</wb-tabs>
```

## Events

### wb:tabs:change

Fired when a tab is activated.

```javascript
tabs.addEventListener('wb:tabs:change', (e) => {
  console.log('Active tab:', e.detail.index);
  console.log('Previous tab:', e.detail.previousIndex);
});
```

### wb:tab:close

Fired when a closable tab is closed.

```javascript
tabs.addEventListener('wb:tab:close', (e) => {
  console.log('Closed tab index:', e.detail.index);
  console.log('Closed tab title:', e.detail.title);
});
```

## JavaScript API

```javascript
const tabs = document.querySelector('wb-tabs');

// Switch to tab by index
tabs.setActiveTab(2);

// Get active tab index
const activeIndex = tabs.getActiveTab();

// Navigation
tabs.next();   // Next tab
tabs.prev();   // Previous tab
tabs.first();  // First tab
tabs.last();   // Last tab
```

## CSS Custom Properties

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-tabs-gap` | `0` | Gap between tabs |
| `--wb-tabs-border` | `1px solid var(--border-color)` | Tab list border |
| `--wb-tabs-tab-padding` | `0.75rem 1rem` | Tab padding |
| `--wb-tabs-tab-color` | `var(--text-secondary)` | Tab text color |
| `--wb-tabs-tab-active-color` | `var(--primary)` | Active tab color |
| `--wb-tabs-indicator-color` | `var(--primary)` | Active indicator color |
| `--wb-tabs-indicator-height` | `2px` | Active indicator height |
| `--wb-tabs-panel-padding` | `1rem 0` | Panel padding |
| `--wb-tab-badge-bg` | `var(--primary)` | Badge background |
| `--wb-tab-badge-color` | `#fff` | Badge text color |

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-tabs` | Container |
| `.wb-tabs__nav` | Tab list |
| `.wb-tabs__tab` | Tab button |
| `.wb-tabs__tab--active` | Active tab |
| `.wb-tabs__tab--disabled` | Disabled tab |
| `.wb-tabs__icon` | Tab icon |
| `.wb-tabs__title` | Tab title text |
| `.wb-tabs__badge` | Tab badge |
| `.wb-tabs__close` | Close button |
| `.wb-tabs__panels` | Panels container |
| `.wb-tabs__panel` | Individual panel |

## Accessibility

The component automatically handles:

- `role="tablist"` on navigation container
- `role="tab"` on buttons
- `role="tabpanel"` on content sections
- `aria-selected` for active tab
- `aria-disabled` for disabled tabs
- `aria-controls` and `aria-labelledby` relationships

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `←` / `→` | Navigate tabs |
| `Home` | First tab |
| `End` | Last tab |
| `Enter` / `Space` | Activate tab |

## Schema Files

- `src/wb-models/tabs.schema.json` - Parent container
- `src/wb-models/tab.schema.json` - Individual tab
