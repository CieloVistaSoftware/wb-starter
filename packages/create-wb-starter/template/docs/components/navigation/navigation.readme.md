# Navigation Components Documentation
[Edit this file](./navigation.readme.md)

## Overview
WB-Starter provides accessible navigation components using semantic HTML elements. All navigation components follow ARIA standards and support keyboard navigation.

---

## Tabs Component

Tabbed content interface with keyboard navigation and ARIA support.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active` | number | 0 | Active tab index (0-based) |
| `variant` | string | "default" | Style variant: default, pills, underline |
| `vertical` | boolean | false | Vertical orientation |
| `justified` | boolean | false | Equal width tabs |

### Usage Examples

```html
<!-- Basic tabs -->
<div x-tabs>
  <div label="Home">Welcome to our site</div>
  <div label="About">Learn more about us</div>
  <div label="Contact">Get in touch</div>
</div>
<!-- Pills variant -->
<div x-tabs
  variant="pills"
  active="1">
  <div label="Tab 1">Content 1</div>
  <div label="Tab 2">Content 2</div>
</div>
<!-- Vertical tabs -->
<div x-tabs vertical>
  <div label="Section A">Section A content</div>
  <div label="Section B">Section B content</div>
</div>
```

### Programmatic API

```javascript
const tabs = document.querySelector('x-tabs');

// Switch to tab by index
tabs.setAttribute('active', '2');

// Listen for tab changes
tabs.addEventListener('wb:tabs:change', (event) => {
  console.log('Active tab:', event.detail.index);
});
```

---

## Accordion Component

Collapsible content sections with smooth animations.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `multiple` | boolean | false | Allow multiple sections open |
| `active-index` | number | 0 | Initially open section index |
| `variant` | string | "default" | Style variant: default, bordered, flush |

### Usage Examples

```html
<!-- Single accordion -->
<div x-accordion>
  <div label="Section 1">
    <p>Content for section 1</p>
  </div>
  <div label="Section 2">
    <p>Content for section 2</p>
  </div>
</div>
<!-- Multiple sections open -->
<div x-accordion multiple>
  <div label="FAQ 1">Answer 1</div>
  <div label="FAQ 2">Answer 2</div>
  <div label="FAQ 3">Answer 3</div>
</div>
```

---

## Breadcrumb Component

Navigation breadcrumb trail with semantic markup.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `separator` | string | "/" | Separator character |
| `show-home` | boolean | true | Show home icon/link |

### Usage Examples

```html
<!-- Simple breadcrumb -->
<div x-breadcrumb>
  <li href="/">Home</li>
  <li href="/products">Products</li>
  <li>Current Page</li>
</div>
<!-- With custom separator -->
<div x-breadcrumb separator=">">
  <li href="/">Home</li>
  <li href="/docs">Documentation</li>
  <li href="/docs/components">Components</li>
  <li>Breadcrumb</li>
</div>
```

---

## Menu Component

Navigation menu with optional submenus.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | string | "horizontal" | Layout: horizontal, vertical |
| `collapsible` | boolean | false | Collapsible on mobile |
| `sticky` | boolean | false | Sticky positioning |

### Usage Examples

```html
<!-- Horizontal menu -->
<menu>
  <li href="/">Home</li>
  <li href="/about">About</li>
  <li>
    <span slot="label">Products</span>
    <menu slot="submenu">
      <li href="/products/a">Product A</li>
      <li href="/products/b">Product B</li>
    </menu>
  </li>
</menu>
<!-- Vertical menu -->
<menu variant="vertical">
  <li href="#dashboard">Dashboard</li>
  <li href="#users">Users</li>
  <li href="#settings">Settings</li>
</menu>
```

---

## Pagination Component

Page navigation with customizable display options.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current` | number | 1 | Current page number |
| `total` | number | 10 | Total number of pages |
| `siblings` | number | 1 | Number of sibling pages to show |
| `show-first` | boolean | true | Show first page button |
| `show-last` | boolean | true | Show last page button |
| `show-prev` | boolean | true | Show previous button |
| `show-next` | boolean | true | Show next button |

### Usage Examples

```html
<!-- Basic pagination -->
<div x-pagination
  current="5"
  total="20">
</div>
<!-- Compact pagination -->
<div x-pagination
  current="3"
  total="8"
  siblings="0">
</div>
<!-- Full pagination -->
<div x-pagination
  current="10"
  total="50"
  siblings="2">
</div>
```

### Programmatic API

```javascript
const pagination = document.querySelector('x-pagination');

// Go to specific page
pagination.setAttribute('current', '15');

// Listen for page changes
pagination.addEventListener('wb:pagination:change', (event) => {
  console.log('New page:', event.detail.page);
  // Load new page content
  loadPage(event.detail.page);
});
```

---

## Stepper Component

Multi-step progress indicator for wizards and processes.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current` | number | 1 | Current step (1-based) |
| `variant` | string | "horizontal" | Layout: horizontal, vertical |
| `clickable` | boolean | false | Allow clicking on steps |

### Usage Examples

```html
<!-- Horizontal stepper -->
<div x-stepper current="2">
  <li label="Account Setup"></li>
  <li label="Profile Information"></li>
  <li label="Review & Submit"></li>
  <li label="Complete"></li>
