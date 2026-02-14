# Layout Components Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/components/layout/layout.readme.md)

## Overview
Web Behaviors (WB) provides flexible layout components using CSS Grid and Flexbox. All layout components are responsive and follow semantic HTML standards.

---

## Container Component

Flexible container with max-width and padding for content centering.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | string | "lg" | Container size: sm, md, lg, xl, full |
| `padding` | string | "1rem" | Container padding |
| `center` | boolean | true | Center container horizontally |

### Usage Examples

```html
<!-- Basic container -->
<wb-container size="lg">
  <p>Main content goes here</p>
</wb-container>

<!-- Full-width container -->
<wb-container size="full" padding="2rem">
  <div>Full width content</div>
</wb-container>
```

### Container Sizes

| Size | Max Width | Use Case |
|------|-----------|----------|
| `sm` | 640px | Mobile-first content |
| `md` | 768px | Tablet content |
| `lg` | 1024px | Desktop content |
| `xl` | 1280px | Large desktop content |
| `full` | 100% | Full-width sections |

---

## Grid Component

CSS Grid layout with responsive columns and flexible item placement.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `cols` | number | 3 | Number of columns |
| `gap` | string | "1rem" | Gap between grid items |
| `cols-md` | number | - | Columns at medium breakpoint |
| `cols-sm` | number | - | Columns at small breakpoint |
| `align` | string | "stretch" | Align items: start, center, end, stretch |
| `justify` | string | "stretch" | Justify items: start, center, end, stretch |

### Usage Examples

```html
<!-- Basic 3-column grid -->
<wb-grid cols="3" gap="1.5rem">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</wb-grid>

<!-- Responsive grid -->
<wb-grid cols="4" cols-md="2" cols-sm="1" gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</wb-grid>
```

### Grid Item Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `span` | number | Column span (1-12) |
| `span-md` | number | Column span at medium breakpoint |
| `span-sm` | number | Column span at small breakpoint |
| `row-span` | number | Row span |

```html
<wb-grid cols="4">
  <div span="2">Spans 2 columns</div>
  <div>Column 3</div>
  <div>Column 4</div>
</wb-grid>
```

---

## Flex Component

Flexbox layout container for flexible item arrangement.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `direction` | string | "row" | Direction: row, column, row-reverse, column-reverse |
| `wrap` | string | "wrap" | Wrap: nowrap, wrap, wrap-reverse |
| `gap` | string | "1rem" | Gap between flex items |
| `align` | string | "stretch" | Align items: start, center, end, stretch, baseline |
| `justify` | string | "start" | Justify content: start, center, end, between, around, evenly |

### Usage Examples

```html
<!-- Horizontal flex with space between -->
<wb-flex justify="between" align="center">
  <div>Left item</div>
  <div>Center item</div>
  <div>Right item</div>
</wb-flex>

<!-- Vertical flex stack -->
<wb-flex direction="column" gap="1.5rem">
  <header>Header</header>
  <main>Main content</main>
  <footer>Footer</footer>
</wb-flex>
```

### Flex Item Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `grow` | number | Flex grow factor |
| `shrink` | number | Flex shrink factor |
| `basis` | string | Flex basis |
| `order` | number | Display order |

---

## Stack Component

Vertical stack layout (shorthand for flex column).

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `gap` | string | "1rem" | Gap between stacked items |
| `align` | string | "stretch" | Align items: start, center, end, stretch |

### Usage Examples

```html
<!-- Basic vertical stack -->
<wb-stack gap="1.5rem">
  <h1>Title</h1>
  <p>Description paragraph</p>
  <wb-button>Action Button</wb-button>
</wb-stack>
```

---

## Center Component

Center content both horizontally and vertically.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `min-height` | string | "100vh" | Minimum height |
| `max-width` | string | "" | Maximum width |

### Usage Examples

```html
<!-- Full viewport center -->
<wb-center>
  <div>Centered content</div>
</wb-center>

<!-- Centered card -->
<wb-center max-width="400px">
  <wb-card>
    <h2>Login</h2>
    <wb-form>
      <wb-input label="Email" type="email"></wb-input>
      <wb-input label="Password" type="password"></wb-input>
      <wb-button type="submit">Sign In</wb-button>
    </wb-form>
  </wb-card>
</wb-center>
```

---

## Sidebar Layout Component

Two-column layout with sidebar and main content area.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sidebar-width` | string | "250px" | Sidebar width |
| `sidebar-position` | string | "left" | Position: left, right |
| `gap` | string | "1rem" | Gap between sidebar and content |
| `sticky` | boolean | false | Make sidebar sticky |

### Usage Examples

```html
<!-- Left sidebar layout -->
<wb-sidebar-layout sidebar-width="300px">
  <aside>
    <nav>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </aside>
  <main>
    <h1>Main Content</h1>
    <p>Page content goes here</p>
  </main>
