# Code Examples Standard

## Overview

This document defines formatting standards for code examples in documentation, demos, and HTML files throughout the WB-Starter Starter project.

---

## Formatting Rules

### Rule 1: ALL HTML attributes MUST start on their own line - NO EXCEPTIONS

When writing HTML code examples, **every attribute** must be placed on its own line with proper indentation (2 spaces from the tag). This applies to:
- Component config attributes (`title`, `variant`, `size`, `value`, …) — plain v3 attributes, **never** `data-*` (deprecated)
- `id`, `class`, `style` attributes
- `type`, `name`, `value` attributes
- Event handlers (`onclick`, etc.)
- **ALL other attributes**

### Rule 2: Prefer Auto-Inject (Semantic HTML) Format

Code examples should prefer the **auto-inject format** using semantic HTML elements. The explicit `x-behavior` format should be shown as a secondary option or note.

### Rule 3: Include Format Notes

Each code example should include an xs-font note explaining alternative syntax options.

### Rule 4: Every renderable code example MUST use `<wb-demo>` — no static, un-rendered code fences

A code example that shows real `wb-*`/`x-*` markup must be a LIVE `<wb-demo>` block, not
a plain ` ```html ` fenced code block that only shows text. `<wb-demo>` renders the markup
for real AND auto-generates the formatted code sample (with copy button) from it — one
source of truth, always in sync, never a hand-typed sample that silently drifts from what
actually renders.

```html
<!-- ❌ WRONG — static, never rendered, can drift from reality -->

```html
<wb-card title="Hello" variant="elevated">
  <p>It just works.</p>
</wb-card>
```

<!-- ✅ CORRECT — live, rendered, code sample auto-generated from the real markup -->
<wb-demo>
<wb-card title="Hello" variant="elevated">
  <p>It just works.</p>
</wb-card>
</wb-demo>
```

The only exception: a block illustrating something that genuinely isn't renderable in
isolation — a CSS-only snippet, a JS-only snippet, an accessibility attribute reference
table, or intentionally-invalid markup demonstrating what NOT to do. Those stay as plain
fenced code. If the block shows a real component/behavior usage, it must be `<wb-demo>`.

---

## Configuration Options

The code example display system supports configurable formatting:

| Option | Default | Description |
|--------|---------|-------------|
| `format` | `"multiline"` | `"multiline"` or `"inline"` attribute placement |
| `showAutoinject` | `true` | Show semantic HTML (autoinject) format |
| `showExplicit` | `true` | Show explicit `x-behavior` format in notes |
| `showNotes` | `true` | Display format notes below examples |

### Programmatic Configuration

```javascript
// In code example generators
const codeDisplayConfig = {
  format: 'multiline',      // Default: attributes on new lines
  showAutoinject: true,     // Default: show semantic format
  showExplicit: true,       // Show x-behavior alternative
  showNotes: true           // Show explanatory notes
};
```

---

## Auto-Inject Format (Default)

The preferred format uses semantic HTML elements that auto-inject behaviors:

### ✅ CORRECT (Auto-Inject / Semantic)

```html
<!-- Button - uses native <button> element -->
<button
  variant="primary"
  size="lg">
  Click Me
</button>
<!-- Card - uses semantic <article> element -->
<article
  title="My Card"
  elevated="true">
  Content here
</article>
<!-- Input with multiple attributes -->
<input
  type="text"
  id="email"
  name="email"
  placeholder="Enter email"
  validation="email"
  required="true">
<!-- Link with all attributes on new lines -->
<a
  href="#home"
  class="nav-link"
  active="true">
  Home
</a>
```

---

## Explicit Format (Legacy/Override)

When you need to override auto-injection or apply behaviors to non-semantic elements:

### Explicit Syntax

```html
<!-- Explicit behavior injection -->
<div
  x-card
  title="My Card"
  elevated="true">
  Content here
</div>
<!-- Combining multiple behaviors -->
<button
  x-button
  x-ripple
  x-toast
  variant="primary"
  message="Saved!">
  Save
</button>
<!-- Form element with all attributes -->
<input
  type="checkbox"
  id="agree"
  name="terms"
  x-checkbox
  checked>
