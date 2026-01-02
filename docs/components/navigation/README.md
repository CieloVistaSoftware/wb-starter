# Navigation Components

## Overview

Web Behaviors (WB) provides accessible navigation components using semantic `<nav>` elements.

---

## Tabs (`tabs`)

Tabbed content interface.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `active` | string | "0" | Active tab index |
| `variant` | string | "default" | Variant: default, pills, underline |
| `vertical` | boolean | false | Vertical orientation |
| `justified` | boolean | false | Equal width tabs |

```html
<div data-wb="tabs" data-variant="underline">
  <!-- Tab panels defined by children -->
</div>
```

### Tab Structure
```html
<div data-wb="tabs">
  <nav class="wb-tabs__list" role="tablist">
    <button role="tab" aria-selected="true">Tab 1</button>
    <button role="tab" aria-selected="false">Tab 2</button>
  </nav>
  <div class="wb-tabs__panels">
    <div role="tabpanel">Content 1</div>
    <div role="tabpanel" hidden>Content 2</div>
  </div>
</div>
```

**Semantic HTML:** `<nav>` with `role="tablist"`

---

## Accordion (`accordion`)

Collapsible content sections.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `multiple` | boolean | false | Allow multiple open |
| `activeIndex` | string | "0" | Initially open index |
| `variant` | string | "default" | Variant: default, bordered, flush |

```html
<div data-wb="accordion" data-multiple="false">
  <!-- Sections defined by children -->
</div>
```

### Accordion Structure
```html
<div data-wb="accordion">
  <details open>
    <summary>Section 1</summary>
    <div class="wb-accordion__content">Content 1</div>
  </details>
  <details>
    <summary>Section 2</summary>
    <div class="wb-accordion__content">Content 2</div>
  </details>
</div>
```

**Semantic HTML:** `<details>` with `<summary>`

---

## Breadcrumb (`breadcrumb`)

Breadcrumb navigation trail.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | string | "" | Comma-separated items |
| `separator` | string | "/" | Separator character |
| `showHome` | boolean | true | Show home icon |

```html
<nav data-wb="breadcrumb" 
     data-items="Home,Products,Electronics,Phones"
     data-separator="/">
</nav>
```

### Breadcrumb with Links
```html
<nav data-wb="breadcrumb" aria-label="Breadcrumb">
  <ol class="wb-breadcrumb__list">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>
```

**Semantic HTML:** `<nav>` with `<ol>`

---

## Menu (`menu`)

Navigation menu.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | string | "" | JSON array of menu items |
| `variant` | string | "horizontal" | Variant: horizontal, vertical |
| `collapsible` | boolean | false | Collapsible on mobile |
| `sticky` | boolean | false | Sticky position |

```html
<nav data-wb="menu" data-variant="horizontal">
  <ul class="wb-menu__list">
    <li><a href="/" class="wb-menu__link">Home</a></li>
    <li><a href="/about" class="wb-menu__link">About</a></li>
    <li class="wb-menu__item--has-submenu">
      <button class="wb-menu__link">Products</button>
      <ul class="wb-menu__submenu">
        <li><a href="/products/a">Product A</a></li>
        <li><a href="/products/b">Product B</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

**Semantic HTML:** `<nav>` with `<ul>`

---

## Pagination (`pagination`)

Page navigation.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `current` | string | "1" | Current page |
| `total` | string | "10" | Total pages |
| `siblings` | string | "1" | Siblings to show |
| `showFirst` | boolean | true | Show first button |
| `showLast` | boolean | true | Show last button |
| `showPrev` | boolean | true | Show prev button |
| `showNext` | boolean | true | Show next button |

```html
<nav data-wb="pagination" 
     data-current="5" 
     data-total="20"
     aria-label="Pagination">
