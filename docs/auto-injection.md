# Auto Injection (Preview)

## Overview

**Auto Injection (Preview)** is a core feature of WB-Starter that automatically enhances standard HTML5 semantic elements with rich functionality. Instead of manually adding `x-*` attributes to every element, you simply write standard, semantic HTML, and WB "wakes up" the elements at runtime.

This approach promotes:
1.  **Cleaner Markup**: No proprietary attributes cluttering your HTML.
2.  **Semantic Correctness**: Encourages the use of proper tags (`<nav>`, `<article>`, `<dialog>`).
3.  **Accessibility**: Semantic elements are inherently more accessible.
4.  **Portability**: Your HTML remains standard and works (without behavior) even if JS fails.

---

## How It Works

When `WB.init({ autoInject: true })` is called, the library scans the DOM for specific tags and injects the corresponding behaviors. **Note: `autoInject` is `false` by default** to preserve semantic HTML behavior.

### Precedence Rule
**Auto Injection is additive.**
It applies the default behavior for the element type. You can add *additional* behaviors using explicit attributes (like `x-ripple`).

If you want to **prevent** Auto Injection for a specific element, use the `x-ignore` attribute.

This `<button>` gets the `button` behavior from its tag and `ripple` from its attribute; the `<nav>` does not become a WB navbar:

<div x-demo>
<button x-ripple>Click Me</button>
<nav x-ignore>
  <a href="#">Just a link</a>
</nav>
</div>

---

## Mapping Reference

The following HTML elements are automatically mapped to WB behaviors:

### Structure & Layout
| HTML Tag | Injected Behavior | Description |
|----------|-------------------|-------------|
| `<article>` | `card` | Becomes a card behavior |
| `<nav>` | `navbar` | Becomes a responsive navigation bar |
| `<table>` | `table` | Adds sorting and responsive styling |
| `<details>` | `details` | Enhances the expand/collapse animation |
| `<dialog>` | `dialog` | Adds modal management and backdrop |

### Forms
| HTML Tag | Injected Behavior | Description |
|----------|-------------------|-------------|
| `<form>` | `form` | Adds validation and AJAX handling |
| `<input>` | *varies* | `checkbox`, `radio`, `range`, or generic `input` styling |
| `<select>` | `select` | Custom dropdown styling |
| `<textarea>` | `textarea` | Auto-resizing text area |
| `<button>` | `button` | Ripple effects and loading states |
| `<fieldset>` | `fieldset` | Group styling |
| `<label>` | `label` | Enhanced label interactions |

### Media & Text
| HTML Tag | Injected Behavior | Description |
|----------|-------------------|-------------|
| `<img>` | `img` | Lazy loading and fade-in |
| `<video>` | `video` | Custom player controls |
| `<audio>` | `audio` | Custom audio player |
| `<code>` | `code` | Inline code styling |
| `<pre>` | `pre` | Code block with copy button |
| `<kbd>` | `kbd` | Keyboard key styling |
| `<mark>` | `mark` | Highlight styling |
| `<progress>` | `progress` | Animated progress bar |

---

## Examples

### 1. Card Behavior
**Explicit (any other host):**

<div x-demo>
<section x-card title="Title">
  <p>Content</p>
</section>
</div>

**Implicit (Auto Injection):**
```html
<article>
  <header>
    <h3>Title</h3>
  </header>
  <p>Content</p>
</article>
```

### 2. Navigation Bar
**Implicit (Auto Injection):**
```html
<nav>
  <ul>
    <li>
      <a href="#">Home</a>
    </li>
    <li>
      <a href="#">About</a>
    </li>
  </ul>
</nav>
```

### 3. Modal Dialog
**Explicit (Shorthand):**
```html
<dialog>...</dialog>
```

**Implicit (Auto Injection):**
```html
<dialog>
  <header>
    <h2>Settings</h2>
    <button formmethod="dialog">×</button>
  </header>
  <main>...</main>
</dialog>
```

---

## Opting Out

If you want to use a semantic element *without* the WB behavior, add the `x-ignore` attribute. This `<nav>` does not become a WB navbar:

<div x-demo>
<nav x-ignore>
  <a href="#">Just a link</a>
</nav>
</div>

## Overriding

If you want to use a semantic element but apply a *different* behavior, name it with its attribute. This `<article>` is built by `cardhero` instead of the plain `card`, and renders one card, not two (#923):

<div x-demo>
<article
  x-cardhero
  title="Welcome"
  subtitle="Start with semantic HTML">
</article>
</div>
