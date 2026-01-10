# Web Behaviors (WB) Attribute Naming Standard

**Version:** 1.1  
**Created:** 2026-01-03  
**Updated:** 2026-01-05  
**Status:** Active

---

## Golden Rule: Attributes Over Slots

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

<!-- ❌ UGLY: User must know internal structure -->
<wb-hero variant="cosmic">
  <h1 slot="title">Explore the Universe</h1>
  <p slot="subtitle">Your journey begins</p>
  <button slot="cta">Launch Mission</button>
</wb-hero>
```

### When to Use What

| Content Type | Use | Example |
|--------------|-----|-------|
| Simple text values | **Attributes** | `title="Hello"` |
| Enum choices | **Attributes** | `variant="cosmic"` |
| Boolean flags | **Attributes** | `elevated`, `dismissible` |
| Arbitrary/rich content | **Body (slot)** | `<wb-card>Any HTML here</wb-card>` |

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
5. [Data Injection](#data-injection)
6. [Extension Attributes](#extension-attributes)
7. [Naming Conventions](#naming-conventions)
8. [Accessibility Attributes](#accessibility-attributes)
9. [Units and Values](#units-and-values)
10. [Slots and Content](#slots-and-content)
11. [CSS Custom Properties](#css-custom-properties)
12. [Migration from data-wb](#migration-from-data-wb)
13. [Error Handling](#error-handling)
14. [IDE Support](#ide-support)
15. [Quick Reference](#quick-reference)
16. [Examples by Component](#examples-by-component)

---

## Element Naming Convention

WB uses three patterns for applying behaviors:

| Pattern | Meaning | Use Case | Example |
|---------|---------|----------|---------|
| `<component-name>` | **IS-A** | Standalone components | `<price-card>` |
| `x-behavior` | **HAS-A** | Extensions (adds capability) | `x-ripple` |
| `x-as-component` | **BECOMES** | Morphing (transforms element) | `x-as-card` |

```html
<!-- IS-A: Custom element (noun) -->
<stats-card value="1,234" label="Users" trend="up"></stats-card>

<!-- HAS-A: Extension (verb/modifier) -->
<button x-ripple x-tooltip="Save changes">Save</button>

<!-- BECOMES: Morph -->
<article x-as-card>Plain article becomes styled card</article>
```

---

## Native Attributes to Reuse

These native HTML attributes should be used **with the same meaning** on custom elements:

### Resource Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `src` | `<img>`, `<video>`, `<audio>` | Resource URL | `<card-image>`, `<avatar-el>`, `<video-player>` |
| `href` | `<a>`, `<link>` | Link destination | `<card-link>`, `<nav-item>` |
| `alt` | `<img>` | Alternative text | `<card-image>`, `<avatar-el>` |
| `poster` | `<video>` | Preview image | `<video-player>` |

### Form Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `placeholder` | `<input>`, `<textarea>` | Hint text | `<search-input>`, `<text-field>` |
| `disabled` | Form elements | Disabled state | Any interactive component |
| `readonly` | `<input>`, `<textarea>` | Read-only state | `<text-field>` |
| `required` | Form elements | Required field | Form components |
| `name` | Form elements | Form field name | Form components |
| `value` | Form elements | Current value | `<rating-el>`, `<range-slider>` |
| `checked` | `<input type="checkbox/radio">` | Checked state | `<checkbox-el>`, `<switch-el>` |
| `min` | `<input type="number/range">` | Minimum value | `<stepper-el>`, `<range-slider>` |
| `max` | `<input type="number/range">` | Maximum value | `<stepper-el>`, `<range-slider>` |
| `step` | `<input type="number/range">` | Step increment | `<stepper-el>`, `<range-slider>` |
| `pattern` | `<input>` | Validation pattern | `<text-field>` |
| `maxlength` | `<input>`, `<textarea>` | Max characters | `<text-field>` |
| `autocomplete` | `<input>` | Autocomplete hint | `<text-field>` |

### Boolean Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `hidden` | Global | Hide element | Any component |
| `open` | `<details>`, `<dialog>` | Open state | `<collapse-el>`, `<modal-el>` |
| `autoplay` | `<video>`, `<audio>` | Auto-start | `<video-player>`, `<audio-player>` |
| `loop` | `<video>`, `<audio>` | Loop playback | `<video-player>`, `<audio-player>` |
| `muted` | `<video>`, `<audio>` | Muted state | `<video-player>`, `<audio-player>` |
| `controls` | `<video>`, `<audio>` | Show controls | `<video-player>`, `<audio-player>` |

### Layout Attributes
| Attribute | Native Element | Meaning | Use On |
|-----------|---------------|---------|--------|
| `width` | Various | Element width | Media components |
| `height` | Various | Element height | Media components |
| `loading` | `<img>`, `<iframe>` | Loading strategy | `<card-image>` |

---

## Native Attributes to AVOID

These native attributes have meanings that **conflict** with typical component usage:

### ❌ `title` - DO NOT USE for headings
```html
<!-- BAD: Creates browser tooltip, not a heading -->
<price-card title="Pro Plan">

