# WB-Starter Attribute Naming Standard

**Version:** 1.1  
**Created:** 2026-01-03  
**Updated:** 2026-01-05  
**Status:** Active

---

## Golden Rule: Attributes Over Nested Markup

> **Attribute name = what it is for**  
> **Schema = where it goes**

Users provide simple attribute values. The schema defines how those values become DOM structure. Users should **never need to know component internals**.

### The Principle

```html
<!-- ✅ CLEAN: User just sets values -->
<wb-hero
  title="Explore the Universe"
  subtitle="Your journey begins"
  cta="Launch Mission">
</wb-hero>
<!-- ❌ UGLY: User must hand-author internal structure and classes -->
<wb-hero variant="cosmic">
  <h1 class="wb-hero__title">Explore the Universe</h1>
  <p class="wb-hero__subtitle">Your journey begins</p>
  <button class="wb-hero__cta">Launch Mission</button>
</wb-hero>
```

### When to Use What

| Content Type | Use | Example |
|--------------|-----|-------|
| Simple text values | **Attributes** | `title="Hello"` |
| Enum choices | **Attributes** | `variant="cosmic"` |
| Boolean flags | **Attributes** | `elevated`, `dismissible` |
| Arbitrary/rich content | **Body (children)** | `<wb-card>Any HTML here</wb-card>` |

### The Contract

| Layer | Responsibility |
|-------|---------------|
| **User** | Provides attribute values |
| **Schema** | Defines what tags/structure those values become |
| **Framework** | Builds the DOM from schema |

```
User Input          Schema Transform       DOM Output
───────────         ────────────────       ──────────
title="Hello"   →   "tag": "h1"        →   <h1>Hello</h1>
subtitle="World" →  "tag": "p"         →   <p>World</p>
cta="Click"     →   "tag": "button"    →   <button>Click</button>
```

**User doesn't care about internals. Attributes in, DOM out.**

---

## Core Rule

> **If a native HTML attribute exists with the same meaning, use the native name.**
> 
> If no native equivalent exists, create a clear, semantic name that doesn't collide with native attributes.

---

## Table of Contents

