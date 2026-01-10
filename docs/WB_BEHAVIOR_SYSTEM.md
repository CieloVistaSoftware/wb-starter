# Web Behaviors (WB) Behavior System - Technical Workflow
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/WB_BEHAVIOR_SYSTEM.md)

## Overview

The **WB (Web Behavior)** system is a functional, progressive enhancement library that injects behaviors into native HTML elements. Unlike Web Components or class-based frameworks, WB uses **pure functions** that enhance existing DOM elements with additional capabilities.

---

## Table of Contents

1. [Core Concept: Functional Enhancement](#core-concept-functional-enhancement)
2. [How Behaviors "Inherit" from HTML Elements](#how-behaviors-inherit-from-html-elements)
3. [The Complete Call Chain](#the-complete-call-chain)
4. [HTML Declaration Pattern](#html-declaration-pattern)
5. [Behavior Anatomy](#behavior-anatomy)
6. [Advanced Features](#advanced-features)
7. [Creating Custom Behaviors](#creating-custom-behaviors)
8. [Best Practices](#best-practices)

---

## Core Concept: Functional Enhancement

### NOT Class Inheritance

WB behaviors do **NOT** use traditional OOP inheritance like Web Components:

```javascript
// ❌ NOT THIS (Web Components)
class MyButton extends HTMLButtonElement {
  constructor() {
    super();
  }
}
customElements.define('my-button', MyButton, { extends: 'button' });
```

### Functional Behavior Pattern

Instead, WB uses **functional enhancement**:

```javascript
// ✅ THIS (WB Behaviors)
export function button(element, options = {}) {
  // element is already an HTMLButtonElement
  // We just enhance it with additional features

  element.classList.add('wb-button');
  element.style.padding = '0.5rem 1rem';

  // Return cleanup function
  return () => element.classList.remove('wb-button');
}
```

**Key Points:**
- Each behavior is a **pure function**
- Takes a native HTML element as first parameter
- Enhances the element in place
- Returns a cleanup function
- No classes, no `extends`, no custom elements

---

## How Behaviors "Inherit" from HTML Elements

### The Browser Provides Inheritance

When you call a behavior function, you pass in a **native HTML element** that already has all standard properties and methods:

```javascript
import { button } from './behaviors/js/semantics/button.js';

// Get a native <button> element
const myButton = document.querySelector('button');
// myButton is already an HTMLButtonElement
// It already has: .click(), .disabled, .type, etc.

// Enhance it with the button behavior
button(myButton, { variant: 'primary' });
// Now it ALSO has: wb-button classes, custom styling, loading states, etc.
```

### Semantic Behaviors Map to Native Elements

| Behavior File | Expects Element Type | Native Inheritance |
|--------------|---------------------|-------------------|
| `button.js` | `<button>` | `HTMLButtonElement` |
| `img.js` | `<img>` | `HTMLImageElement` |
| `form.js` | `<form>` | `HTMLFormElement` |
| `video.js` | `<video>` | `HTMLVideoElement` |
| `input.js` | `<input>` | `HTMLInputElement` |
| `table.js` | `<table>` | `HTMLTableElement` |

**Example from `button.js:6`:**
```javascript
export function button(element, options = {}) {
  if (element.tagName !== 'BUTTON') {
    console.warn('[button] Element must be a <button>');
    return () => {};
  }
  // element is guaranteed to be HTMLButtonElement
  // with all native button properties already available
}
```

---

## The Complete Call Chain

### 1. HTML Declaration

Use standard semantic HTML elements (Auto-Inject):

```html
<!-- Semantic behaviors on native elements -->
<button data-variant="primary">Click me</button>
<img data-lazy data-zoomable src="photo.jpg" alt="Photo">
<form data-ajax data-validate>...</form>
<video controls autoplay>...</video>
```

Or use `data-wb` for explicit behavior injection (Legacy/Override):

```html
<!-- Multiple behaviors (space-separated) -->
<button data-wb="ripple tooltip" data-tooltip="Hello!">Hover</button>
```

**From `src/site-engine.js:95`:**
```javascript
<button class="nav__toggle" data-wb="ripple">☰</button>
```

### 2. WB.init() - Initialization

Called once when the page loads:

```javascript
import WB from './wb.js';

// Initialize the system
WB.init({
  scan: true,      // Scan existing elements
  observe: true,   // Watch for new elements
  theme: 'dark',   // Optional theme
  debug: false     // Debug mode
});
```

**From `src/site-engine.js:29`:**
```javascript
WB.init({ debug: false });
```

This triggers:
- **WB.scan()** - Finds all existing `[data-wb]` elements
- **WB.observe()** - Starts MutationObserver for dynamic elements

### 3. WB.scan() - Discovery

Finds and processes all elements with `data-wb` AND auto-injects behaviors on semantic tags (if enabled):

**From `src/wb.js:112-124`:**
```javascript
scan(root = document.body) {
  // 1. Find all elements with data-wb attribute
  const elements = root.querySelectorAll('[data-wb]');

  elements.forEach(element => {
    // Parse behavior list (space-separated)
    const behaviorList = element.dataset.wb.split(/\s+/).filter(Boolean);

    // Inject each behavior
    behaviorList.forEach(name => {
      WB.inject(element, name);  // <-- Calls the behavior!
    });
  });

  // 2. Auto-inject scan (if enabled)
  if (getConfig('autoInject')) {
    autoInjectMappings.forEach(({ selector, behavior }) => {
      const autoElements = root.querySelectorAll(selector);
      autoElements.forEach(element => {
        // Skip if data-wb is present (already handled) or ignored
        if (!element.hasAttribute('data-wb') && !element.hasAttribute('data-wb-ignore')) {
          WB.inject(element, behavior);
        }
      });
    });
  }

  Events.log('info', 'wb', `Scanned: ${elements.length} elements`);
}
```

### 4. WB.inject() - Behavior Application

The core method that actually calls your behavior functions:

**From `src/wb.js:40-79`:**
```javascript
inject(element, behaviorName, options = {}) {
  // Resolve element if string selector
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }

  // Validate element
  if (!element || !(element instanceof HTMLElement)) {
    console.warn(`[WB] Invalid element for behavior: ${behaviorName}`);
    return null;
  }

  // Check if behavior exists
  if (!behaviors[behaviorName]) {
    console.warn(`[WB] Unknown behavior: ${behaviorName}`);
    return null;
  }

  // Check if already applied
  const elementBehaviors = applied.get(element) || [];
  if (elementBehaviors.some(b => b.name === behaviorName)) {
    return null; // Already applied
  }

  try {
    // ✨ THIS IS WHERE THE MAGIC HAPPENS ✨
    // Call the behavior function, passing the element
    const cleanup = behaviors[behaviorName](element, options);
    //              ^^^^^^^^^^^^^^^^^^^^^^^^
    //              This calls button(), img(), form(), etc.

    // Track cleanup function for later removal
    elementBehaviors.push({ name: behaviorName, cleanup });
    applied.set(element, elementBehaviors);

    // Log event
    Events.log('info', 'wb', `Injected: ${behaviorName}`, { element: element.tagName });

    return cleanup;
  } catch (error) {
    console.error(`[WB] Error injecting ${behaviorName}:`, error);
    return null;
  }
}
```

### 5. MutationObserver - Auto-Detection

Watches for dynamically added elements and auto-injects behaviors:

**From `src/wb.js:131-177`:**
```javascript
observe(root = document.body) {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      // Handle added nodes
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if node itself has data-wb
          if (node.dataset?.wb) {
            const behaviorList = node.dataset.wb.split(/\s+/).filter(Boolean);
            behaviorList.forEach(name => WB.inject(node, name));
          }
          // Check descendants
          node.querySelectorAll?.('[data-wb]').forEach(el => {
            const behaviorList = el.dataset.wb.split(/\s+/).filter(Boolean);
            behaviorList.forEach(name => WB.inject(el, name));
          });
        }
      }

      // Handle attribute changes on data-wb
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-wb') {
        // Re-process when data-wb changes
      }
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-wb']
  });

  return observer;
}
```

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ HTML: <button data-variant="primary">                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Page Load → WB.init({ autoInject: true })               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ WB.scan() finds semantic elements (e.g. <button>)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ WB.inject(element, "button")                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ behaviors["button"](element, options)                   │
│ ← Your behavior function gets called!                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ button(element, { variant: "primary" })                 │
│ - Adds classes, styles, event listeners                 │
│ - Attaches API methods                                  │
│ - Returns cleanup function                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Enhanced Element Ready!                                 │
│ - Native button features (click, disabled, etc.)        │
│ - WB enhancements (variants, loading states, etc.)      │
└─────────────────────────────────────────────────────────┘
```

---

## Auto-Injection System

### Overview

The Auto-Injection system allows standard HTML5 semantic elements to automatically receive behaviors without explicit `data-wb` attributes. This feature was introduced to reduce markup verbosity and promote semantic HTML.

### Why It Was Done & Benefits

1.  **Cleaner Markup**: Removes the need to add `data-wb="card"` or `data-wb="navbar"` to every element. Your HTML looks like standard HTML.
2.  **Semantic Correctness**: Encourages developers to use proper tags like `<article>`, `<nav>`, `<dialog>`, etc., instead of generic `<div>`s.
3.  **Accessibility**: By targeting semantic elements, we ensure that the underlying markup is accessible by default, even before behaviors enhance it.
4.  **Portability**: The HTML remains standard and portable. If the JS library is removed, the content structure remains valid and meaningful.

### How It Works

When `WB.init({ autoInject: true })` is called:
1.  **Mapping**: The system uses a predefined map of selectors to behaviors (e.g., `article` -> `card`, `nav` -> `navbar`).
2.  **Scanning**: During `WB.scan()`, it queries for these selectors.
3.  **Precedence**: Explicit `data-wb` attributes **always** take precedence. If an element has `data-wb` (even empty), auto-injection is skipped.
4.  **Opt-Out**: You can prevent auto-injection on a specific element by adding `data-wb-ignore` or an empty `data-wb=""`.

**Example Mapping:**
```javascript
const autoInjectMappings = [
  { selector: 'article', behavior: 'card' },
  { selector: 'nav', behavior: 'navbar' },
  { selector: 'dialog', behavior: 'dialog' },
  // ...
];
```

---

## HTML Declaration Pattern

### Data Attributes as Configuration

All behavior options can be set via `data-*` attributes:

```html
<button

  data-variant="primary"
  data-size="lg"
  data-icon="→"
  data-loading>
  Submit
</button>
```

This becomes:
```javascript
button(element, {
  variant: 'primary',
  size: 'lg',
  icon: '→',
  loading: true
});
```

### How Options Merge

**From `button.js:11-19`:**
```javascript
const config = {
  variant: options.variant || element.dataset.variant || 'primary',
  size: options.size || element.dataset.size || 'md',
  icon: options.icon || element.dataset.icon || '',
  iconPosition: options.iconPosition || element.dataset.iconPosition || 'left',
  loading: options.loading ?? element.hasAttribute('data-loading'),
  disabled: options.disabled ?? element.hasAttribute('data-disabled'),
  ...options  // Explicit options override everything
};
```

**Priority (highest to lowest):**
1. Explicitly passed `options` parameter
2. `data-*` attributes on element
3. Default values

---

## Behavior Anatomy

### Standard Behavior Structure

**From `src/behaviors/js/semantics/img.js`:**
```javascript
/**
 * Image - Enhanced <img> element
 * Adds lazy loading, zoom/lightbox, fallback, aspect ratio
 */
export function img(element, options = {}) {
  // 1. Merge config from options + data attributes
  const config = {
    lazy: options.lazy ?? element.hasAttribute('data-lazy'),
    zoomable: options.zoomable ?? element.hasAttribute('data-zoomable'),
    placeholder: options.placeholder || element.dataset.placeholder || '',
    fallback: options.fallback || element.dataset.fallback || '',
    aspectRatio: options.aspectRatio || element.dataset.aspectRatio || '',
    ...options
  };

  // 2. Add identifying class
  element.classList.add('wb-img');

  // 3. Apply lazy loading
  if (config.lazy) {
    element.loading = 'lazy';
  }

  // 4. Apply aspect ratio
  if (config.aspectRatio) {
    element.style.aspectRatio = config.aspectRatio;
    element.style.objectFit = 'cover';
  }

  // 5. Add fallback on error
  if (config.fallback) {
    element.onerror = () => { element.src = config.fallback; };
  }

  // 6. Add zoom/lightbox feature
  if (config.zoomable) {
    element.classList.add('wb-img--zoomable');
    element.style.cursor = 'zoom-in';
    element.onclick = () => openLightbox(element.src, element.alt);
  }

  // 7. Mark as ready
  element.dataset.wbReady = 'img';

  // 8. Return cleanup function
  return () => element.classList.remove('wb-img', 'wb-img--zoomable');
}

export default { img };
```

### Key Components

1. **Config Merging** - Combine options + data attributes
2. **Element Enhancement** - Add classes, styles, listeners
3. **Feature Implementation** - Core behavior logic
4. **Ready Marker** - `element.dataset.wbReady = 'behaviorName'`
5. **Cleanup Function** - Remove all changes when behavior removed

---

## Advanced Features

### 1. Cleanup Functions

Every behavior returns a cleanup function that reverses all changes:

```javascript
// Inject behavior and get cleanup function
const cleanup = WB.inject(myElement, 'button', { variant: 'primary' });

// Later, remove the behavior
cleanup(); // Removes classes, listeners, API methods, etc.

// Or use WB.remove()
WB.remove(myElement, 'button'); // Calls cleanup automatically
```

**From `src/wb.js:87-106`:**
```javascript
remove(element, behaviorName = null) {
  const elementBehaviors = applied.get(element);
  if (!elementBehaviors) return;

  if (behaviorName) {
    // Remove specific behavior
    const index = elementBehaviors.findIndex(b => b.name === behaviorName);
    if (index !== -1) {
      const { cleanup } = elementBehaviors[index];
      if (typeof cleanup === 'function') cleanup();
      elementBehaviors.splice(index, 1);
    }
  } else {
    // Remove all behaviors
    elementBehaviors.forEach(({ cleanup }) => {
      if (typeof cleanup === 'function') cleanup();
    });
    applied.delete(element);
  }
}
```

### 2. API Attachment

Behaviors can attach custom methods to elements:

**From `video.js:24-37`:**
```javascript
// Video behavior attaches API methods
element.wbVideo = {
  play: () => element.play(),
  pause: () => element.pause(),
  toggle: () => element.paused ? element.play() : element.pause(),
  setTime: (t) => { element.currentTime = t; },
  getTime: () => element.currentTime,
  getDuration: () => element.duration,
  setVolume: (v) => { element.volume = Math.max(0, Math.min(1, v)); },
  getVolume: () => element.volume,
  mute: () => { element.muted = true; },
  unmute: () => { element.muted = false; },
  toggleMute: () => { element.muted = !element.muted; }
};
```

**Usage:**
```javascript
const video = document.querySelector('video');
video.wbVideo.toggle();  // Play/pause
video.wbVideo.setVolume(0.5);  // Set volume to 50%
```

**From `form.js:133-140`:**
```javascript
element.wbForm = {
  submit: () => element.requestSubmit(),
  reset: () => element.reset(),
  validate: () => element.checkValidity(),
  getData: () => Object.fromEntries(new FormData(element)),
  setLoading,
  showMessage
};
```

### 3. Custom Events

Behaviors can dispatch custom events:

**From `form.js:86-99`:**
```javascript
if (response.ok) {
  element.dispatchEvent(new CustomEvent('wb:form:success', {
    bubbles: true,
    detail: { response }
  }));
} else {
  element.dispatchEvent(new CustomEvent('wb:form:error', {
    bubbles: true,
    detail: { error: err }
  }));
}
```

**Listening for events:**
```javascript
const form = document.querySelector('form');
form.addEventListener('wb:form:success', (e) => {
  console.log('Form submitted!', e.detail.response);
});
```

### 4. Multiple Behaviors on One Element

Stack multiple behaviors on a single element:

```html
<button data-wb="button ripple tooltip"
        data-variant="primary"
        data-tooltip="Click me!">
  Submit
</button>
```

This applies three behaviors:
1. `button()` - Button styling and states
2. `ripple()` - Material Design ripple effect
3. `tooltip()` - Tooltip on hover

### 5. Manual Invocation

You can also call behaviors programmatically:

```javascript
import WB from './wb.js';
import { button } from './behaviors/js/semantics/button.js';

const myButton = document.querySelector('#myBtn');

// Method 1: Via WB.inject()
WB.inject(myButton, 'button', { variant: 'success' });

// Method 2: Direct function call
const cleanup = button(myButton, { variant: 'success' });

// Later, cleanup
cleanup();
```

### 6. Custom Behavior Registration

Register your own behaviors at runtime:

```javascript
import WB from './wb.js';

// Define custom behavior
function myBehavior(element, options = {}) {
  element.classList.add('my-custom-class');
  element.style.border = '2px solid red';

  return () => {
    element.classList.remove('my-custom-class');
    element.style.border = '';
  };
}

// Register it
WB.register('mybehavior', myBehavior);

// Now use it in HTML
// <div data-wb="mybehavior">Content</div>
```

**From `src/wb.js:212-218`:**
```javascript
register(name, fn) {
  if (typeof fn !== 'function') {
    throw new Error(`[WB] Behavior must be a function: ${name}`);
  }
  behaviors[name] = fn;
  Events.log('info', 'wb', `Registered: ${name}`);
}
```

---

## Creating Custom Behaviors

### Step 1: Create the Behavior File

Create a new file in `src/behaviors/js/`:

```javascript
// src/behaviors/js/my-custom.js

/**
 * MyCustom - Custom behavior description
 * Add your feature description here
 */
export function mycustom(element, options = {}) {
  // 1. Merge config
  const config = {
    color: options.color || element.dataset.color || 'blue',
    size: options.size || element.dataset.size || 'md',
    ...options
  };

  // 2. Add identifying class
  element.classList.add('wb-mycustom');

  // 3. Apply styles
  element.style.color = config.color;

  // 4. Add event listeners
  const handleClick = () => {
    console.log('Custom behavior clicked!');
  };
  element.addEventListener('click', handleClick);

  // 5. Attach API (optional)
  element.wbMyCustom = {
    setColor: (color) => { element.style.color = color; },
    getColor: () => element.style.color
  };

  // 6. Mark as ready
  element.dataset.wbReady = 'mycustom';

  // 7. Return cleanup function
  return () => {
    element.classList.remove('wb-mycustom');
    element.style.color = '';
    element.removeEventListener('click', handleClick);
    delete element.wbMyCustom;
  };
}

export default { mycustom };
```

### Step 2: Register in `src/behaviors/index.js`

**Add to imports:**
```javascript
import { mycustom } from './js/my-custom.js';
```

**Add to export:**
```javascript
export const behaviors = {
  // ... existing behaviors ...
  mycustom,
};
```

### Step 3: Use in HTML

```html
<div data-wb="mycustom" data-color="red" data-size="lg">
  Custom content
</div>
```

### Step 4: Create Schema (Optional but Recommended)

Create `src/behaviors/schema/mycustom.schema.json` for testing and documentation.

---

## Best Practices

### 1. Always Return Cleanup Functions

```javascript
// ✅ Good
export function mybehavior(element, options = {}) {
  element.classList.add('wb-mybehavior');

  const handleClick = () => console.log('clicked');
  element.addEventListener('click', handleClick);

  return () => {
    element.classList.remove('wb-mybehavior');
    element.removeEventListener('click', handleClick);
  };
}

// ❌ Bad - No cleanup
export function mybehavior(element, options = {}) {
  element.classList.add('wb-mybehavior');
  element.addEventListener('click', () => console.log('clicked'));
  // No return statement = memory leaks!
}
```

### 2. Use Descriptive Class Names

```javascript
// ✅ Good - Clear hierarchy
element.classList.add('wb-button');
element.classList.add('wb-button--primary');
element.classList.add('wb-button--loading');

// ❌ Bad - Unclear naming
element.classList.add('btn');
element.classList.add('active');
```

### 3. Merge Options Properly

```javascript
// ✅ Good - Check all sources
const config = {
  variant: options.variant || element.dataset.variant || 'default',
  ...options  // Explicit options override
};

// ❌ Bad - Ignores data attributes
const config = {
  variant: options.variant || 'default'
};
```

### 4. Validate Element Type

```javascript
// ✅ Good - Validate expected element
export function button(element, options = {}) {
  if (element.tagName !== 'BUTTON') {
    console.warn('[button] Element must be a <button>');
    return () => {};
  }
  // Continue with logic
}

// ❌ Bad - No validation
export function button(element, options = {}) {
  element.disabled = true; // Might fail on non-button elements
}
```

### 5. Mark Elements as Ready

```javascript
// ✅ Good - Mark when done
element.dataset.wbReady = 'behaviorName';

// Can check if already initialized
if (element.dataset.wbReady === 'behaviorName') {
  console.log('Already initialized');
}
```

### 6. Use Semantic HTML

```javascript
// ✅ Good - Enhance native elements (Auto-Inject)
<button>Click</button>
<img src="...">
<form>...</form>

// ❌ Bad - Generic divs everywhere
<div data-wb="button">Click</div>
<div data-wb="img">...</div>
```

### 7. Dispatch Custom Events for Important Actions

```javascript
// ✅ Good - Let others listen
element.dispatchEvent(new CustomEvent('wb:behavior:action', {
  bubbles: true,
  detail: { data: 'value' }
}));

// Listen elsewhere
element.addEventListener('wb:behavior:action', (e) => {
  console.log('Action happened!', e.detail);
});
```

### 8. Keep Behaviors Focused

```javascript
// ✅ Good - Single responsibility
export function button(element, options) {
  // Only handles button-specific logic
}

export function ripple(element, options) {
  // Only handles ripple effect
}

// Use together: data-wb="button ripple"

// ❌ Bad - Does too much
export function button(element, options) {
  // Button logic + ripple + tooltip + validation + ...
}
```

---

## Key Takeaways

1. **Functional, not Class-based** - Behaviors are functions that enhance native elements
2. **Progressive Enhancement** - Start with semantic HTML, enhance with `data-wb`
3. **No Inheritance** - The browser provides inheritance; we just add features
4. **Declarative** - Configuration via data attributes
5. **Composable** - Stack multiple behaviors on one element
6. **Automatic** - `WB.init()` scans and observes, no manual wiring
7. **Clean Lifecycle** - Every behavior has setup and teardown
8. **Zero Build** - Pure ES6 modules, runs natively in browser

---

## Related Documentation

- **Architecture Overview**: `docs/architecture.md`
- **Testing Standard**: `docs/test-schema-standard.md`
- **Semantic Standard**: `docs/semantic-standard.md`
- **CSS Standards**: `docs/css-standards.md`
- **Component Docs**: `docs/components/`

---

**Last Updated**: 2025-12-21