<!-- GOOD: Use 'heading' or component-specific name -->
<price-card heading="Pro Plan">
<price-card plan="Pro">
```

**Why:** Native `title` creates a browser tooltip on hover. Using it for heading text causes unintended tooltips.

### ❌ `type` - DO NOT USE for variants
```html
<!-- BAD: Collides with input/button type -->
<alert-box type="warning">

<!-- GOOD: Use 'variant' for styling variants -->
<alert-box variant="warning">
```

**Why:** Native `type` has specific meaning on `<input>`, `<button>`, `<script>`, `<style>`. Using it for variants causes confusion.

### ❌ `content` - AVOID
```html
<!-- BAD: Conflicts with meta content, CSS content -->
<card-el content="Body text">

<!-- GOOD: Use slot or specific name -->
<card-el>Body text</card-el>
<card-el description="Body text">
```

### ❌ `data` - AVOID as attribute name
```html
<!-- BAD: Too generic, conflicts with data-* pattern -->
<chart-el data="[1,2,3]">

<!-- GOOD: Use specific name or data-* -->
<chart-el points="1,2,3">
<chart-el data-points='[1,2,3]'>
```

### ❌ `style` - DO NOT USE
```html
<!-- BAD: Conflicts with inline styles -->
<card-el style="minimal">

<!-- GOOD: Use 'variant' -->
<card-el variant="minimal">
```

### ❌ `class` - DO NOT USE
```html
<!-- BAD: Conflicts with CSS classes -->
<notification-el class="warning">

<!-- GOOD: Use 'variant' -->
<notification-el variant="warning">
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
<nav-tabs items="Home,About,Contact">
<breadcrumb-nav items="Home,Products,Shoes">
<tag-list items="JavaScript,HTML,CSS">
```

### JSON Arrays
```html
<!-- For arrays needing preservation (commas in values, etc.) -->
<nav-tabs data-items='["Home","About","Contact Us"]'>
```

### Objects
```html
<!-- Single object -->
<user-card data-user='{"name":"John","role":"Admin"}'>

<!-- Array of objects -->
<data-table data-rows='[
  {"name":"Alice","email":"alice@example.com"},
  {"name":"Bob","email":"bob@example.com"}
]'>
```

### External Data
```html
<!-- Load from URL -->
<data-table data-src="/api/users.json">
<chart-widget data-src="/api/metrics.json">
```

### Embedded JSON (for large data)
```html
<complex-widget>
  <script type="application/json">
    {
      "columns": ["Name", "Email"],
      "pagination": {"perPage": 10},
      "filters": {...}
    }
  </script>
</complex-widget>
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
<stats-card trend-value="+5%" per-page="10">

<!-- ❌ WRONG -->
<stats-card trendValue="+5%" perPage="10">
```

### Pluralization Rules

| Singular | Plural | When to Use |
|----------|--------|-------------|
| `item` | `items` | Plural when accepting list/array |
| `column` | `columns` | Plural for count, singular for single |
| `row` | `rows` | Plural when multiple |

```html
<!-- Count = singular noun -->
<grid-layout columns="4">              <!-- Number of columns -->

<!-- List = plural noun -->
<nav-tabs items="Home,About,Contact">  <!-- Multiple items -->