</wb-sidebar-layout>
```

---

## Sidebar Component

Semantic sidebar container with optional collapse functionality.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | string | "250px" | Sidebar width |
| `position` | string | "left" | Position: left, right |
| `collapsible` | boolean | false | Allow collapse/expand |
| `collapsed` | boolean | false | Initial collapsed state |

### Usage Examples

```html
<!-- Collapsible sidebar -->
<wb-sidebar width="280px" collapsible>
  <nav>
    <wb-stack gap="0.5rem">
      <a href="#dashboard">Dashboard</a>
      <a href="#users">Users</a>
      <a href="#settings">Settings</a>
    </wb-stack>
  </nav>
</wb-sidebar>
```

---

## Fieldset Component

Semantic form grouping container.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `legend` | string | "" | Group legend/title |
| `disabled` | boolean | false | Disable all form controls |

### Usage Examples

```html
<!-- Form section grouping -->
<wb-fieldset legend="Personal Information">
  <wb-input label="First Name" required></wb-input>
  <wb-input label="Last Name" required></wb-input>
  <wb-input label="Email" type="email" required></wb-input>
</wb-fieldset>

<wb-fieldset legend="Preferences" disabled>
  <wb-checkbox label="Subscribe to newsletter"></wb-checkbox>
  <wb-checkbox label="Receive updates"></wb-checkbox>
</wb-fieldset>
```

---

## Divider Component

Horizontal or vertical divider line with optional text.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `direction` | string | "horizontal" | Direction: horizontal, vertical |
| `text` | string | "" | Divider text |
| `spacing` | string | "1rem" | Spacing around divider |

### Usage Examples

```html
<!-- Horizontal divider with text -->
<wb-divider text="OR" spacing="2rem"></wb-divider>

<!-- Vertical divider -->
<wb-divider direction="vertical"></wb-divider>
```

---

## Spacer Component

Flexible spacing element for layout control.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | string | "1rem" | Space size |
| `direction` | string | "vertical" | Direction: vertical, horizontal |

### Usage Examples

```html
<!-- Vertical spacing -->
<wb-spacer size="2rem"></wb-spacer>

<!-- Horizontal spacing -->
<wb-spacer size="1rem" direction="horizontal"></wb-spacer>
```

---

## Responsive Breakpoints

All layout components support responsive attributes:

| Breakpoint | Width | Suffix | Example |
|------------|-------|--------|---------|
| Small | < 640px | `-sm` | `cols-sm="1"` |
| Medium | 640px - 1024px | `-md` | `cols-md="2"` |
| Large | > 1024px | (default) | `cols="4"` |

```html
<!-- Responsive grid example -->
<wb-grid cols="4" cols-md="2" cols-sm="1" gap="1rem">
  <div>Responsive item</div>
  <div>Responsive item</div>
  <div>Responsive item</div>
  <div>Responsive item</div>
</wb-grid>
```

---

## Events

Layout components emit events for interaction:

| Event | Component | Description | Detail |
|-------|-----------|-------------|--------|
| `wb:sidebar:toggle` | Sidebar | Sidebar collapsed/expanded | `{ collapsed: boolean }` |
| `wb:sidebar-layout:resize` | Sidebar Layout | Sidebar resized | `{ width: string }` |

---

## Accessibility

Layout components include comprehensive accessibility features:

- **Semantic HTML**: Proper use of `<main>`, `<aside>`, `<nav>`, `<fieldset>`, `<legend>` elements
- **ARIA Support**: `aria-label`, `aria-expanded`, `aria-controls` attributes
- **Keyboard Navigation**: Logical tab order and keyboard interaction
- **Screen Readers**: Appropriate labels and descriptions for layout regions
- **Focus Management**: Visible focus indicators and logical focus flow

---

## Styling

Layout components use CSS custom properties for theming:

```css
:root {
  /* Container */
  --container-padding: 1rem;
  --container-max-width-lg: 1024px;
  --container-max-width-xl: 1280px;

  /* Grid */
  --grid-gap: 1rem;
  --grid-cols-default: 3;

  /* Flex */
  --flex-gap: 1rem;

  /* Sidebar */
  --sidebar-width: 250px;
  --sidebar-bg: var(--bg-secondary);
  --sidebar-border: var(--border-color);

  /* Divider */
  --divider-color: var(--border-color);
  --divider-text-color: var(--text-secondary);
}
```

---

## Implementation
- **Components**: Located in `src/wb-viewmodels/` (container.js, grid.js, flex.js, etc.)
- **Styles**: [src/styles/components/layout.css](../../src/styles/components/layout.css)
- **Schemas**: Layout component schemas in `src/wb-models/`
- **Tests**: Layout tests in `tests/behaviors/ui/layout.spec.ts`
