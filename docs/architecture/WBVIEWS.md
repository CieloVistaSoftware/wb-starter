# wb-views System

**Version:** 1.1.0  
**Status:** Active  
**Location:** `src/core/wb-views.js`  
**Updated:** 2026-01-05

---

## Table of Contents

- [Overview](#overview)
- [Philosophy](#philosophy)
- [Real Working Example: ONE-TIME-ONE-PLACE](#real-working-example-one-time-one-place)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Syntax Reference](#syntax-reference)
- [Data Binding](#data-binding)
- [Behavior Integration](#behavior-integration)
- [Views Registry](#views-registry)
- [Built-in Views](#built-in-views)
- [IntelliSense Support](#intellisense-support)
- [Advanced Patterns](#advanced-patterns)
- [API Reference](#api-reference)
- [File Structure](#file-structure)
- [Migration Example](#migration-example)
- [Prior Art and Comparison](#prior-art-and-comparison)
- [Summary](#summary)

---

## Overview

**wb-views** is the high-level **HTML API**, a feature found in the Web Behaviors (WB) Behaviors Library. It allows for the creation of reusable UI components using only HTML. For example, defining a `<wb-user-card>` once and using it everywhere.

While **Behaviors** (`x-ripple`, `x-draggable`) allow you to add functionality to *existing* elements, **wb-views** allow you to define *new* elements (`<wb-card>`, `<wb-btn>`) with encapsulated structure, style, and behavior.

### The "Missing Link"

wb-views bridges the gap between static HTML and heavy JavaScript frameworks:

*   **Unlike Static HTML**: wb-views are **maintainable**. They eliminate the need to manually find-and-replace code across multiple files by keeping your source of truth in one place.
*   **Unlike React/Vue**: wb-views run natively in the browser with **no build step**, no hydration cost, and no complex state management.
*   **Unlike Raw Web Components**: wb-views eliminate the boilerplate of `class MyElement extends HTMLElement`, allowing you to define components entirely in HTML.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Custom Element Factory** | Automatically converts `<template wb-view="btn">` into a usable `<wb-btn>` custom element. |
| **Declarative Templating** | Uses simple Mustache syntax (`{{title}}`) for data binding. |
| **Logic in HTML** | Supports conditional rendering (`wb-if`, `wb-unless`) and loops (`wb-for`) directly in templates. |
| **Behavior Integration** | Automatically applies WB behaviors (`x-*`) to rendered content. |
| **Remote Data** | Built-in support for fetching JSON (`src="/api/data"`) and auto-refreshing. |
| **Zero Build** | Works directly in the browser via ES modules. |

### Golden Rule: Attributes Over Slots

> **Attribute name = what it is for**  
> **Schema/Template = where it goes**

Users provide simple attribute values. The template defines how those values become DOM structure. **Users should never need to know component internals.**

```html
<!-- ✅ CLEAN: User just sets values -->
<wb-hero title="Explore" subtitle="Your journey" cta="Launch"></wb-hero>

<!-- ❌ UGLY: User must know internal slots -->
<wb-hero>
  <h1 slot="title">Explore</h1>
  <p slot="subtitle">Your journey</p>
  <button slot="cta">Launch</button>
</wb-hero>
```

| Content Type | Use | Example |
|--------------|-----|-------|
| Simple text | **Attributes** | `title="Hello"` |
| Enum choices | **Attributes** | `variant="cosmic"` |
| Boolean flags | **Attributes** | `elevated` |
| Arbitrary rich content | **Body only** | `<wb-card>Any HTML</wb-card>` |

**The body (`{{body}}`) is reserved for arbitrary/rich content that can't be expressed as a simple attribute.**

### System Architecture

wb-views sits on top of the core Behavior system, acting as a generator for DOM structures that are then "brought to life" by behaviors.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       WB Behaviors Custom-elements                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. DEFINITION (HTML)                2. LOGIC (JavaScript)              │
│   ┌──────────────────────┐            ┌──────────────────────────────┐   │
│   │ <template wb-view>   │            │ behaviors/*.js               │   │
│   │  - Structure         │            │  - x-ripple                  │   │
│   │  - Styles            │            │  - x-tooltip                 │   │
│   │  - Data Bindings     │            │  - x-draggable               │   │
│   └──────────┬───────────┘            └──────────────┬───────────────┘   │
│              │                                       │                   │
│              ▼                                       ▼                   │
│   3. INSTANTIATION                    4. ACTIVATION                      │
│   ┌──────────────────────┐            ┌──────────────────────────────┐   │
│   │ <wb-view> / <wb-*>   │───────────>│ WB.scan()                    │   │
│   │  - Renders HTML      │  Triggers  │  - Finds x-* attributes      │   │
│   │  - Injects Data      │            │  - Attaches JS instances     │   │
│   └──────────────────────┘            └──────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### How It Works: The "Factory" Pattern

A `<wb-view>` element is essentially a **Custom Element Factory**. When you define a template, the system automatically registers a corresponding custom element.

The line `<template wb-view="card">` defines the blueprint for the component. The `wb-view` attribute registers the name 'card' with the system.

```html
<!-- 1. You Define a Template ONCE -->
<template wb-view="card">
  <div class="card">
    <img src="{{avatar}}" />
    <h3>{{name}}</h3>
  </div>
</template>
```

The following code shows how to use the newly created custom element. The attributes `name` and `avatar` are automatically passed to the template.

**Where does `wb-` come from?**
Since the view name "card" is a single word, the system automatically adds the `wb-` prefix to create `<wb-card>`. This is because valid HTML custom elements **must** contain a dash (hyphen).

```html
<!-- 2. The System Automatically Creates a Custom Element -->
<!-- You can now use this tag anywhere in your app -->
<wb-card name="Alice" avatar="alice.jpg"></wb-card>
```

**Key Insight:** You don't write a JavaScript class for `UserCard`. You just write HTML. The `wb-views` system handles the Custom Element registration, attribute observation, and rendering lifecycle for you.

---

## Philosophy

### The Problem: Repeated HTML Structures

Without a views system, HTML templates get duplicated across your codebase. This leads to maintenance nightmares where a single design change requires updating multiple files.

The following code demonstrates the **Imperative** or **Manual** approach where developers manually copy-paste HTML strings into JavaScript variables across different files.

```javascript
// ❌ BAD: Same structure repeated in multiple places

// In sidebar.js
const tile1 = `
  <div class="tile" draggable="true">
    <span class="tile__icon">📝</span>
    <span class="tile__label">Card</span>
  </div>
`;

// In palette.js  
const tile2 = `
  <div class="tile" draggable="true">
    <span class="tile__icon">⚡</span>
    <span class="tile__label">Hero</span>
  </div>
`;

// Want to add a tooltip? Change ALL of them!
// Want to change the class name? Change ALL of them!
```

### The Solution: ONE-TIME-ONE-PLACE

Define the structure once, use it everywhere:

```html
<!-- ✅ GOOD: Define structure ONE TIME -->
<template wb-view="component-tile">
  <div class="tile" draggable="true">
    <span class="tile__icon">{{icon}}</span>
    <span class="tile__label">{{label}}</span>
  </div>
</template>

<!-- Use anywhere with different data -->
<component-tile icon="📝" label="Card"></component-tile>
<component-tile icon="⚡" label="Hero"></component-tile>
<component-tile icon="📦" label="Section"></component-tile>
```

**Change the template once → ALL instances update automatically.**

### The Approach: Declarative

**Declarative** means you describe *what* you want, not *how* to create it.

*   **Imperative (JavaScript)**: "Create a div. Add class 'card'. Create an img. Set src to avatar. Append img to div..."
*   **Declarative (WB Views)**: `<wb-view user-card avatar="...">`

You write the end result (HTML), and the system figures out the implementation details.

---

## Real Working Example: ONE-TIME-ONE-PLACE

This complete example shows how to define a component tile once and use it everywhere. When you change the template, ALL tiles update.

### Step 1: Create the Template (ONE TIME)

Add this to your HTML file or a shared templates file:

```html
<!-- templates/common-views.html -->
<template wb-view="component-tile">
  <div class="tile" 
       draggable="true" 
       x-ripple 
       x-tooltip="{{tooltip || label}}">
    <span class="tile__icon">{{icon}}</span>
    <span class="tile__label">{{label}}</span>
    <span class="tile__badge" wb-if="badge">{{badge}}</span>
  </div>
</template>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary, #1e1e2e);
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    cursor: grab;
    transition: all 0.15s ease;
  }
  .tile:hover {
    border-color: var(--primary, #6366f1);
    transform: translateY(-2px);
  }
  .tile__icon { font-size: 1.5rem; }
  .tile__label { font-size: 0.75rem; font-weight: 600; }
  .tile__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    font-size: 0.6rem;
    padding: 2px 6px;
    border-radius: 10px;
  }
</style>
```

### Step 2: Use It Everywhere (MANY PLACES)

```html
<!-- sidebar.html -->
<div class="sidebar-components">
  <component-tile icon="📝" label="Card"></component-tile>
  <component-tile icon="⚡" label="Hero"></component-tile>
  <component-tile icon="📦" label="Section"></component-tile>
  <component-tile icon="🔲" label="Grid"></component-tile>
</div>

<!-- palette.html -->
<div class="component-palette">
  <component-tile icon="🖼️" label="Image"></component-tile>
  <component-tile icon="📊" label="Stats" badge="New"></component-tile>
  <component-tile icon="🔘" label="Button"></component-tile>
  <component-tile icon="🎯" label="Alert"></component-tile>
</div>

<!-- toolbar.html -->
<div class="quick-add-toolbar">
  <component-tile icon="📋" label="Form"></component-tile>
  <component-tile icon="📑" label="Tabs"></component-tile>
  <component-tile icon="📂" label="Accordion"></component-tile>
  <component-tile icon="🪟" label="Modal"></component-tile>
</div>
```

### Step 3: Change ONE TIME → Updates EVERYWHERE

Want to add a drag handle to ALL tiles? Edit the template ONCE:

```html
<!-- BEFORE: No drag handle -->
<template wb-view="component-tile">
  <div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip || label}}">
    <span class="tile__icon">{{icon}}</span>
    <span class="tile__label">{{label}}</span>
  </div>
</template>

<!-- AFTER: Added drag handle - ALL 12 tiles now have it! -->
<template wb-view="component-tile">
  <div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip || label}}">
    <span class="tile__drag-handle">⋮⋮</span>  <!-- NEW! -->
    <span class="tile__icon">{{icon}}</span>
    <span class="tile__label">{{label}}</span>
  </div>
</template>
```

**Result:** All 12 tiles across 3 different files now have drag handles. You changed ONE line in ONE file.

### Step 4: Initialize the System

```html
<!DOCTYPE html>
<html>
<head>
  <title>wb-views Demo</title>
</head>
<body>
  <!-- Include templates -->
  <template wb-view="component-tile">
    <div class="tile" draggable="true" x-ripple x-tooltip="{{tooltip || label}}">
      <span class="tile__icon">{{icon}}</span>
      <span class="tile__label">{{label}}</span>
    </div>
  </template>

  <!-- Use the views -->
  <div class="grid">
    <component-tile icon="📝" label="Card"></component-tile>
    <component-tile icon="⚡" label="Hero"></component-tile>
    <component-tile icon="📦" label="Section"></component-tile>
    <component-tile icon="🔲" label="Grid"></component-tile>
  </div>

  <script type="module">
    import { initViews } from './src/core/wb-views.js';
    import WB from './src/core/wb.js';

    // Initialize views system
    await initViews();

    // Behaviors (x-ripple, x-tooltip) are auto-applied by WB.scan()
    WB.init();
  </script>
</body>
</html>
```

### Common Changes (Edit Template Once)

| Change | Edit Template | Affects |
|--------|---------------|--------|
| Add tooltip to all tiles | Add `x-tooltip="{{label}}"` | All tiles |
| Add ripple effect | Add `x-ripple` | All tiles |
| Change hover color | Update `.tile:hover` CSS | All tiles |
| Add badge support | Add `<span wb-if="badge">` | All tiles |
| Change icon size | Update `.tile__icon` CSS | All tiles |
| Add keyboard support | Add `tabindex="0"` | All tiles |
| Add animation | Add `x-animate="fadeIn"` | All tiles |

### Without wb-views (The Old Way)

```javascript
// ❌ BAD: Change in 3+ files when you want to add a feature

// sidebar.js - Change here
const sidebarTiles = components.map(c => `
  <div class="tile" draggable="true">
    <span class="tile__icon">${c.icon}</span>
    <span class="tile__label">${c.label}</span>
  </div>
`).join('');

// palette.js - AND here
const paletteTiles = items.map(item => `
  <div class="tile" draggable="true">
    <span class="tile__icon">${item.icon}</span>
    <span class="tile__label">${item.label}</span>
  </div>
`).join('');

// toolbar.js - AND here
const toolbarTiles = tools.map(t => `
  <div class="tile" draggable="true">
    <span class="tile__icon">${t.icon}</span>
    <span class="tile__label">${t.label}</span>
  </div>
`).join('');

// Want to add x-ripple? Edit ALL THREE files!
// Want to add a badge? Edit ALL THREE files!
// Want to change the class name? Edit ALL THREE files!
```

### With wb-views (The New Way)

```html
<!-- ✅ GOOD: Change in ONE place -->

<!-- Define ONCE -->
<template wb-view="component-tile">
  <div class="tile" draggable="true" x-ripple x-tooltip="{{label}}">
    <span class="tile__icon">{{icon}}</span>
    <span class="tile__label">{{label}}</span>
    <span class="tile__badge" wb-if="badge">{{badge}}</span>
  </div>
</template>

<!-- Use ANYWHERE -->
<component-tile icon="📝" label="Card"></component-tile>
<component-tile icon="⚡" label="Hero" badge="New"></component-tile>
```

**Want to add `x-ripple`?** Add it to the template. Done. All tiles have it.

**Want to add badge support?** Add it to the template. Done. All tiles can show badges.

**Want to change the class name?** Change it in the template. Done. All tiles updated.

---

## Quick Start

### Step 1: Define a Template

```html
<template wb-view="greeting-card">
  <div class="greeting-card">
    <h2 class="greeting-card__title">{{title}}</h2>
    <p class="greeting-card__message">{{message}}</p>
    <span class="greeting-card__signature">— {{author}}</span>
  </div>
</template>
```

### Step 2: Use the View

Once defined, you can use the view anywhere. The attributes you provide map directly to the `{{variables}}` in your template.

```html
<!-- 
  <greeting-card> : The custom element tag
  title="..." : Maps to {{title}}
  message="..." : Maps to {{message}}
  author="..." : Maps to {{author}}
-->
<greeting-card 
         title="Welcome!" 
         message="Thanks for joining us today." 
         author="The Team">
</greeting-card>
```

### Step 3: Rendered Output

```html
<div class="greeting-card">
  <h2 class="greeting-card__title">Welcome!</h2>
  <p class="greeting-card__message">Thanks for joining us today.</p>
  <span class="greeting-card__signature">— The Team</span>
</div>
```

### Step 4: Initialize

```javascript
import { initViews } from './src/core/wb-views.js';

await initViews({
  registry: '/src/wb-views/views-registry.json'
});
```

---

## Core Concepts

### Views vs Behaviors

| Aspect | Behaviors | Views |
|--------|-----------|-------|
| **Purpose** | Add functionality to elements | Define reusable structure |
| **Written in** | JavaScript | HTML + Mustache syntax |
| **Primary users** | Developers | Designers, content authors |
| **Output** | Enhanced existing element | New rendered HTML |
| **Relationship** | Views USE behaviors | Behaviors power views |

### The `<wb-view>` Element

```html
<wb-view {view-name} {attributes}>{body-content}</wb-view>
```

| Component | Required | Description |
|-----------|----------|-------------|
| `{view-name}` | Yes | Boolean attribute specifying which template |
| `{attributes}` | No | Key-value pairs passed to template |
| `{body-content}` | No | Inner HTML available as `{{body}}` |

### wb-views = Custom Element Factory

**Key Insight:** When you define a view, WB automatically registers it as a custom element tag. You get two equivalent syntaxes:

```html
<!-- 1. Define the view ONCE -->
<template wb-view="btn">
  <button class="btn btn--{{variant}}">{{body}}</button>
</template>

<!-- 2. Now use it EITHER way: -->

<!-- wb-view syntax -->
<wb-view btn variant="primary">Save</wb-view>

<!-- OR: Direct custom tag -->
<wb-btn variant="primary">Save</wb-btn>

<!-- Both render identical output! -->
<button class="btn btn--primary">Save</button>
```

### Tag Naming Convention

Custom elements require a hyphen in the tag name (Web Components spec). wb-views handles this automatically:

| View Name | Has Hyphen? | Custom Element Tag |
|-----------|-------------|-------------------|
| `btn` | No | `<wb-btn>` |
| `avatar` | No | `<wb-avatar>` |
| `icon` | No | `<wb-icon>` |
| `card-tile` | Yes | `<card-tile>` |
| `alert-box` | Yes | `<alert-box>` |
| `stat-tile` | Yes | `<stat-tile>` |

**The Rule:**
- **No hyphen** → auto-prefix with `wb-` (e.g., `btn` → `<wb-btn>`)
- **Has hyphen** → use as-is (e.g., `card-tile` → `<card-tile>`)

```html
<!-- Short names get wb- prefix -->
<wb-btn variant="primary">Save</wb-btn>
<wb-avatar initials="JD" size="md"></wb-avatar>
<wb-icon name="star"></wb-icon>

<!-- Descriptive names stay as-is -->
<card-tile icon="📝" label="Card"></card-tile>
<alert-box variant="error" message="Oops!"></alert-box>
<stat-tile value="1,234" label="Users"></stat-tile>
```

**Which syntax to use?**
- `<wb-view btn>` — Dynamic, works before registration, good for conditionally loading views
- `<wb-btn>` — Cleaner, self-documenting, requires view to be registered first

### Template Definition Methods

**Method A: Inline `<template>`**

```html
<template wb-view="product-badge">
  <span class="badge badge--{{type}}">{{text}}</span>
</template>
```

**Method B: JSON Registry**

```json
{
  "views": {
    "product-badge": {
      "template": "<span class=\"badge badge--{{type}}\">{{text}}</span>",
      "attributes": {
        "type": { "type": "string", "enum": ["sale", "new", "hot"] },
        "text": { "type": "string", "required": true }
      }
    }
  }
}
```

**Method C: Programmatic**

```javascript
import { registerView } from './src/core/wb-views.js';

registerView('product-badge', `
  <span class="badge badge--{{type}}">{{text}}</span>
`);
```

---

## Syntax Reference

### Basic Interpolation

```html
<!-- Template -->
<template wb-view="user-greeting">
  <p>Hello, {{name}}!</p>
</template>

<!-- Usage -->
<user-greeting name="Alice"></user-greeting>

<!-- Output -->
<p>Hello, Alice!</p>
```

### Default Values

```html
<!-- Template -->
<template wb-view="user-greeting">
  <p>Hello, {{name || "Guest"}}!</p>
</template>

<!-- Usage (no name) -->
<user-greeting></user-greeting>

<!-- Output -->
<p>Hello, Guest!</p>
```

### Nested Properties

```html
<!-- Template -->
<template wb-view="user-profile">
  <div class="profile">
    <span class="name">{{user.name}}</span>
    <span class="email">{{user.email}}</span>
  </div>
</template>

<!-- Usage -->
<user-profile user='{"name":"Alice","email":"alice@example.com"}'></user-profile>
```

### Ternary Expressions

```html
<!-- Template -->
<template wb-view="status-indicator">
  <span class="status status--{{active ? 'online' : 'offline'}}">
    {{active ? 'Online' : 'Offline'}}
  </span>
</template>

<!-- Usage -->
<status-indicator active></status-indicator>
<status-indicator></status-indicator>
```

### Conditionals: `wb-if`

```html
<!-- Template -->
<template wb-view="notification-card">
  <div class="notification">
    <span class="icon" wb-if="icon">{{icon}}</span>
    <p class="message">{{message}}</p>
    <button class="dismiss" wb-if="dismissible">✕</button>
  </div>
</template>

<!-- Usage WITH icon -->
<notification-card icon="⚠️" message="Warning!" dismissible></notification-card>

<!-- Usage WITHOUT icon -->
<notification-card message="Update complete"></notification-card>
```

### Conditionals: `wb-unless`

`wb-unless` is the inverse of `wb-if`. It renders the element only if the condition is **false** or **empty**. This is useful for fallbacks.

```html
<!-- Template -->
<template wb-view="avatar-display">
  <div class="avatar">
    <!-- Show image IF src exists -->
    <img src="{{src}}" alt="{{name}}" wb-if="src">
    
    <!-- Show initials UNLESS src exists (Fallback) -->
    <span class="initials" wb-unless="src">{{initials}}</span>
  </div>
</template>

<!-- Usage: Has image -> Shows <img> -->
<avatar-display src="pic.jpg" name="Alice"></avatar-display>

<!-- Usage: No image -> Shows <span> (Initials) -->
<avatar-display initials="AB" name="Alice"></avatar-display>
```

### Loops: `wb-for`

Repeats an element for each item in an array. The syntax is `item in collection`.

```html
<!-- Template -->
<template wb-view="tag-list">
  <ul class="tags">
    <li class="tag" wb-for="tag in tags">{{tag}}</li>
  </ul>
</template>

<!-- Usage -->
<tag-list tags='["JavaScript","TypeScript","HTML"]'></tag-list>

<!-- Output -->
<ul class="tags">
  <li class="tag">JavaScript</li>
  <li class="tag">TypeScript</li>
  <li class="tag">HTML</li>
</ul>
```

### Loop Context Variables

| Variable | Type | Description |
|----------|------|-------------|
| `{{item}}` | any | Current item value |
| `{{itemIndex}}` | number | Zero-based index |
| `{{itemFirst}}` | boolean | True for first item |
| `{{itemLast}}` | boolean | True for last item |

```html
<template wb-view="numbered-list">
  <ol>
    <li wb-for="item in items" class="{{itemFirst ? 'first' : ''}}">
      {{itemIndex}}. {{item}}
    </li>
  </ol>
</template>
```

### Body Content Slot (Use Sparingly)

The `{{body}}` placeholder is for **arbitrary/rich content only**. If content can be a simple string, **use an attribute instead**.

```html
<!-- Template -->
<template wb-view="modal-dialog">
  <dialog class="modal">
    <header><h2>{{heading}}</h2></header>
    <main>{{body}}</main>
  </dialog>
</template>

<!-- ✅ CORRECT: heading is simple text (attribute), body is rich content (slot) -->
<modal-dialog heading="Confirm Delete">
  <p>Are you sure?</p>
  <p class="warning">This <strong>cannot</strong> be undone.</p>
</modal-dialog>

<!-- ❌ WRONG: Don't use slots for simple text -->
<modal-dialog>
  <h2 slot="heading">Confirm Delete</h2>  <!-- Should be attribute! -->
  ...
</modal-dialog>
```

**Rule:** If it's a simple string → make it an attribute. If it's arbitrary HTML → use `{{body}}`.

---

## Data Binding

### Static Attributes

```html
<card-tile icon="📝" label="Card"></card-tile>
```

### Boolean Attributes

```html
<!-- 'featured' is true (present) -->
<product-card name="Widget" featured></product-card>

<!-- 'featured' is false (absent) -->
<product-card name="Gadget"></product-card>
```

### JSON Attributes

```html
<user-card user='{"name":"Alice","role":"Admin"}'></user-card>

<tag-cloud tags='["JavaScript","TypeScript","React"]'></tag-cloud>
```

### External Data: `src`

```html
<!-- Fetch single object -->
<user-profile src="/api/user/123"></user-profile>

<!-- Fetch array → renders multiple -->
<team-member src="/api/team"></team-member>
```

If source returns array, multiple instances render:

```json
// GET /api/team returns:
[
  { "name": "Alice", "role": "Developer" },
  { "name": "Bob", "role": "Designer" }
]
```

```html
<!-- Renders TWO team-member views -->
<team-member src="/api/team"></team-member>
```

### Auto-Refresh: `refresh`

```html
<!-- Re-fetch every 5 seconds -->
<live-stats src="/api/stats" refresh="5000"></live-stats>

<!-- Re-fetch every minute -->
<server-status src="/api/health" refresh="60000"></server-status>
```

---

## Behavior Integration

Templates can include behavior attributes. After rendering, `WB.scan()` applies them.

### Using `x-*` Extensions

```html
<!-- Template with behaviors -->
<template wb-view="action-button">
  <button class="btn btn--{{variant || 'primary'}}" 
          x-ripple 
          x-tooltip="{{tooltip}}">
    <span wb-if="icon">{{icon}}</span>
    {{label}}
  </button>
</template>

<!-- Usage -->
<action-button label="Save" tooltip="Save changes" icon="💾"></action-button>

<!-- After WB.scan(): ripple and tooltip are active! -->
```

### Using `x-as-*` Morphs

```html
<template wb-view="pricing-tier">
  <section x-as-card elevated hoverable>
    <h3>{{plan}}</h3>
    <div class="price">{{price}}</div>
    <ul wb-for="feature in features">
      <li>{{feature}}</li>
    </ul>
  </section>
</template>
```

### Multiple Behaviors

```html
<template wb-view="draggable-tile">
  <div class="tile" 
       x-ripple 
       x-draggable 
       x-tooltip="{{label}}"
       data-behavior="{{behavior}}">
    <span>{{icon}}</span>
    <span>{{label}}</span>
  </div>
</template>
```

---

## Views Registry

Location: `src/wb-views/views-registry.json`

### Structure

```json
{
  "$schema": "./views.schema.json",
  "version": "1.0.0",
  "views": {
    "view-name": {
      "description": "Human-readable description",
      "template": "<div>{{content}}</div>",
      "attributes": {
        "content": {
          "type": "string",
          "description": "Main content",
          "required": true
        },
        "variant": {
          "type": "string",
          "enum": ["primary", "secondary"],
          "default": "primary"
        }
      }
    }
  }
}
```

### Attribute Schema

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | `"string"`, `"boolean"`, `"number"` |
| `description` | string | Shown in IntelliSense |
| `required` | boolean | Is attribute required? |
| `enum` | array | Valid values (dropdown) |
| `default` | any | Default if not provided |

---

## Built-in Views

### card-tile
Draggable component tile for palettes/sidebars.

```html
<wb-view card-tile icon="📝" label="Card" behavior="card" tag="basic-card"></wb-view>
```

### alert-box
Alert message with variants.

```html
<wb-view alert-box variant="success" icon="✅" heading="Success!" 
         message="Changes saved." dismissible></wb-view>

<wb-view alert-box variant="error" message="Something went wrong."></wb-view>

<wb-view alert-box variant="warning" icon="⚠️" message="Cannot be undone."></wb-view>

<wb-view alert-box variant="info" message="Press Ctrl+S to save."></wb-view>
```

### stat-tile
Statistics display with trend.

```html
<wb-view stat-tile icon="👥" value="1,234" label="Active Users" 
         trend="up" trend-value="+12%"></wb-view>

<wb-view stat-tile icon="💰" value="$52,000" label="Revenue" 
         trend="down" trend-value="-3%"></wb-view>
```

### nav-link
Navigation link with optional badge.

```html
<wb-view nav-link href="/dashboard" label="Dashboard" icon="🏠" active></wb-view>

<wb-view nav-link href="/messages" label="Messages" icon="💬" badge="5"></wb-view>
```

### user-avatar
Avatar with status indicator.

```html
<wb-view user-avatar src="/images/alice.jpg" name="Alice" size="lg" status="online"></wb-view>

<wb-view user-avatar name="Bob" initials="BS" status="busy"></wb-view>
```

### price-tag
Price display with optional original.

```html
<wb-view price-tag price="$29" period="/mo"></wb-view>

<wb-view price-tag price="$19" original="$29" period="/mo"></wb-view>
```

### feature-item
Feature list item.

```html
<ul class="features">
  <wb-view feature-item text="Unlimited projects" included></wb-view>
  <wb-view feature-item text="Priority support" included></wb-view>
  <wb-view feature-item text="Custom integrations"></wb-view>
</ul>
```

### button-primary
Styled button.

```html
<wb-view button-primary label="Save" variant="primary" icon="💾"></wb-view>
<wb-view button-primary label="Cancel" variant="secondary"></wb-view>
<wb-view button-primary label="Delete" variant="error" icon="🗑️"></wb-view>
```

### icon-button
Icon-only button.

```html
<wb-view icon-button icon="⚙️" tooltip="Settings" variant="ghost"></wb-view>
<wb-view icon-button icon="🔔" tooltip="Notifications"></wb-view>
```

### badge
Small label/tag.

```html
<wb-view badge label="New" variant="primary"></wb-view>
<wb-view badge label="Sale" variant="error"></wb-view>
<wb-view badge label="Beta" variant="warning"></wb-view>
```

### empty-state
Placeholder for empty content.

```html
<wb-view empty-state icon="📭" heading="No messages" 
         message="Messages will appear here."></wb-view>
```

### loading-skeleton
Loading placeholder.

```html
<wb-view loading-skeleton variant="heading" width="60%"></wb-view>
<wb-view loading-skeleton variant="text"></wb-view>
<wb-view loading-skeleton variant="avatar" width="48px" height="48px"></wb-view>
```

---

## IntelliSense Support

### What You Get

When typing `<wb-view `:
- Autocomplete shows all 12 view names
- After selecting view, shows relevant attributes
- Enum attributes show value dropdowns
- Descriptions show type, required, defaults

### Regenerating

After modifying `views-registry.json`:

```bash
node scripts/generate-views-intellisense.js
```

Then restart VS Code.

### Configuration

`.vscode/settings.json`:

```json
{
  "html.customData": ["./.vscode/html-custom-data.json"]
}
```

---

## Advanced Patterns

### View Composition

```html
<template wb-view="pricing-card">
  <article class="pricing-card" x-as-card elevated>
    <h3>{{plan}}</h3>
    <price-tag price="{{price}}" period="{{period}}"></price-tag>
    <ul>{{features}}</ul>
    <button-primary label="{{cta || 'Get Started'}}"></button-primary>
  </article>
</template>
```

### Dynamic View Selection

```javascript
const notifications = [
  { type: 'success', message: 'Uploaded' },
  { type: 'error', message: 'Failed' }
];

notifications.forEach(n => {
  const view = document.createElement('wb-view');
  view.setAttribute('alert-box', '');
  view.setAttribute('variant', n.type);
  view.setAttribute('message', n.message);
  container.appendChild(view);
});

WB.scan(container);
```

### Real-Time Dashboard

```html
<div class="dashboard">
  <stat-tile src="/api/stats/users" refresh="5000" 
           icon="👥" label="Active Users"></stat-tile>
  
  <stat-tile src="/api/stats/requests" refresh="1000" 
           icon="📊" label="Requests/sec"></stat-tile>
  
  <alert-box src="/api/alerts/latest" refresh="10000"></alert-box>
</div>
```

---

## API Reference

### `registerView(name, template, meta?)`

```javascript
import { registerView } from './src/core/wb-views.js';

registerView('my-widget', `
  <div class="widget">
    <h3>{{title}}</h3>
    <p>{{description}}</p>
  </div>
`, {
  description: 'A custom widget',
  attributes: {
    title: { type: 'string', required: true },
    description: { type: 'string' }
  }
});
```

### `loadViewsFromDOM(root?)`

```javascript
import { loadViewsFromDOM } from './src/core/wb-views.js';

loadViewsFromDOM(document);
```

### `loadViewsFromURL(url)`

```javascript
import { loadViewsFromURL } from './src/core/wb-views.js';

await loadViewsFromURL('/src/wb-views/views-registry.json');
```

### `renderView(viewName, data, target, body?)`

```javascript
import { renderView } from './src/core/wb-views.js';

const cleanup = renderView('alert-box', {
  variant: 'success',
  message: 'Done!'
}, container);

// Later:
cleanup();
```

### `initViews(options?)`

```javascript
import { initViews } from './src/core/wb-views.js';

await initViews({
  registry: '/src/wb-views/views-registry.json'
});
```

---

## File Structure

```
src/
├── core/
│   └── wb-views.js              # Core views system
├── wb-views/
│   └── views-registry.json      # View definitions
scripts/
│   └── generate-views-intellisense.js
.vscode/
│   └── html-custom-data.json    # IntelliSense data
```

---

## Migration Example

### Before (Hardcoded)

```javascript
function renderTiles(items) {
  return items.map(item => `
    <div class="tile" draggable="true">
      <span>${item.icon}</span>
      <span>${item.label}</span>
    </div>
  `).join('');
}
```

### After (Using Views)

```html
<template wb-view="sidebar-tile">
  <div class="tile" draggable="true" x-ripple>
    <span>{{icon}}</span>
    <span>{{label}}</span>
  </div>
</template>
```

```html
<sidebar-tile src="/api/components.json"></sidebar-tile>
```

---

## Prior Art and Comparison

wb-views isn't the first attempt at HTML-first components. Here's how it compares to similar approaches, with concrete examples.

### The Same Component in Different Libraries

Let's build a simple **user card** component in each approach:

#### wb-views (This Library)

```html
<!-- Define: Pure HTML, works in browser -->
<template wb-view="user-card">
  <div class="card">
    <img src="{{avatar}}" alt="{{name}}">
    <h3>{{name}}</h3>
    <p>{{role}}</p>
    <span class="badge" wb-if="verified">✓ Verified</span>
  </div>
</template>

<!-- Use: Auto-registered custom element -->
<user-card name="Alice" avatar="alice.jpg" role="Developer" verified></user-card>
```

**Pros:** Zero build, pure HTML, browser-native, auto custom element registration  
**Cons:** Runtime parsing overhead

---

#### Enhance (Begin)

https://enhance.dev

```html
<!-- elements/user-card.html -->
<template>
  <style>
    .card { border: 1px solid #ccc; padding: 1rem; }
  </style>
  <div class="card">
    <img src="${attrs.avatar}" alt="${attrs.name}">
    <h3>${attrs.name}</h3>
    <p>${attrs.role}</p>
    ${attrs.verified ? '<span class="badge">✓ Verified</span>' : ''}
  </div>
</template>

<script type="module">
  export default function UserCard({ html, state }) {
    const { attrs } = state
    return html`...`
  }
</script>
```

```html
<!-- Usage -->
<user-card name="Alice" avatar="alice.jpg" role="Developer" verified></user-card>
```

**Pros:** SSR, progressive enhancement, scoped styles  
**Cons:** Requires Node.js server, JS function wrapper, template literals

---

#### WebC (11ty)

https://www.11ty.dev/docs/languages/webc/

```html
<!-- _components/user-card.webc -->
<div class="card">
  <img :src="avatar" :alt="name">
  <h3 @text="name"></h3>
  <p @text="role"></p>
  <span class="badge" webc:if="verified">✓ Verified</span>
</div>

<style webc:scoped>
  .card { border: 1px solid #ccc; padding: 1rem; }
</style>
```

```html
<!-- Usage in .webc file -->
<user-card name="Alice" avatar="alice.jpg" role="Developer" verified></user-card>
```

**Pros:** Build-time optimization, scoped CSS, 11ty integration  
**Cons:** Requires build step, `.webc` file format, static site focused

---

#### Riot.js

https://riot.js.org

```html
<!-- user-card.riot -->
<user-card>
  <div class="card">
    <img src="{ props.avatar }" alt="{ props.name }">
    <h3>{ props.name }</h3>
    <p>{ props.role }</p>
    <span class="badge" if="{ props.verified }">✓ Verified</span>
  </div>

  <style>
    .card { border: 1px solid #ccc; padding: 1rem; }
  </style>
</user-card>
```

```javascript
// main.js
import { component } from 'riot'
import UserCard from './user-card.riot'

component(UserCard)(document.getElementById('app'), {
  name: 'Alice',
  avatar: 'alice.jpg',
  role: 'Developer',
  verified: true
})
```

**Pros:** Reactive, scoped styles, small runtime  
**Cons:** Custom `.riot` format, requires compiler, JS mounting

---

#### Lit (Google)

https://lit.dev

```javascript
// user-card.js
import { LitElement, html, css } from 'lit';

class UserCard extends LitElement {
  static properties = {
    name: { type: String },
    avatar: { type: String },
    role: { type: String },
    verified: { type: Boolean }
  };

  static styles = css`
    .card { border: 1px solid #ccc; padding: 1rem; }
  `;

  render() {
    return html`
      <div class="card">
        <img src="${this.avatar}" alt="${this.name}">
        <h3>${this.name}</h3>
        <p>${this.role}</p>
        ${this.verified ? html`<span class="badge">✓ Verified</span>` : ''}
      </div>
    `;
  }
}

customElements.define('user-card', UserCard);
```

```html
<!-- Usage -->
<user-card name="Alice" avatar="alice.jpg" role="Developer" verified></user-card>
```

**Pros:** Reactive, Shadow DOM, Google-backed, well-documented  
**Cons:** JavaScript-first, class boilerplate, tagged template syntax

---

#### Vanilla Web Components

```javascript
// user-card.js
class UserCard extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'avatar', 'role', 'verified'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const name = this.getAttribute('name') || '';
    const avatar = this.getAttribute('avatar') || '';
    const role = this.getAttribute('role') || '';
    const verified = this.hasAttribute('verified');

    this.innerHTML = `
      <div class="card">
        <img src="${avatar}" alt="${name}">
        <h3>${name}</h3>
        <p>${role}</p>
        ${verified ? '<span class="badge">✓ Verified</span>' : ''}
      </div>
    `;
  }
}

customElements.define('user-card', UserCard);
```

**Pros:** No dependencies, browser-native  
**Cons:** Lots of boilerplate, manual attribute observation, no templating

---

#### Vue.js (SFC)

```vue
<!-- UserCard.vue -->
<template>
  <div class="card">
    <img :src="avatar" :alt="name">
    <h3>{{ name }}</h3>
    <p>{{ role }}</p>
    <span class="badge" v-if="verified">✓ Verified</span>
  </div>
</template>

<script setup>
defineProps(['name', 'avatar', 'role', 'verified'])
</script>

<style scoped>
.card { border: 1px solid #ccc; padding: 1rem; }
</style>
```

```vue
<!-- Usage -->
<UserCard name="Alice" avatar="alice.jpg" role="Developer" verified />
```

**Pros:** Reactive, scoped styles, huge ecosystem, great DX  
**Cons:** Requires build step, Vue runtime, `.vue` file format

---

#### Alpine.js + HTML

```html
<!-- Define: Reusable via x-data -->
<template id="user-card-template">
  <div class="card" x-data="{ name: '', avatar: '', role: '', verified: false }">
    <img :src="avatar" :alt="name">
    <h3 x-text="name"></h3>
    <p x-text="role"></p>
    <span class="badge" x-show="verified">✓ Verified</span>
  </div>
</template>

<!-- Usage: Requires cloning + manual data binding -->
<script>
function createUserCard(props) {
  const template = document.getElementById('user-card-template');
  const clone = template.content.cloneNode(true);
  const el = clone.querySelector('.card');
  el._x_dataStack = [props];
  return clone;
}
</script>
```

**Pros:** Lightweight, no build, reactive  
**Cons:** Not designed for reusable components, manual cloning, awkward API

---

### Comparison Table

| Feature | wb-views | Enhance | WebC | Riot | Lit | Vanilla WC | Vue |
|---------|----------|---------|------|------|-----|------------|-----|
| **Pure HTML definition** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Zero build step** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Auto custom element** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Conditionals (if)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Loops (for)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Behavior integration** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SSR support** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Scoped styles** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reactive updates** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Bundle size** | 0kb* | ~5kb | 0kb* | ~6kb | ~5kb | 0kb | ~33kb |

\* Runtime only, no external dependencies

---

### When to Use What

| Use Case | Best Choice |
|----------|-------------|
| Static site with build step | **WebC** or **Vue** |
| Server-rendered apps | **Enhance** or **Vue SSR** |
| Complex reactive UIs | **Lit** or **Vue** |
| Simple reusable HTML chunks | **wb-views** |
| Zero-dependency browser apps | **wb-views** or **Vanilla WC** |
| Adding behavior to existing HTML | **Alpine.js** (or WB Behaviors) |
| Design systems / component libraries | **Lit** or **Vue** |

---

### Why wb-views Exists

wb-views fills a specific niche:

1. **No build step** — Works directly in browser via ES modules
2. **Pure HTML** — Templates are just HTML, not JS or custom formats
3. **Auto registration** — `<template wb-view="x">` → `<wb-x>` automatically
4. **Behavior integration** — `x-ripple`, `x-tooltip` work after render
5. **Lightweight** — No runtime library, just template processing

If you need SSR, use Enhance. If you need reactivity, use Lit or Vue. If you want **simple, build-free, HTML-first components** that integrate with WB Behaviors, use wb-views.

---

## Summary

wb-views provides:

1. **Golden Rule** — Attributes for values, templates for structure (users don't need to know internals)
2. **Declarative Templates** — HTML + Mustache syntax
3. **Data Binding** — Static, JSON, external sources
4. **Behavior Integration** — Auto `WB.scan()` after render
5. **IntelliSense** — Full VS Code autocomplete
6. **ONE-TIME-ONE-PLACE** — Change once, update everywhere

---

*Document Version: 1.1.0*  
*Last Updated: 2026-01-05*