<!-- Single = singular noun -->
<detail-row column="name">             <!-- Single column reference -->
```

### Boolean Attributes

Boolean attributes follow HTML5 convention - **presence = true, absence = false**:

```html
<!-- ✅ CORRECT: Boolean present = true -->
<price-card featured>           <!-- featured = true -->
<alert-box dismissible>         <!-- dismissible = true -->
<button disabled>               <!-- disabled = true -->

<!-- ✅ CORRECT: Absent = false -->
<price-card>                    <!-- featured = false (default) -->

<!-- ⚠️ ALLOWED but verbose -->
<price-card featured="true">    <!-- Works, but unnecessary -->
<price-card featured="">        <!-- Also works -->

<!-- ❌ WRONG: No "false" value -->
<price-card featured="false">   <!-- Don't do this, just omit -->
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
<modal-el 
  aria-label="Settings dialog"
  aria-describedby="modal-desc"
  role="dialog">
</modal-el>

<nav-tabs aria-label="Main navigation">
</nav-tabs>
```

### Component-Managed ARIA

Some ARIA attributes are set automatically by behaviors:

| Component | Auto-Set ARIA |
|-----------|---------------|
| `<alert-box>` | `role="alert"` |
| `<modal-el>` | `role="dialog"`, `aria-modal="true"` |
| `<nav-tabs>` | `role="tablist"`, `role="tab"`, `role="tabpanel"` |
| `<progress-bar>` | `role="progressbar"`, `aria-valuenow` |
| `<switch-el>` | `role="switch"`, `aria-checked` |

### Label Attributes

```html
<!-- Use 'label' for visible label text -->
<switch-el label="Enable notifications">

<!-- Use 'aria-label' for screen-reader-only label -->
<icon-button aria-label="Close" icon="✕">

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
<grid-layout gap="1.5rem" min-width="280px">

<!-- Unitless -->
<pagination-el total="100" per-page="10" current="3">
<progress-bar value="75" max="100">

<!-- Time: milliseconds for JS, seconds for CSS -->
<toast-el duration="5000">        <!-- 5 seconds -->
<div x-animate="fade" x-delay="0.3">  <!-- 0.3 seconds -->
```

### Number Formatting

Display values can include formatting - they're strings, not numbers:

```html
<!-- Display value (string) - can have formatting -->
<stats-card value="$1,234.56" label="Revenue">
<stats-card value="99.9%" label="Uptime">

<!-- Numeric value (number) - no formatting -->
<progress-bar value="75" max="100">
<stepper-el value="5" min="0" max="10">
```

---

## Slots and Content

### Default Slot (Children)

Element children become the default slot:

```html
<basic-card heading="Title">
  <p>This paragraph goes in the default slot (main content)</p>
</basic-card>

<alert-box variant="warning">
  <strong>Warning:</strong> This is the alert content.
</alert-box>
```

### Named Slots

Use `slot` attribute for named slots:

```html
<complex-card>
  <img slot="image" src="photo.jpg">
  <h3 slot="header">Card Title</h3>
  <p>Default slot content</p>
  <button slot="footer">Action</button>
</complex-card>
```

### Slot Naming Convention

| Slot Name | Purpose |
|-----------|---------|
| `header` | Header area content |
| `footer` | Footer area content |
| `image` | Image/media area |
| `icon` | Icon area |
| `actions` | Action buttons area |
| `prefix` | Before main content |
| `suffix` | After main content |

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
<basic-card style="--card-padding: 2rem; --card-radius: 16px;">
  Custom styled card
</basic-card>
```

---

## Migration from data-wb

### Before (Legacy)
```html
<div data-wb="card" data-title="Hello" data-elevated>
  Content
</div>

<div data-wb="alert" data-type="warning" data-message="Caution!">
</div>

<button data-wb="ripple tooltip" data-tooltip="Click me">
  Save
</button>
```

### After (New Standard)
```html
<basic-card heading="Hello" elevated>
  Content
</basic-card>

<alert-box variant="warning" message="Caution!">
</alert-box>

<button x-ripple x-tooltip="Click me">
  Save
</button>
```

### Migration Checklist

| Old Pattern | New Pattern |
|-------------|-------------|
| `data-wb="{behavior}"` | `<{behavior}-el>` or `<{behavior}-{type}>` |
| `data-title` | `heading` |
| `data-type` (for variants) | `variant` |
| `data-{prop}` (simple) | `{prop}` (native-style) |
| `data-{prop}` (JSON) | `data-{prop}` (keep as-is) |
| `data-wb="ripple"` (modifier) | `x-ripple` |

