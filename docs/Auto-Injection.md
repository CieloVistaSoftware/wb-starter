# Auto Injection (Preview)

## Overview

**Auto Injection (Preview)** is a core feature of Web Behaviors (WB) that automatically enhances standard HTML5 semantic elements with rich functionality. Instead of manually adding `data-wb` attributes to every element, you simply write standard, semantic HTML, and WB "wakes up" the elements at runtime.

This approach promotes:
1.  **Cleaner Markup**: No proprietary attributes cluttering your HTML.
2.  **Semantic Correctness**: Encourages the use of proper tags (`<nav>`, `<article>`, `<dialog>`).
3.  **Accessibility**: Semantic elements are inherently more accessible.
4.  **Portability**: Your HTML remains standard and works (without behavior) even if JS fails.

---

## How It Works

When `WB.init({ autoInject: true })` is called (which is the default in this starter kit), the library scans the DOM for specific tags and injects the corresponding behaviors.

### Precedence Rule
**Explicit overrides Implicit.**
If an element has a `data-wb` attribute (even if empty), Auto Injection is **skipped** for that element. This allows you to opt-out or override the default behavior.

---

## Mapping Reference

The following HTML elements are automatically mapped to WB behaviors:

### Structure & Layout
| HTML Tag | Injected Behavior | Description |
|----------|-------------------|-------------|
| `<article>` | `card` | Becomes a card component |
| `<nav>` | `navbar` | Becomes a responsive navigation bar |
| `<aside>` | `sidebar` | Becomes a sidebar/drawer |
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
| `<img>` | `image` | Lazy loading and fade-in |
| `<video>` | `video` | Custom player controls |
| `<audio>` | `audio` | Custom audio player |
| `<code>` | `code` | Inline code styling |
| `<pre>` | `pre` | Code block with copy button |
| `<kbd>` | `kbd` | Keyboard key styling |
| `<mark>` | `mark` | Highlight styling |
| `<progress>` | `progress` | Animated progress bar |

---

## Examples

### 1. Card Component
**Old Way:**
```html
<div data-wb="card">
  <div class="wb-card__header">Title</div>
  <div class="wb-card__main">Content</div>
</div>
```

**New Way (Auto Injection):**
```html
<article>
  <header><h3>Title</h3></header>
  <main>Content</main>
</article>
```

### 2. Navigation Bar
**Old Way:**
```html
<nav data-wb="navbar">
  <ul>...</ul>
</nav>
```

**New Way (Auto Injection):**
```html
<nav>
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
  </ul>
</nav>
```

### 3. Modal Dialog
**Old Way:**
```html
<div data-wb="modal">...</div>
```

**New Way (Auto Injection):**
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

If you want to use a semantic element *without* the WB behavior, simply add an empty `data-wb` attribute.

```html
<!-- This <nav> will NOT become a WB Navbar -->
<nav data-wb="">
  <a href="#">Just a link</a>
</nav>
```

## Overriding

If you want to use a semantic element but apply a *different* behavior, specify it in `data-wb`.

```html
<!-- Uses 'hero' behavior instead of 'card' -->
<article data-wb="hero">
  <h1>Welcome</h1>
</article>
```