</nav>
```

**Semantic HTML:** `<nav>` with `<ul>`

---

## Stepper (`stepper`)

Multi-step progress indicator.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `current` | string | "1" | Current step (1-indexed) |
| `steps` | string | "" | Comma-separated step labels |
| `variant` | string | "horizontal" | Variant: horizontal, vertical |
| `clickable` | boolean | false | Steps are clickable |

```html
<nav data-wb="stepper" 
     data-steps="Account,Profile,Review,Complete"
     data-current="2">
</nav>
```

### Stepper States
- **completed** - Green checkmark
- **current** - Highlighted
- **upcoming** - Grayed out

---

## Steps (`steps`)

Simple step indicator (numbered).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `total` | string | "4" | Total steps |
| `current` | string | "1" | Current step |
| `size` | string | "md" | Size: sm, md, lg |
| `color` | string | "" | Active color |

```html
<div data-wb="steps" 
     data-total="5" 
     data-current="3">
</div>
```

---

## Link (`link`)

Anchor link with smooth scroll.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | string | "" | Target anchor |
| `text` | string | "" | Link text |
| `offset` | string | "0" | Scroll offset (for fixed headers) |
| `behavior` | string | "smooth" | Scroll behavior: smooth, instant |

```html
<a data-wb="link" 
   data-href="#section-2" 
   data-text="Jump to Section 2"
   data-offset="80">
</a>
```

---

## Backtotop (`backtotop`)

Scroll to top button.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `threshold` | string | "300" | Show after scrolling (px) |
| `behavior` | string | "smooth" | Scroll behavior |
| `position` | string | "bottom-right" | Button position |
| `icon` | string | "↑" | Button icon |

```html
<button data-wb="backtotop" 
        data-threshold="400">
</button>
```

---

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:tabs:change` | Tab changed | `{ tabs, index, tab }` |
| `wb:accordion:toggle` | Section toggled | `{ accordion, index, open }` |
| `wb:pagination:change` | Page changed | `{ pagination, page }` |
| `wb:stepper:change` | Step changed | `{ stepper, step }` |
| `wb:menu:toggle` | Submenu toggled | `{ menu, item, open }` |

---

## Keyboard Navigation

All navigation components support keyboard navigation:

### Tabs
| Key | Action |
|-----|--------|
| `←` `→` | Navigate tabs |
| `Home` | First tab |
| `End` | Last tab |
| `Enter` `Space` | Activate tab |

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
| `←` `→` | Navigate items |
| `↑` `↓` | Submenu items |
| `Enter` `Space` | Activate/open |
| `Escape` | Close submenu |

---

## CSS Classes

```css
/* Tabs */
.wb-tabs { }
.wb-tabs__list { }
.wb-tabs__tab { }
.wb-tabs__tab--active { }
.wb-tabs__panels { }
.wb-tabs__panel { }
.wb-tabs--pills { }
.wb-tabs--underline { }
.wb-tabs--vertical { }

/* Accordion */
.wb-accordion { }
.wb-accordion__item { }
.wb-accordion__header { }
.wb-accordion__title { }
.wb-accordion__icon { }
.wb-accordion__content { }
.wb-accordion__item--open { }

/* Breadcrumb */
.wb-breadcrumb { }
.wb-breadcrumb__list { }
.wb-breadcrumb__item { }
.wb-breadcrumb__link { }
.wb-breadcrumb__separator { }

/* Menu */
.wb-menu { }
.wb-menu__list { }
.wb-menu__item { }
.wb-menu__link { }
.wb-menu__submenu { }
.wb-menu--horizontal { }
.wb-menu--vertical { }

/* Pagination */
.wb-pagination { }
.wb-pagination__list { }
.wb-pagination__item { }
.wb-pagination__link { }
.wb-pagination__link--active { }
.wb-pagination__prev { }
.wb-pagination__next { }

/* Stepper */
.wb-stepper { }
.wb-stepper__step { }
.wb-stepper__step--completed { }
.wb-stepper__step--current { }
.wb-stepper__step--upcoming { }
.wb-stepper__label { }
.wb-stepper__connector { }
```
