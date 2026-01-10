gcan# Web Behaviors (WB) Parts Specification

## Overview

**WB Parts** is a lightweight, declarative templating system that allows developers to define reusable UI components using standard HTML `<template>` tags. It acts as a **Custom Element Factory**, automatically upgrading defined templates into native Web Components (Custom Elements).

## Core Concepts

1.  **Define Once**: Create a template using `<template wb-part="name">`.
2.  **Use Anywhere**: The system automatically registers a custom element (e.g., `<wb-name>`).
3.  **Reactive**: Supports data binding, conditionals, loops, and external data fetching.
4.  **No Build Step**: Works entirely in the browser at runtime.

---

## 1. Defining Parts

Parts are defined using the standard HTML `<template>` element with the `wb-part` attribute.

```html
<template wb-part="user-card">
  <div class="card">
    <img src="{{avatar}}" alt="{{name}}">
    <h3>{{name}}</h3>
    <p>{{role || 'Member'}}</p>
  </div>
</template>
```

### Naming Conventions
- **Hyphenated Names**: Used as-is (e.g., `wb-part="nav-link"` → `<nav-link>`).
- **Single Word Names**: Automatically prefixed with `wb-` (e.g., `wb-part="btn"` → `<wb-btn>`).

---

## 2. Using Parts

Once defined, parts can be instantiated in two ways:

### A. Custom Element Syntax (Recommended)
The system automatically registers a custom element for every part.

```html
<user-card 
  name="Alice" 
  avatar="alice.jpg" 
  role="Admin">
</user-card>
```

### B. Wrapper Syntax
Use the generic `<wb-part>` element with the part name as a boolean attribute.

```html
<wb-part user-card 
  name="Bob" 
  avatar="bob.jpg">
</wb-part>
```

---

## 3. Template Features

### Variable Interpolation
Use double curly braces `{{ }}` to inject data.

- **Simple**: `{{title}}`
- **Default Value**: `{{title || 'Untitled'}}`
- **Ternary**: `{{isActive ? 'active' : ''}}`
- **Nested**: `{{user.profile.name}}`

### Conditionals
Control visibility of elements based on data.

- **`wb-if="prop"`**: Renders the element only if `prop` is truthy.
- **`wb-unless="prop"`**: Renders the element only if `prop` is falsy.

```html
<span wb-if="isAdmin">Admin Badge</span>
<span wb-unless="isLoggedIn">Log In</span>
```

### Loops
Iterate over arrays using `wb-for`.

```html
<ul>
  <li wb-for="item in items">{{item.name}}</li>
</ul>
```

### Content Projection (Slots)
The special variable `{{body}}` contains the inner HTML content passed to the component.

**Definition:**
```html
<template wb-part="alert">
  <div class="alert">
    <strong>{{title}}</strong>
    <div class="content">{{body}}</div>
  </div>
</template>
```

**Usage:**
```html
<wb-alert title="Warning">
  This is the <em>body</em> content.
</wb-alert>
```

---

## 4. Data Loading

Parts can fetch their own data from external sources.

### Fetch from URL (`src`)
Fetches JSON data from a URL and merges it with attributes.

```html
<user-card src="/api/user/123"></user-card>
```

### Reference Data (`use`)
Uses data from another DOM element or a global variable.

- **From Element**: `use="#data-script"` (reads JSON from script tag)
- **From Window**: `use="window.appData.user"`

```html
<user-card use="#user-data"></user-card>
```

### Auto-Refresh (`refresh`)
Automatically re-fetches data at a specified interval (in milliseconds).

```html
<stock-ticker src="/api/stock" refresh="5000"></stock-ticker>
```

---

## 5. API Reference

### `registerPart(name, html, meta)`
Manually register a part via JavaScript.

```javascript
import { registerPart } from './core/wb-parts.js';

registerPart('my-part', '<div>{{text}}</div>');
```

### `loadPartsFromDOM(root)`
Scans the DOM for `<template wb-part="...">` elements and registers them. Called automatically on init.

### `loadPartsFromURL(url)`
Loads a JSON registry of parts.

```javascript
import { loadPartsFromURL } from './core/wb-parts.js';

loadPartsFromURL('/data/parts.json');
```