</div>
<!-- Vertical stepper -->
<div x-stepper
  variant="vertical"
  current="3">
  <li label="Step 1">Step 1 content</li>
  <li label="Step 2">Step 2 content</li>
  <li label="Step 3">Step 3 content</li>
</div>
```

### Step States

| State | Description | Visual |
|-------|-------------|--------|
| `completed` | Step finished | Green checkmark |
| `current` | Active step | Highlighted |
| `upcoming` | Future step | Grayed out |

---

## Steps Component

Simple numbered step indicator.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `total` | number | 4 | Total number of steps |
| `current` | number | 1 | Current step number |
| `size` | string | "md" | Size: sm, md, lg |

### Usage Examples

```html
<!-- Basic steps -->
<div x-steps
  total="5"
  current="3">
</div>
<!-- Large steps -->
<div x-steps
  total="4"
  current="2"
  size="lg">
</div>
```

---

## Link Component

Smooth scroll anchor link with offset support.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `href` | string | "" | Target anchor ID |
| `offset` | number | 0 | Scroll offset for fixed headers |
| `behavior` | string | "smooth" | Scroll behavior: smooth, instant |

### Usage Examples

```html
<!-- Basic anchor link -->
<div href="#section-2">Jump to Section 2</div>
<!-- With offset for fixed header -->
<div
  href="#features"
  offset="80">
  View Features
</div>
```

---

## Back to Top Component

Scroll to top button that appears after scrolling.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | number | 300 | Show after scrolling (pixels) |
| `behavior` | string | "smooth" | Scroll behavior |
| `position` | string | "bottom-right" | Button position |
| `icon` | string | "↑" | Button icon/text |

### Usage Examples

```html
<!-- Basic back to top -->
<div></div>
<!-- Custom threshold and icon -->
<div
  threshold="500"
  icon="⬆️">
</div>
<!-- Different position -->
<div position="bottom-left"></div>
```

---

## Events

Navigation components emit events for interaction:

| Event | Component | Description | Detail |
|-------|-----------|-------------|--------|
| `wb:tabs:change` | Tabs | Tab selection changed | `{ index, tab }` |
| `wb:accordion:toggle` | Accordion | Section opened/closed | `{ index, open }` |
| `wb:pagination:change` | Pagination | Page changed | `{ page }` |
| `wb:stepper:change` | Stepper | Step changed | `{ step }` |
| `wb:menu:toggle` | Menu | Submenu opened/closed | `{ item, open }` |

---

## Keyboard Navigation

All navigation components support comprehensive keyboard navigation:

### Tabs
| Key | Action |
|-----|--------|
| `←` `→` | Navigate between tabs |
| `Home` | First tab |
| `End` | Last tab |
| `Enter` `Space` | Activate selected tab |

### Accordion
| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate sections |
| `Enter` `Space` | Toggle section |
| `Home` | First section |
| `End` | Last section |

### Menu
| Key | Action |
|-----|--------|
| `←` `→` | Navigate menu items |
| `↑` `↓` | Navigate submenu items |
| `Enter` `Space` | Activate/open item |
| `Escape` | Close submenu |

---

## Accessibility

Navigation components include comprehensive accessibility features:

- **Semantic HTML**: Proper use of `<nav>`, `<ul>`, `<ol>`, `<li>` elements
- **ARIA Support**: `role`, `aria-selected`, `aria-expanded`, `aria-current` attributes
- **Screen Readers**: Appropriate labels and live regions for dynamic content
- **Keyboard Support**: Full keyboard navigation with logical tab order
- **Focus Management**: Visible focus indicators and proper focus trapping

---

## Styling

Navigation components use CSS custom properties for theming:

```css
:root {
  /* Tabs */
  --tabs-border-color: var(--border-color);
  --tabs-active-color: var(--primary-color);
  --tabs-hover-bg: var(--bg-hover);

  /* Accordion */
  --accordion-border-color: var(--border-color);
  --accordion-header-bg: var(--bg-secondary);
  --accordion-content-padding: 1rem;

  /* Breadcrumb */
  --breadcrumb-separator-color: var(--text-secondary);
  --breadcrumb-link-color: var(--primary-color);

  /* Menu */
  --menu-bg: var(--bg-primary);
  --menu-link-color: var(--text-primary);
  --menu-hover-bg: var(--bg-hover);

  /* Pagination */
  --pagination-border-color: var(--border-color);
  --pagination-active-bg: var(--primary-color);
  --pagination-active-color: var(--text-on-primary);

  /* Stepper */
  --stepper-completed-color: var(--success-color);
  --stepper-current-color: var(--primary-color);
  --stepper-upcoming-color: var(--text-secondary);
}
```

---

## Implementation
- **Components**: Located in `src/wb-viewmodels/` (tabs.js, accordion.js, menu.js, etc.)
- **Styles**: [src/styles/components/navigation.css](../../../src/styles/behaviors/navbar.css)
- **Schemas**: Navigation component schemas in `src/wb-models/`
- **Tests**: Navigation tests in `tests/behaviors/ui/navigation.spec.ts`
