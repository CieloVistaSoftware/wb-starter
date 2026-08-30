# WB-Starter Attribute Naming Standard

**Version:** 1.1  
**Created:** 2026-01-03  
**Updated:** 2026-01-05  
**Status:** Active

---

## Golden Rule: Attributes Over Nested Markup

> **Attribute name = what it is for**  
> **Schema = where it goes**

Users provide simple attribute values. The schema defines how those values become DOM structure. Users should **never need to know behavior internals**.

### The Principle

```html
<!-- ✅ CLEAN: User just sets values -->
<div x-hero
  title="Explore the Universe"
  subtitle="Your journey begins"
  cta="Launch Mission">
</div>
<!-- ❌ UGLY: User must hand-author internal structure and classes -->
<div x-hero variant="cosmic">
  <h1 class="x-hero__title">Explore the Universe</h1>
  <p class="x-hero__subtitle">Your journey begins</p>
  <button class="x-hero__cta">Launch Mission</button>
</div>
```

### When to Use What

| Content Type | Use | Example |
|--------------|-----|-------|
| Simple text values | **Attributes** | `title="Hello"` |
| Enum choices | **Attributes** | `variant="cosmic"` |
| Boolean flags | **Attributes** | `elevated`, `dismissible` |
| Arbitrary/rich content | **Body (children)** | `<article>Any HTML here</article>` |

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
15. [Examples by Behavior](#examples-by-behavior)

---

## Element Naming Convention

WB uses three patterns for applying behaviors:

| Pattern | Meaning | Use Case | Example |
|---------|---------|----------|---------|
| `<wb-{name}>` | **Standalone** | Behavior gets its own tag | `<div x-cardpricing>` |
| `x-behavior` | **Modifier** | Behavior decorates an existing tag | `x-ripple` |

> **Both are composition.** The split is only about where the behavior is named —
> whether it gets its own tag or decorates a tag that already exists. Nothing
> subclasses anything: `<div x-cardpricing>` does not extend a `card` class, the
> `cardpricing` behavior function decorates the element in place, exactly as
> `x-ripple` does.
>
> This used to be labelled IS-A / HAS-A and needed a paragraph explaining that the
> label did not mean what it says. Renamed under **#465**: the architecture is
> composition, so the vocabulary is too.

```html
<!-- Standalone: gets its own tag (noun) -->
<articlestats
  value="1,234"
  label="Users"
  trend="up">
</div>
<!-- Modifier: decorates an existing tag (verb) -->
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
| `src` | `<img>`, `<video>`, `<audio>` | Resource URL | `<article x-cardimage>`, `<div x-avatar>`, `<video>` |
| `href` | `<a>`, `<link>` | Link destination | `<div x-cardlink>`, `<a>` |
| `alt` | `<img>` | Alternative text | `<article x-cardimage>`, `<div x-avatar>` |
| `poster` | `<video>` | Preview image | `<video>` |

### Form Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `placeholder` | `<input>`, `<textarea>` | Hint text | `<div x-searchfield>`, `<input>` |
| `disabled` | Form elements | Disabled state | Any interactive behavior |
| `readonly` | `<input>`, `<textarea>` | Read-only state | `<input>` |
| `required` | Form elements | Required field | Form behaviors |
| `name` | Form elements | Form field name | Form behaviors |
| `value` | Form elements | Current value | `<div x-rating>`, `<div x-slider>` |
| `checked` | `<input type="checkbox/radio">` | Checked state | `<input type="checkbox">`, `<div x-switch>` |
| `min` | `<input type="number/range">` | Minimum value | `<input x-stepper>`, `<div x-slider>` |
| `max` | `<input type="number/range">` | Maximum value | `<input x-stepper>`, `<div x-slider>` |
| `step` | `<input type="number/range">` | Step increment | `<input x-stepper>`, `<div x-slider>` |
| `pattern` | `<input>` | Validation pattern | `<input>` |
| `maxlength` | `<input>`, `<textarea>` | Max characters | `<input>`, `<textarea>` |
| `autocomplete` | `<input>` | Autocomplete hint | `<input>` |

### Boolean Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `hidden` | Global | Hide element | Any behavior |
| `open` | `<details>`, `<dialog>` | Open state | `<div x-collapse>`, `<dialog>` |
| `autoplay` | `<video>`, `<audio>` | Auto-start | `<video>`, `<audio>` |
| `loop` | `<video>`, `<audio>` | Loop playback | `<video>`, `<audio>` |
| `muted` | `<video>`, `<audio>` | Muted state | `<video>`, `<audio>` |
| `controls` | `<video>`, `<audio>` | Show controls | `<video>`, `<audio>` |

### Layout Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `width` | Various | Element width | Media behaviors |
| `height` | Various | Element height | Media behaviors |
| `loading` | `<img>`, `<iframe>` | Loading strategy | `<article x-cardimage>` |

---

## Native Attributes to AVOID

These native attributes have meanings that **conflict** with typical behavior usage:

### ❌ `title` - DO NOT USE for headings

> Note: `<article>`'s own real schema currently uses `title` for its heading text
> (see `src/wb-models/card.schema.json`) — this rule describes the intended
> convention, not every shipped behavior. Tracked under #222 (docs-wide
> attribute-naming audit).

```html
<!-- BAD: Creates browser tooltip, not a heading -->
<div x-cardpricing title="Pro Plan">
  <!-- GOOD: Use 'heading' or behavior-specific name -->
  <div x-cardpricing heading="Pro Plan">
    <div x-cardpricing plan="Pro">
```

**Why:** Native `title` creates a browser tooltip on hover. Using it for heading text causes unintended tooltips.

### ❌ `type` - DO NOT USE for variants
```html
<!-- BAD: Collides with input/button type -->
<div x-alert type="warning">
  <!-- GOOD: Use 'variant' for styling variants -->
  <div x-alert variant="warning">
```

**Why:** Native `type` has specific meaning on `<input>`, `<button>`, `<script>`, `<style>`. Using it for variants causes confusion.

### ❌ `content` - AVOID
```html
<!-- BAD: Conflicts with meta content, CSS content -->
<article content="Body text">
  <!-- GOOD: Use children or a specific attribute -->
  <article>Body text</article>
  <article description="Body text">
```

### ❌ `data` - AVOID as attribute name
```html
<!-- BAD: Too generic, conflicts with data-* pattern -->
<div data="[1,2,3]">
  <!-- GOOD: Use specific name or data-* -->
  <div points="1,2,3">
    <div points='[1,2,3]'>
```

### ❌ `style` - DO NOT USE
```html
<!-- BAD: Conflicts with inline styles -->
<article style="minimal">
  <!-- GOOD: Use 'variant' -->
  <article variant="minimal">
```

### ❌ `class` - DO NOT USE
```html
<!-- BAD: Conflicts with CSS classes -->
<div x-cardnotification class="warning">
  <!-- GOOD: Use 'variant' -->
  <div x-cardnotification variant="warning">
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
<div x-tabs items="Home,About,Contact">
  <nav x-breadcrumb items="Home,Products,Shoes">
    <input x-tags items="JavaScript,HTML,CSS">
```

### JSON Arrays
```html
<!-- For arrays needing preservation (commas in values, etc.) -->
<div x-tabs items='["Home","About","Contact Us"]'>
```

### Objects
```html
<!-- Single object -->
<div x-cardprofile user='{"name":"John","role":"Admin"}'>
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
  <div src="/api/metrics.json">
```

### Embedded JSON (for large data)
```html
<table>
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
</table>
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
<articlestats
  trend-value="+5%"
  per-page="10">
  <!-- ❌ WRONG -->
  <articlestats
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
<div x-grid columns="4"> <!-- Number of columns -->
  <!-- List = plural noun -->
  <div x-tabs items="Home,About,Contact"> <!-- Multiple items -->
    <!-- Single = singular noun -->
    <table column="name"> <!-- Single column reference -->
```

### Boolean Attributes

Boolean attributes follow HTML5 convention - **presence = true, absence = false**:

```html
<!-- ✅ CORRECT: Boolean present = true -->
<div x-cardpricing featured> <!-- featured = true -->
  <div x-alert dismissible> <!-- dismissible = true -->
    <button disabled> <!-- disabled = true -->
      <!-- ✅ CORRECT: Absent = false -->
      <div x-cardpricing> <!-- featured = false (default) -->
        <!-- ⚠️ ALLOWED but verbose -->
        <div x-cardpricing featured="true"> <!-- Works, but unnecessary -->
          <div x-cardpricing featured=""> <!-- Also works -->
            <!-- ❌ WRONG: No "false" value -->
            <div x-cardpricing featured="false"> <!-- Don't do this, just omit -->
```

### Enum Values

Use consistent enum values across all behaviors:

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
<dialog
  aria-label="Settings dialog"
  aria-describedby="modal-desc"
  role="dialog">
</dialog>
<div x-tabs aria-label="Main navigation">
</nav>
```

### Behavior-Managed ARIA

Some ARIA attributes are set automatically by behaviors:

| Behavior | Auto-Set ARIA |
|-----------|---------------|
| `<div x-alert>` | `role="alert"` |
| `<dialog>` | `role="dialog"`, `aria-modal="true"` |
| `<nav x-tabs>` | `role="tablist"`, `role="tab"`, `role="tabpanel"` |
| `<progress>` | `role="progressbar"`, `aria-valuenow` |
| `<div x-switch>` | `role="switch"`, `aria-checked` |

### Label Attributes

```html
<!-- Use 'label' for visible label text -->
<div x-switch label="Enable notifications">
  <!-- Use 'aria-label' for screen-reader-only label -->
  <button
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
<div x-grid
  gap="1.5rem"
  min-width="280px">
  <!-- Unitless -->
  <nav
    x-pagination
    total="100"
    per-page="10"
    current="3">
    <progress
      value="75"
      max="100">
      <!-- Time: milliseconds for JS, seconds for CSS -->
      <div x-toast duration="5000"> <!-- 5 seconds -->
        <div
          x-animate="fade"
          x-delay="0.3">
          <!-- 0.3 seconds -->
```

### Number Formatting

Display values can include formatting - they're strings, not numbers:

```html
<!-- Display value (string) - can have formatting -->
<articlestats
  value="$1,234.56"
  label="Revenue">
  <articlestats
    value="99.9%"
    label="Uptime">
    <!-- Numeric value (number) - no formatting -->
    <progress
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

wb-starter is light DOM only — composition over inheritance, no Shadow DOM, no `<slot>` mechanism. Element children ARE the behavior's body content, exactly as authored:

```html
<article heading="Title">
  <p>This paragraph is the card's body content.</p>
</article>
<div x-alert variant="warning">
  <strong>Warning:</strong> This is the alert content.
</div>
```

There's no named-slot equivalent for routing children into specific internal regions (a header area, a footer area, etc.) — that's what dedicated attributes are for (`heading`, `subheading`, `footer`, ...; see [Standard Custom Attributes](#standard-custom-attributes)). If a behavior needs to place content in more than one internal region, give it more than one attribute — never a `slot="…"` attribute.

---

## CSS Custom Properties

### Naming Convention

Behaviors should expose CSS custom properties for theming:

```css
/* Pattern: --{behavior}-{property} */
--card-padding: 1rem;
--card-radius: 8px;
--card-shadow: 0 2px 8px rgba(0,0,0,0.1);

/* Pattern: --{behavior}-{element}-{property} */
--card-header-padding: 0.75rem 1rem;
--card-header-background: var(--bg-secondary);

/* Pattern: --{behavior}-{state}-{property} */
--card-hover-shadow: 0 4px 16px rgba(0,0,0,0.15);
--card-active-border-color: var(--primary);
```

### Override via Style Attribute

```html
<article style="--card-padding: 2rem; --card-radius: 16px;"> Custom styled card </article>
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
<article
  title="Hello"
  elevated>
  Content
</article>
<div x-alert
  variant="warning"
  message="Caution!">
</div>
```

Modifier behaviors (applied to any element) didn't change — they were
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

## Examples by Behavior

### Cards
```html
<article
  heading="Welcome"
  subheading="Get started"
  elevated
  hoverable>
  Card content here
</article>
<div x-cardpricing
  plan="Pro"
  price="$29"
  period="/mo"
  featured
  cta="Get Started">
</div>
<articlestats
  value="1,234"
  label="Users"
  icon="👥"
  trend="up"
  trend-value="+12%">
</div>
<div x-cardimage
  src="https://picsum.photos/seed/photo/600/400"
  alt="Description"
  heading="Photo Title"
  loading="lazy">
</article>
```

### Feedback
```html
<div x-alert
  variant="warning"
  heading="Caution"
  message="Check your input"
  dismissible>
</div>
<span x-badge variant="success">Active</div>
<span x-avatar
  src="https://picsum.photos/seed/user/600/400"
  alt="John Doe"
  size="lg"
  status="online">
</div>
<div x-toast
  variant="success"
  message="Saved successfully!"
  duration="3000">
</div>
```

### Navigation
```html
<nav x-breadcrumb items="Home,Products,Shoes"></nav>
<div x-tabs
  items="Overview,Features,Pricing"
  active="0">
</nav>
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
<span x-rating
  value="4"
  max="5"
  icon="⭐">
</div>
<div x-switch
  label="Enable notifications"
  checked>
</div>
<div x-slider
  min="0"
  max="100"
  value="50"
  step="5">
</div>
```

### Media
```html
<video
  src="movie.mp4"
  poster="https://picsum.photos/seed/preview/800/450"
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
<div x-timeline items='[
  {"date": "2024-01", "label": "Project Start"},
  {"date": "2024-06", "label": "Beta Launch"}
]'>
</div>
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
  src="https://picsum.photos/seed/large/600/400"
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

When adding new behaviors or attributes:

1. **Check native HTML first** - Does this attribute exist natively?
2. **Same meaning = same name** - If native attr fits, use it
3. **Different meaning = new name** - Never repurpose native attrs
4. **Be specific** - `plan` > `title` for pricing cards
5. **Be consistent** - Use `variant` for all style variants
6. **Document it** - Add to schema with description

### Prohibited Patterns

```html
<!-- ❌ NEVER DO THIS -->
<article title="Heading"> <!-- Use heading -->
  <div x-alert type="warning"> <!-- Use variant -->
    <article content="..."> <!-- Use children or a specific attr -->
      <article style="minimal"> <!-- Use variant -->
        <article class="special"> <!-- Use variant or boolean -->
          <article data="[...]"> <!-- Use data-* pattern -->
```

---

*Document maintained by Cielo Vista Software*  
*Last updated: 2026-01-03*