---

## Error Handling

### Invalid Attribute Values

Behaviors should handle invalid values gracefully:

```javascript
// In behavior code
const size = element.getAttribute('size');
const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];

if (size && !validSizes.includes(size)) {
  console.warn(`[component] Invalid size "${size}". Using default "md".`);
}
```

### Missing Required Attributes

```javascript
// Warn but don't crash
const src = element.getAttribute('src');
if (!src) {
  console.warn(`[image-card] Missing required attribute "src"`);
  // Show placeholder or fallback
}
```

### Attribute Validation in Schema

```json
{
  "properties": {
    "variant": {
      "type": "string",
      "enum": ["primary", "secondary", "warning", "error"],
      "default": "primary",
      "errorMessage": "variant must be one of: primary, secondary, warning, error"
    }
  }
}
```

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
<basic-card heading="Welcome" subheading="Get started" elevated hoverable>
  Card content here
</basic-card>

<price-card 
  plan="Pro" 
  price="$29" 
  period="/mo" 
  featured
  cta="Get Started">
</price-card>

<stats-card 
  value="1,234" 
  label="Users" 
  icon="👥" 
  trend="up" 
  trend-value="+12%">
</stats-card>

<card-image 
  src="photo.jpg" 
  alt="Description" 
  heading="Photo Title"
  loading="lazy">
</card-image>
```

### Feedback
```html
<alert-box variant="warning" heading="Caution" message="Check your input" dismissible>
</alert-box>

<badge-el variant="success">Active</badge-el>

<avatar-el src="user.jpg" alt="John Doe" size="lg" status="online">
</avatar-el>

<toast-el variant="success" message="Saved successfully!" duration="3000">
</toast-el>
```

### Navigation
```html
<breadcrumb-nav items="Home,Products,Shoes"></breadcrumb-nav>

<nav-tabs items="Overview,Features,Pricing" active="0"></nav-tabs>

<pagination-el total="100" per-page="10" current="3"></pagination-el>

<steps-el items="Cart,Shipping,Payment" current="1"></steps-el>
```

### Forms
```html
<text-field 
  placeholder="Enter your name" 
  required 
  maxlength="100"
  pattern="[A-Za-z ]+">
</text-field>

<rating-el value="4" max="5" icon="⭐"></rating-el>

<switch-el label="Enable notifications" checked></switch-el>

<range-slider min="0" max="100" value="50" step="5"></range-slider>
```

### Media
```html
<video-player 
  src="movie.mp4" 
  poster="preview.jpg" 
  controls 
  autoplay 
  muted>
</video-player>

<image-gallery columns="4" gap="1rem" data-images='[
  {"src": "1.jpg", "alt": "Photo 1"},
  {"src": "2.jpg", "alt": "Photo 2"}
]'>
</image-gallery>
```

### Data Display
```html
<data-table 
  data-columns='["Name","Email","Role"]'
  data-rows='[
    ["Alice","alice@example.com","Admin"],
    ["Bob","bob@example.com","User"]
  ]'
  sortable
  hoverable>
</data-table>

<timeline-el data-items='[
  {"date": "2024-01", "label": "Project Start"},
  {"date": "2024-06", "label": "Beta Launch"}
]'>
</timeline-el>
```

### Extensions
```html
<!-- Ripple + Tooltip -->
<button x-ripple x-tooltip="Save your work">Save</button>

<!-- Animations -->
<div x-animate="bounce" x-delay="0.5">Animated</div>

<!-- Lazy loading -->
<img src="large.jpg" x-lazy x-placeholder="blur">

<!-- Draggable + Resizable -->
<div x-draggable x-resizable>Drag and resize me</div>

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
<card-el title="Heading">        <!-- Use heading -->
<alert-el type="warning">        <!-- Use variant -->
<widget-el content="...">        <!-- Use slot or specific attr -->
<widget-el style="minimal">      <!-- Use variant -->
<widget-el class="special">      <!-- Use variant or boolean -->
<widget-el data="[...]">         <!-- Use data-* pattern -->
```

---

*Document maintained by Cielo Vista Software*  
*Last updated: 2026-01-03*
