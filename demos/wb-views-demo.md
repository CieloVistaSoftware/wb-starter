# WB Views Demo documentation

This document outlines the features and components demonstrated in [wb-views-demo.html](wb-views-demo.html).

## Overview

The WB Views system is a **Custom Element Factory** that allows developers to define HTML templates and automatically register them as fully functional Web Components.

**Key Definition:** Define a template once → get a custom tag automatically. Change the template → ALL instances update.

## Core Concepts

### 1. Defining a View
Views are defined using standard HTML `<template>` tags with the `wb-view` attribute:

```html
<template wb-view="my-component">
  <div class="my-component">
    <h2><slot name="title">{{title}}</slot></h2>
    <div><slot></slot></div>
  </div>
</template>
```

### 2. Using a View
Once defined (or loaded from registry), views can be used as standard HTML tags:

```html
<my-component title="Hello World">
  This is the body content.
</my-component>
```

### 3. Template Syntax
- **Slots**: `<slot>` elements are replaced by the component's inner HTML. Named slots `<slot name="header">` match children with `slot="header"`.
- **Interpolation**: `{{variable}}` injects attribute values.
- **Conditionals**: `wb-if="prop"` renders element only if `prop` is truthy.
- **Loops**: `wb-for="item in list"` repeats the element for each item in the array.
- **Defaults**: content inside `<slot>default</slot>` is shown if no content is provided.

## Components Registry

The demo showcases components defined in `src/wb-views/views-registry.json`.

### Basic Controls
*   **Buttons**: `<wb-button>`, `<icon-button>` (Supports variants: primary, secondary, success, error, etc.)
*   **Badges**: `<badge>`, `<badge-tag>`
*   **Avatars**: `<user-avatar>` (Supports initials or images, status dots)

### Layout & Containers
*   **Cards**: `<card>`, `<user-card>` (Composition examples)
*   **Sections**: `<demo-section>`
*   **Toolbars**: `<toolbar>`, `<file-toolbar>`
*   **Alerts**: `<alert-box>`

### Data & Feedback
*   **Stats**: `<stat-tile>`, `<stat-row>`
*   **Example Blocks**: `<example-block>` (Used in the demo to show source code)
*   **Loading**: `<loading-skeleton>`

## Setup

The system is initialized via JavaScript module import:

```javascript
// Initialize views system
const { initViews } = await import('../src/core/wb-views.js');
await initViews({ registry: '../src/wb-views/views-registry.json' });
```

## Styling

This demo page uses:
1.  `src/styles/themes.css`: CSS Variables for theming (Colors, Spacing).
2.  `src/styles/site.css`: Base component styles (Buttons, Layouts).
3.  `demos/wb-views-demo.css`: Demo-specific layout overrides.
