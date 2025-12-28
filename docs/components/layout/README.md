# Layout Components

## Overview

WB Behaviors provides flexible layout components using CSS Grid and Flexbox.

---

## Container (`container`)

Flexible container with max-width and padding.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | string | "lg" | Size: sm, md, lg, xl, full |
| `padding` | string | "1rem" | Container padding |
| `center` | boolean | true | Center container |

```html
<div data-wb="container" data-size="lg">
  <!-- Content -->
</div>
```

### Container Sizes
| Size | Max Width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `full` | 100% |

---

## Grid (`grid`)

CSS Grid layout with responsive columns.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `cols` | string | "3" | Number of columns |
| `gap` | string | "1rem" | Gap between items |
| `colsMd` | string | "" | Columns at medium breakpoint |
| `colsSm` | string | "" | Columns at small breakpoint |
| `align` | string | "stretch" | Align items |
| `justify` | string | "stretch" | Justify items |

```html
<div data-wb="grid" data-cols="3" data-gap="1.5rem" data-cols-sm="1">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Grid Child Properties

| Property | Type | Description |
|----------|------|-------------|
| `data-span` | string | Column span (1-12) |
| `data-span-md` | string | Span at medium |
| `data-span-sm` | string | Span at small |
| `data-row-span` | string | Row span |

```html
<div data-wb="grid" data-cols="4">
  <div data-span="2">Spans 2 columns</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>
```

---

## Flex (`flex`)

Flexbox layout container.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | string | "row" | Direction: row, column, row-reverse, column-reverse |
| `wrap` | string | "wrap" | Wrap: nowrap, wrap, wrap-reverse |
| `gap` | string | "1rem" | Gap between items |
| `align` | string | "stretch" | Align items: start, center, end, stretch, baseline |
| `justify` | string | "start" | Justify content: start, center, end, between, around, evenly |

```html
<div data-wb="flex" 
     data-direction="row" 
     data-justify="between" 
     data-align="center">
  <div>Left</div>
  <div>Center</div>
  <div>Right</div>
</div>
```

### Flex Child Properties

| Property | Type | Description |
|----------|------|-------------|
| `data-grow` | string | Flex grow (0-1) |
| `data-shrink` | string | Flex shrink (0-1) |
| `data-basis` | string | Flex basis |
| `data-order` | string | Display order |

---

## Stack (`stack`)

Vertical stack layout (shorthand for flex column).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `gap` | string | "1rem" | Gap between items |
| `align` | string | "stretch" | Align items |

```html
<div data-wb="stack" data-gap="1.5rem">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

---

## Center (`center`)

Center content horizontally and vertically.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minHeight` | string | "" | Minimum height |
| `maxWidth` | string | "" | Maximum width |

```html
<div data-wb="center" data-min-height="100vh">
  <div>Centered content</div>
</div>
```

---

## Sidebar Layout (`sidebarlayout`)

Two-column layout with sidebar.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sidebarWidth` | string | "250px" | Sidebar width |
| `sidebarPosition` | string | "left" | Position: left, right |
| `gap` | string | "1rem" | Gap between sidebar and content |
| `sticky` | boolean | false | Sticky sidebar |

```html
<div data-wb="sidebarlayout" data-sidebar-width="300px">
  <aside>Sidebar content</aside>
  <main>Main content</main>
</div>
```

---

## Sidebar (`sidebar`)

Semantic sidebar container.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | string | "250px" | Sidebar width |
| `position` | string | "left" | Position: left, right |
| `collapsible` | boolean | false | Allow collapse |
| `collapsed` | boolean | false | Initial collapsed |

```html
<aside data-wb="sidebar" data-width="280px" data-collapsible="true">
  <nav>Navigation</nav>
</aside>
```

**Semantic HTML:** `<aside>`

---

## Fieldset (`fieldset`)

Form grouping container.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `legend` | string | "" | Group legend/title |
| `disabled` | boolean | false | Disable all children |

```html
<fieldset data-wb="fieldset" data-legend="Personal Information">
  <input data-wb="input" data-label="Name">
  <input data-wb="input" data-label="Email">
</fieldset>
```

**Semantic HTML:** `<fieldset>` with `<legend>`

---

## Divider (`divider`)

Horizontal or vertical divider line.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | string | "horizontal" | Direction: horizontal, vertical |
| `text` | string | "" | Divider text |
| `color` | string | "" | Line color |
| `spacing` | string | "1rem" | Spacing around divider |

```html
<hr data-wb="divider" data-text="OR" data-spacing="2rem">
```

**Semantic HTML:** `<hr>`

---

## Spacer (`spacer`)

Flexible spacing element.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | string | "1rem" | Space size |
| `direction` | string | "vertical" | Direction: vertical, horizontal |

```html
<div data-wb="spacer" data-size="2rem"></div>
```

---

## Responsive Breakpoints

All layout components support responsive properties:

| Breakpoint | Width | Suffix |
|------------|-------|--------|
| Small | < 640px | `-sm` |
| Medium | 640px - 1024px | `-md` |
| Large | > 1024px | (default) |

```html
<div data-wb="grid" 
     data-cols="4" 
     data-cols-md="2" 
     data-cols-sm="1">
</div>
```

---

## CSS Classes

```css
/* Container */
.wb-container { }
.wb-container--sm { max-width: 640px; }
.wb-container--md { max-width: 768px; }
.wb-container--lg { max-width: 1024px; }
.wb-container--xl { max-width: 1280px; }

/* Grid */
.wb-grid { display: grid; }
.wb-grid--cols-1 { grid-template-columns: repeat(1, 1fr); }
.wb-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
.wb-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
.wb-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Flex */
.wb-flex { display: flex; }
.wb-flex--row { flex-direction: row; }
.wb-flex--column { flex-direction: column; }
.wb-flex--wrap { flex-wrap: wrap; }

/* Stack */
.wb-stack { display: flex; flex-direction: column; }

/* Center */
.wb-center { display: grid; place-items: center; }
```