1. [Element Naming Convention](#element-naming-convention)
2. [Native Attributes to Reuse](#native-attributes-to-reuse)
3. [Native Attributes to Avoid](#native-attributes-to-avoid)
4. [Standard Custom Attributes](#standard-custom-attributes)
5. [Data Injection](#injection)
6. [Extension Attributes](#extension-attributes)
7. [Naming Conventions](#naming-conventions)
8. [Accessibility Attributes](#accessibility-attributes)
9. [Units and Values](#units-and-values)
10. [CSS Custom Properties](#css-custom-properties)
11. [Migration from Legacy Syntax](#migration-from-legacy-syntax)
12. [Error Handling](#error-handling)
13. [IDE Support](#ide-support)
14. [Quick Reference](#quick-reference)
15. [Examples by Component](#examples-by-component)

---

## Element Naming Convention

WB uses three patterns for applying behaviors:

| Pattern | Meaning | Use Case | Example |
|---------|---------|----------|---------|
| `<wb-{name}>` | **IS-A** | Standalone components | `<wb-cardpricing>` |
| `x-behavior` | **HAS-A** | Extensions (adds capability) | `x-ripple` |
| `x-as-component` | **BECOMES** | Morphing (transforms element) | `x-as-card` |

```html
<!-- IS-A: Custom element (noun) -->
<wb-cardstats
  value="1,234"
  label="Users"
  trend="up">
</wb-cardstats>
<!-- HAS-A: Extension (verb/modifier) -->
<button
  x-ripple
  x-tooltip="Save changes">
  Save
</button>
<!-- BECOMES: Morph -->
<article x-as-card>Plain article becomes styled card</article>
```

---

## Native Attributes to Reuse

These native HTML attributes should be used **with the same meaning** on custom elements:

### Resource Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `src` | `<img>`, `<video>`, `<audio>` | Resource URL | `<wb-cardimage>`, `<wb-avatar>`, `<video>` |
| `href` | `<a>`, `<link>` | Link destination | `<wb-cardlink>`, `<a>` |
| `alt` | `<img>` | Alternative text | `<wb-cardimage>`, `<wb-avatar>` |
| `poster` | `<video>` | Preview image | `<video>` |

### Form Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `placeholder` | `<input>`, `<textarea>` | Hint text | `<wb-search>`, `<input>` |
| `disabled` | Form elements | Disabled state | Any interactive component |
| `readonly` | `<input>`, `<textarea>` | Read-only state | `<input>` |
| `required` | Form elements | Required field | Form components |
| `name` | Form elements | Form field name | Form components |
| `value` | Form elements | Current value | `<wb-rating>`, `<wb-slider>` |
| `checked` | `<input type="checkbox/radio">` | Checked state | `<input type="checkbox">`, `<wb-switch>` |
| `min` | `<input type="number/range">` | Minimum value | `<input x-stepper>`, `<wb-slider>` |
| `max` | `<input type="number/range">` | Maximum value | `<input x-stepper>`, `<wb-slider>` |
| `step` | `<input type="number/range">` | Step increment | `<input x-stepper>`, `<wb-slider>` |
| `pattern` | `<input>` | Validation pattern | `<input>` |
| `maxlength` | `<input>`, `<textarea>` | Max characters | `<input>`, `<textarea>` |
| `autocomplete` | `<input>` | Autocomplete hint | `<input>` |

### Boolean Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `hidden` | Global | Hide element | Any component |
| `open` | `<details>`, `<dialog>` | Open state | `<wb-collapse>`, `<wb-modal>` |
| `autoplay` | `<video>`, `<audio>` | Auto-start | `<video>`, `<audio>` |
| `loop` | `<video>`, `<audio>` | Loop playback | `<video>`, `<audio>` |
| `muted` | `<video>`, `<audio>` | Muted state | `<video>`, `<audio>` |
| `controls` | `<video>`, `<audio>` | Show controls | `<video>`, `<audio>` |

### Layout Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `width` | Various | Element width | Media components |
| `height` | Various | Element height | Media components |
| `loading` | `<img>`, `<iframe>` | Loading strategy | `<wb-cardimage>` |

---

## Native Attributes to AVOID

These native attributes have meanings that **conflict** with typical component usage:

### ❌ `title` - DO NOT USE for headings

> Note: `<wb-card>`'s own real schema currently uses `title` for its heading text
> (see `src/wb-models/card.schema.json`) — this rule describes the intended
> convention, not every shipped component. Tracked under #222 (docs-wide
> attribute-naming audit).

```html
<!-- BAD: Creates browser tooltip, not a heading -->
<wb-cardpricing title="Pro Plan">
  <!-- GOOD: Use 'heading' or component-specific name -->
  <wb-cardpricing heading="Pro Plan">
    <wb-cardpricing plan="Pro">
```

**Why:** Native `title` creates a browser tooltip on hover. Using it for heading text causes unintended tooltips.

### ❌ `type` - DO NOT USE for variants
```html
<!-- BAD: Collides with input/button type -->
<wb-alert type="warning">
  <!-- GOOD: Use 'variant' for styling variants -->
  <wb-alert variant="warning">
```

**Why:** Native `type` has specific meaning on `<input>`, `<button>`, `<script>`, `<style>`. Using it for variants causes confusion.

### ❌ `content` - AVOID
```html
<!-- BAD: Conflicts with meta content, CSS content -->
<wb-card content="Body text">
  <!-- GOOD: Use children or a specific attribute -->
  <wb-card>Body text</wb-card>
  <wb-card description="Body text">
```

### ❌ `data` - AVOID as attribute name
```html
<!-- BAD: Too generic, conflicts with data-* pattern -->
<wb-chart data="[1,2,3]">
  <!-- GOOD: Use specific name or data-* -->
  <wb-chart points="1,2,3">
    <wb-chart points='[1,2,3]'>
```

### ❌ `style` - DO NOT USE
```html
<!-- BAD: Conflicts with inline styles -->
<wb-card style="minimal">
  <!-- GOOD: Use 'variant' -->
  <wb-card variant="minimal">
```

### ❌ `class` - DO NOT USE
```html
<!-- BAD: Conflicts with CSS classes -->
<wb-cardnotification class="warning">
  <!-- GOOD: Use 'variant' -->
  <wb-cardnotification variant="warning">
```

---

## Standard Custom Attributes

These are WB-standard attributes that have no native equivalent:

### Visual/Styling
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `variant` | enum | Style variant | `variant="warning"` |
| `size` | enum | Size variant | `size="lg"` |
| `elevated` | boolean | Add shadow/depth | `elevated` |
| `rounded` | boolean | Round corners | `rounded` |
| `outlined` | boolean | Outline style | `outlined` |
| `filled` | boolean | Filled style | `filled` |
| `compact` | boolean | Compact spacing | `compact` |

### Text Content
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `heading` | string | Primary heading | `heading="Welcome"` |
| `subheading` | string | Secondary heading | `subheading="Get started"` |
| `label` | string | Short label text | `label="Users"` |
| `description` | string | Longer description | `description="Click to edit"` |
| `message` | string | Alert/notification text | `message="Saved!"` |
| `icon` | string | Icon (emoji or name) | `icon="👥"` |

### Behavior
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `dismissible` | boolean | Can be dismissed | `dismissible` |
| `closable` | boolean | Has close button | `closable` |
| `clickable` | boolean | Entire element clickable | `clickable` |
| `hoverable` | boolean | Has hover effects | `hoverable` |
| `expandable` | boolean | Can expand | `expandable` |
| `collapsible` | boolean | Can collapse | `collapsible` |
| `sortable` | boolean | Can be sorted | `sortable` |
| `filterable` | boolean | Can be filtered | `filterable` |
| `editable` | boolean | Can be edited | `editable` |
| `selectable` | boolean | Can be selected | `selectable` |
| `draggable` | boolean | Can be dragged | `draggable` (native too) |
| `resizable` | boolean | Can be resized | `resizable` |

### Position/Layout
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `position` | enum | Position placement | `position="left"` |
| `align` | enum | Alignment | `align="center"` |
| `gap` | string | Spacing between items | `gap="1rem"` |
| `columns` | number | Number of columns | `columns="4"` |

### State
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `active` | boolean | Active state | `active` |
| `selected` | boolean | Selected state | `selected` |
| `loading` | boolean | Loading state | `loading` |
| `error` | boolean | Error state | `error` |
| `success` | boolean | Success state | `success` |

### Data Display
| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `trend` | enum | Trend direction | `trend="up"` |
| `trend-value` | string | Trend amount | `trend-value="+5%"` |
| `featured` | boolean | Featured/highlighted | `featured` |
| `badge` | string | Badge text | `badge="NEW"` |

---

## Data Injection

Use `data-*` attributes for complex data (arrays, objects, external sources):

### Simple Arrays (CSV)
```html
<!-- For simple string lists, CSV is fine -->
<wb-tabs items="Home,About,Contact">
  <nav x-breadcrumb items="Home,Products,Shoes">
    <input x-tags items="JavaScript,HTML,CSS">
```

### JSON Arrays
```html
<!-- For arrays needing preservation (commas in values, etc.) -->
<wb-tabs items='["Home","About","Contact Us"]'>
```

### Objects
```html
<!-- Single object -->
<wb-cardprofile user='{"name":"John","role":"Admin"}'>
  <!-- Array of objects -->
  <table rows='[
  {"name":"Alice","email":"alice@example.com"},
  {"name":"Bob","email":"bob@example.com"}
]'>
```

### External Data
```html
<!-- Load from URL -->
<table src="/api/users.json">
  <wb-chart src="/api/metrics.json">
```

### Embedded JSON (for large data)
```html
<wb-table>
  <script type="application/json">
    {
      "columns": ["Name", "Email"],
      "pagination": {
        "perPage": 10
      },
      "filters": {
        ...
      }
    }
  </script>
</wb-table>
```

---

## Extension Attributes

Extensions use `x-` prefix with optional value:

### Boolean Extensions (no value needed)
```html
<button x-ripple>Click me</button>
<img x-lazy>
<div x-draggable>
```

### Configured Extensions
```html
<button x-tooltip="Save changes">
  <div x-animate="bounce">
    <div x-delay="0.5">
      <img x-placeholder="blur">
```

### Morphing (x-as-)
```html
<article x-as-card>
  <ul x-as-timeline>
    <blockquote x-as-testimonial>
```

---

## Naming Conventions

### Attribute Name Format

| Format | Use For | Example |
|--------|---------|--------|
| **kebab-case** | Multi-word attributes | `trend-value`, `per-page`, `background-image` |
| **lowercase** | Single words | `heading`, `variant`, `size` |
| **Avoid camelCase** | Never in HTML attributes | ~~`trendValue`~~ |

```html
<!-- ✅ CORRECT -->
<wb-cardstats
  trend-value="+5%"
  per-page="10">
  <!-- ❌ WRONG -->
  <wb-cardstats
    trendValue="+5%"
    perPage="10">
```

### Pluralization Rules

| Singular | Plural | When to Use |
|----------|--------|-------------|
| `item` | `items` | Plural when accepting list/array |
| `column` | `columns` | Plural for count, singular for single |
| `row` | `rows` | Plural when multiple |

```html
<!-- Count = singular noun -->
<wb-grid columns="4"> <!-- Number of columns -->
  <!-- List = plural noun -->
  <wb-tabs items="Home,About,Contact"> <!-- Multiple items -->
    <!-- Single = singular noun -->
    <wb-table column="name"> <!-- Single column reference -->
```

### Boolean Attributes

Boolean attributes follow HTML5 convention - **presence = true, absence = false**:

```html
<!-- ✅ CORRECT: Boolean present = true -->
<wb-cardpricing featured> <!-- featured = true -->
  <wb-alert dismissible> <!-- dismissible = true -->
    <button disabled> <!-- disabled = true -->
      <!-- ✅ CORRECT: Absent = false -->
      <wb-cardpricing> <!-- featured = false (default) -->
        <!-- ⚠️ ALLOWED but verbose -->
        <wb-cardpricing featured="true"> <!-- Works, but unnecessary -->
          <wb-cardpricing featured=""> <!-- Also works -->
            <!-- ❌ WRONG: No "false" value -->
            <wb-cardpricing featured="false"> <!-- Don't do this, just omit -->
```

### Enum Values

Use consistent enum values across all components:

**Variants (style):**
```
primary, secondary, success, warning, error, info, ghost, outline
```

**Sizes:**
```
xs, sm, md, lg, xl, 2xl
```

**Positions:**
```
top, bottom, left, right, center
start, end (for RTL support)
top-left, top-right, bottom-left, bottom-right
```

**Directions:**
```
up, down, left, right
horizontal, vertical
```

**Status:**
```
online, offline, busy, away, idle
```

**Trends:**
```
up, down, flat, neutral
```

---

## Accessibility Attributes

### Native ARIA - Use As-Is

ARIA attributes should pass through unchanged:

```html
<wb-modal
  aria-label="Settings dialog"
  aria-describedby="modal-desc"
  role="dialog">
</wb-modal>
<wb-tabs aria-label="Main navigation">
</wb-tabs>
```

### Component-Managed ARIA

Some ARIA attributes are set automatically by behaviors:

| Component | Auto-Set ARIA |
|-----------|---------------|
| `<wb-alert>` | `role="alert"` |
| `<wb-modal>` | `role="dialog"`, `aria-modal="true"` |
| `<wb-tabs>` | `role="tablist"`, `role="tab"`, `role="tabpanel"` |
| `<wb-progress>` | `role="progressbar"`, `aria-valuenow` |
| `<wb-switch>` | `role="switch"`, `aria-checked` |

### Label Attributes

```html
<!-- Use 'label' for visible label text -->
<wb-switch label="Enable notifications">
  <!-- Use 'aria-label' for screen-reader-only label -->
  <wb-button
    aria-label="Close"
    icon="✕">
    <!-- Use 'aria-labelledby' to reference another element -->
    <section aria-labelledby="section-title">
      <h2 id="section-title">Features</h2>
    </section>
```

---

## Units and Values

### When to Include Units

| Attribute | Unit Handling | Example |
|-----------|---------------|--------|
| `width`, `height` | Include unit | `width="300px"`, `width="50%"` |
| `gap` | Include unit | `gap="1rem"` |
| `columns` | Unitless (count) | `columns="4"` |
| `duration` | Milliseconds assumed | `duration="3000"` (3 seconds) |
| `delay` | Seconds assumed | `delay="0.5"` |
| `value`, `min`, `max` | Unitless (number) | `value="75"` |
| `per-page` | Unitless (count) | `per-page="10"` |

```html
<!-- Units included -->
<wb-grid
  gap="1.5rem"
  min-width="280px">
  <!-- Unitless -->
  <nav
    x-pagination
    total="100"
    per-page="10"
    current="3">
    <wb-progress
      value="75"
      max="100">
      <!-- Time: milliseconds for JS, seconds for CSS -->
      <wb-toast duration="5000"> <!-- 5 seconds -->
        <div
          x-animate="fade"
          x-delay="0.3">
          <!-- 0.3 seconds -->
```

### Number Formatting

Display values can include formatting - they're strings, not numbers:

```html
<!-- Display value (string) - can have formatting -->
<wb-cardstats
  value="$1,234.56"
  label="Revenue">
  <wb-cardstats
    value="99.9%"
    label="Uptime">
    <!-- Numeric value (number) - no formatting -->
    <wb-progress
      value="75"
      max="100">
      <input
        x-stepper
        value="5"
        min="0"
        max="10">
```

---

## Content (Children)

wb-starter is light DOM only — composition over inheritance, no Shadow DOM, no `<slot>` mechanism. Element children ARE the component's body content, exactly as authored:

```html
<wb-card heading="Title">
  <p>This paragraph is the card's body content.</p>
</wb-card>
<wb-alert variant="warning">
  <strong>Warning:</strong> This is the alert content.
</wb-alert>
```

There's no named-slot equivalent for routing children into specific internal regions (a header area, a footer area, etc.) — that's what dedicated attributes are for (`heading`, `subheading`, `footer`, ...; see [Standard Custom Attributes](#standard-custom-attributes)). If a component needs to place content in more than one internal region, give it more than one attribute — never a `slot="…"` attribute.

---

## CSS Custom Properties

### Naming Convention

Components should expose CSS custom properties for theming:

```css
/* Pattern: --{component}-{property} */
--card-padding: 1rem;
--card-radius: 8px;
--card-shadow: 0 2px 8px rgba(0,0,0,0.1);

/* Pattern: --{component}-{element}-{property} */
--card-header-padding: 0.75rem 1rem;
--card-header-background: var(--bg-secondary);

/* Pattern: --{component}-{state}-{property} */
--card-hover-shadow: 0 4px 16px rgba(0,0,0,0.15);
--card-active-border-color: var(--primary);
```

### Override via Style Attribute

```html
<wb-card style="--card-padding: 2rem; --card-radius: 16px;"> Custom styled card </wb-card>
```

---

## Migration from Legacy Syntax

### Before (Legacy — explicit `x-behavior="…"` on a plain element)
```html
<div
  x-behavior="card"
  title="Hello"
  elevated>
  Content
</div>
<div
  x-behavior="alert"
  type="warning"
  message="Caution!">
</div>
```

### After (v3 — current standard)
```html
<wb-card
  title="Hello"
  elevated>
  Content
</wb-card>
<wb-alert
  variant="warning"
  message="Caution!">
</wb-alert>
```

Modifier behaviors (HAS-A, applied to any element) didn't change — they were
already the direct `x-{name}` form, not `x-behavior="{name}"`:
```html
<button x-ripple x-tooltip="Click me">
  Save
</button>
```

### Migration Checklist

| Old Pattern | New Pattern |
|-------------|-------------|
| `x-behavior="{name}"` | `<wb-{name}>` custom element tag |
| `data-{prop}` (behavior config) | `{prop}` (plain attribute) |
| `type` (for variants) | `variant` |
| `x-{modifier}` (e.g. `x-ripple`) | unchanged — always was the direct attribute form |

---


## Error Handling

See [Error Message Standard](./ERROR-MESSAGE.md) for all error message and error handling conventions.

---

## IDE Support

### VS Code Custom Data

The project includes custom element definitions for VS Code autocomplete:

```
data/custom-elements.json    # Generated from schemas
.vscode/settings.json        # Points to custom data
```

### Generating Definitions

```bash
npm run generate:vscode-data
```

This creates autocomplete for:
- Custom element tags
- Attribute names
- Attribute values (enums)
- Descriptions/documentation

---

## Quick Reference

### Attribute Selection Flowchart

```
Need an attribute?
       │
       ▼
Does native HTML have this attribute with SAME meaning?
       │
    ┌──┴──┐
   YES    NO
    │      │
    ▼      ▼
Use native   Does native HTML have this 
name         attribute with DIFFERENT meaning?
    │              │
    │         ┌────┴────┐
    │        YES        NO
    │         │          │
    │         ▼          ▼
    │    AVOID native   Create semantic
    │    (see list)     custom attribute
    │         │          │
    │         ▼          ▼
    │    Use standard   Use descriptive
    │    alternative    name
    │         │          │
    └─────────┴──────────┘
              │
              ▼
         Attribute Ready
```

### Cheat Sheet

| Want to... | Use | NOT |
|------------|-----|-----|
| Set heading text | `heading` | `title` ❌ |
| Set style variant | `variant` | `type` ❌ |
| Set image source | `src` | - |
| Set link URL | `href` | - |
| Set tooltip | `tooltip` or native `title` | - |
| Pass JSON object | `data-*` | `content` ❌ |
| Disable element | `disabled` | - |
| Show/hide | `hidden` or `open` | - |

---

## Examples by Component

### Cards
```html
<wb-card
  heading="Welcome"
  subheading="Get started"
  elevated
  hoverable>
  Card content here
</wb-card>
<wb-cardpricing
  plan="Pro"
  price="$29"
  period="/mo"
  featured
  cta="Get Started">
</wb-cardpricing>
<wb-cardstats
  value="1,234"
  label="Users"
  icon="👥"
  trend="up"
  trend-value="+12%">
</wb-cardstats>
<wb-cardimage
  src="photo.jpg"
  alt="Description"
  heading="Photo Title"
  loading="lazy">
</wb-cardimage>
```

### Feedback
```html
<wb-alert
  variant="warning"
  heading="Caution"
  message="Check your input"
  dismissible>
</wb-alert>
<wb-badge variant="success">Active</wb-badge>
<wb-avatar
  src="user.jpg"
  alt="John Doe"
  size="lg"
  status="online">
</wb-avatar>
<wb-toast
  variant="success"
  message="Saved successfully!"
  duration="3000">
</wb-toast>
```

### Navigation
```html
<nav x-breadcrumb items="Home,Products,Shoes"></nav>
<wb-tabs
  items="Overview,Features,Pricing"
  active="0">
</wb-tabs>
<nav
  x-pagination
  total="100"
  per-page="10"
  current="3">
</nav>
<div
  x-steps
  items="Cart,Shipping,Payment"
  current="1">
</div>
```

### Forms
```html
<input
  placeholder="Enter your name"
  required
  maxlength="100"
  pattern="[A-Za-z ]+">
<wb-rating
  value="4"
  max="5"
  icon="⭐">
</wb-rating>
<wb-switch
  label="Enable notifications"
  checked>
</wb-switch>
<wb-slider
  min="0"
  max="100"
  value="50"
  step="5">
</wb-slider>
```

### Media
```html
<video
  src="movie.mp4"
  poster="preview.jpg"
  controls
  autoplay
  muted>
</video>
<div
  x-gallery
  columns="4"
  gap="1rem"
  images='[
  {"src": "1.jpg", "alt": "Photo 1"},
  {"src": "2.jpg", "alt": "Photo 2"}
]'>
</div>
```

### Data Display
```html
<table
  columns='["Name","Email","Role"]'
  rows='[
    ["Alice","alice@example.com","Admin"],
    ["Bob","bob@example.com","User"]
  ]'
  sortable
  hoverable>
</table>
<wb-timeline items='[
  {"date": "2024-01", "label": "Project Start"},
  {"date": "2024-06", "label": "Beta Launch"}
]'>
</wb-timeline>
```

### Extensions
```html
<!-- Ripple + Tooltip -->
<button
  x-ripple
  x-tooltip="Save your work">
  Save
</button>
<!-- Animations -->
<div
  x-animate="bounce"
  x-delay="0.5">
  Animated
</div>
<!-- Lazy loading -->
<img
  src="large.jpg"
  x-lazy
  x-placeholder="blur">
<!-- Draggable + Resizable -->
<div
  x-draggable
  x-resizable>
  Drag and resize me
</div>
<!-- Morphing -->
<article x-as-card>Becomes a card</article>
<ul x-as-timeline>Becomes a timeline</ul>
```

---

## Validation Rules

When adding new components or attributes:

1. **Check native HTML first** - Does this attribute exist natively?
2. **Same meaning = same name** - If native attr fits, use it
3. **Different meaning = new name** - Never repurpose native attrs
4. **Be specific** - `plan` > `title` for pricing cards
5. **Be consistent** - Use `variant` for all style variants
6. **Document it** - Add to schema with description

### Prohibited Patterns

```html
<!-- ❌ NEVER DO THIS -->
<wb-card title="Heading"> <!-- Use heading -->
  <wb-alert type="warning"> <!-- Use variant -->
    <wb-card content="..."> <!-- Use children or a specific attr -->
      <wb-card style="minimal"> <!-- Use variant -->
        <wb-card class="special"> <!-- Use variant or boolean -->
          <wb-card data="[...]"> <!-- Use data-* pattern -->
```

---

*Document maintained by Cielo Vista Software*  
*Last updated: 2026-01-03*