```

---

## Semantic Element Mapping

| Behavior | Auto-Inject Element | Explicit Alternative |
|----------|---------------------|---------------------|
| `button` | `<button>` | `<div x-button>` |
| `card` | `<article>` | `<div x-card>` |
| `details` | `<details>` | `<div x-details>` |
| `dialog` | `<dialog>` | `<div x-dialog>` |
| `navbar` | `<nav>` | `<div x-navbar>` |
| `sidebar` | `<aside>` | `<div x-sidebar>` |
| `audio` | `<audio>` | `<div x-audio>` |
| `video` | `<video>` | `<div x-video>` |
| `figure` | `<figure>` | `<div x-figure>` |
| `table` | `<table>` | `<div x-table>` |
| `input` | — (not auto-injected; bare `<input>` needs `x-input`) | `<input x-input>` |
| `textarea` | `<textarea>` | — (auto-injects, `x-textarea` is redundant) |
| `select` | `<select>` | — (auto-injects, `x-select` is redundant) |
| `progress` | `<progress>` | `<div x-progressbar>` |

---

## Example Notes Format

Each code example should include an explanatory note in xs font:

```html
<p
  class="code-note"
  style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem;">
  ℹ️ Auto-injects via &lt;button&gt;. Explicit: x-button
</p>
```

### Note Templates by Component Type

| Component | Note Text |
|-----------|-----------|
| Button | `ℹ️ Auto-injects via <button>. Explicit: x-button` |
| Card | `ℹ️ Auto-injects via <article>. Explicit: x-card` |
| Details | `ℹ️ Auto-injects via <details>. Explicit: x-details` |
| Input | `ℹ️ Auto-injects via <input>. Explicit: x-input` |
| No Auto-Inject | `ℹ️ No auto-inject. Use: x-behaviorname` |

---

## Vertical Format Is the ONLY Format

There is **no inline override**. Code examples are always vertical — a multi-attribute
element renders each attribute on its own line (see
[Demos & Documentation Standards](./standards/DEMOS-AND-DOCS-STANDARDS.md) §5).

**The one exception — short elements:** an element whose entire tag is short
(roughly **under 25 characters**, e.g. `<wb-badge label="New">`) may stay on a single
line, one element per line. Never split a short tag pointlessly, and never cram a long
multi-attribute tag onto one line.

```html
<!-- Short tags: one element per line -->
<wb-badge label="New"></wb-badge>
<wb-badge label="Done" variant="success"></wb-badge>

<!-- Long tags: one attribute per line -->
<button
  variant="primary"
  size="lg">
  Click Me
</button>
```

---

## Attribute Indentation Rules

| Context | Indentation |
|---------|-------------|
| First attribute | Same line as tag OR new line + 2 spaces |
| Subsequent attributes | New line + 2 spaces from tag |
| Closing `>` | Same line as last attribute OR new line aligned with `<` |

### Indentation Example

```html
<article
  x-card
  title="Card Title"
  subtitle="Subtitle"
  elevated="true"
  clickable="true">
  Content goes here
</article>
<!-- Even style attributes get their own line -->
<div
  class="demo-box"
  id="main-content"
  style="padding: 1rem; background: var(--bg-primary);">
  Content
</div>
<!-- Video with all attributes -->
<video
  controls
  width="300"
  src="video.mp4"
  poster="thumbnail.jpg">
</video>
```

---

## Where This Applies

| Location | Applies? | Notes |
|----------|----------|-------|
| `demos/*.html` | ✅ Yes | All demo code examples |
| `docs/*.md` code blocks | ✅ Yes | All markdown documentation |
| `pages/*.html` inline examples | ✅ Yes | Any code shown to users |
| `public/papers/*.html` figures | ✅ Yes | Academic paper examples |
| Production HTML | ⚠️ Optional | Source should follow standard |
| Test fixtures | ✅ Yes | Test code should be exemplary |

---

## Exceptions

**NONE** - All attributes must be on new lines in code examples.

The only acceptable variations:

1. **Inline config enabled**: When explicitly configured via `format: 'inline'`
2. **Generated HTML**: Runtime-generated HTML follows practical format
3. **Minified output**: Build tools may minify - source files must follow standard

---

## Enforcement

This standard is checked by:
1. Code review
2. Pre-commit linting (future)
3. AI assistants following project guidelines
4. Automated code example generators

---

## Related Standards

- CSS Standards - CSS architecture and layering
- [Semantic Standard](./semantic-standard.md) - HTML semantic structure
- [Auto-Injection](./Auto-Injection.md) - Auto-inject behavior system
- [Test Schema Standard](./test-schema-standard.md) - Component schema testing

---

*This document is the single source of truth for code example formatting in WB Starter.*
