# Code Examples Standard

## Overview

This document defines formatting standards for code examples in documentation, demos, and HTML files throughout the Web Behaviors (WB) Starter project.

---

## Formatting Rules

### Rule 1: ALL HTML attributes MUST start on their own line - NO EXCEPTIONS

When writing HTML code examples, **every attribute** must be placed on its own line with proper indentation (2 spaces from the tag). This applies to:
- `data-*` attributes
- `id`, `class`, `style` attributes  
- `type`, `name`, `value` attributes
- Event handlers (`onclick`, etc.)
- **ALL other attributes**

### Rule 2: Prefer Auto-Inject (Semantic HTML) Format

Code examples should prefer the **auto-inject format** using semantic HTML elements. The explicit `data-wb` format should be shown as a secondary option or note.

### Rule 3: Include Format Notes

Each code example should include an xs-font note explaining alternative syntax options.

---

## Configuration Options

The code example display system supports configurable formatting:

| Option | Default | Description |
|--------|---------|-------------|
| `format` | `"multiline"` | `"multiline"` or `"inline"` attribute placement |
| `showAutoinject` | `true` | Show semantic HTML (autoinject) format |
| `showExplicit` | `true` | Show explicit `data-wb` format in notes |
| `showNotes` | `true` | Display format notes below examples |

### Programmatic Configuration

```javascript
// In code example generators
const codeDisplayConfig = {
  format: 'multiline',      // Default: attributes on new lines
  showAutoinject: true,     // Default: show semantic format
  showExplicit: true,       // Show data-wb alternative
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
  data-variant="primary"
  data-size="lg">
  Click Me
</button>

<!-- Card - uses semantic <article> element -->
<article 
  data-title="My Card"
  data-elevated="true">
  Content here
</article>

<!-- Input with multiple attributes -->
<input 
  type="text"
  id="email"
  name="email"
  placeholder="Enter email"
  data-validation="email"
  data-required="true">

<!-- Link with all attributes on new lines -->
<a 
  href="#home"
  class="nav-link"
  data-active="true">
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
  data-wb="card"
  data-title="My Card"
  data-elevated="true">
  Content here
</div>

<!-- Combining multiple behaviors -->
<button 
  data-wb="button ripple toast"
  data-variant="primary"
  data-message="Saved!">
  Save
</button>

<!-- Form element with all attributes -->
<input 
  type="checkbox"
  id="agree"
  name="terms"
  data-wb="checkbox"
  checked>
```

---

## Semantic Element Mapping

| Behavior | Auto-Inject Element | Explicit Alternative |
|----------|---------------------|---------------------|
| `button` | `<button>` | `<div data-wb="button">` |
| `card` | `<article>` | `<div data-wb="card">` |
| `details` | `<details>` | `<div data-wb="details">` |
| `dialog` | `<dialog>` | `<div data-wb="dialog">` |
| `navbar` | `<nav>` | `<div data-wb="navbar">` |
| `sidebar` | `<aside>` | `<div data-wb="sidebar">` |
| `audio` | `<audio>` | `<div data-wb="audio">` |
| `video` | `<video>` | `<div data-wb="video">` |
| `figure` | `<figure>` | `<div data-wb="figure">` |
| `table` | `<table>` | `<div data-wb="table">` |
| `input` | `<input>` | `<input data-wb="input">` |
| `textarea` | `<textarea>` | `<textarea data-wb="textarea">` |
| `select` | `<select>` | `<select data-wb="select">` |
| `progress` | `<progress>` | `<div data-wb="progressbar">` |

---

## Example Notes Format

Each code example should include an explanatory note in xs font:

```html
<p class="code-note" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem;">
  ℹ️ Auto-injects via &lt;button&gt;. Explicit: data-wb="button"
</p>
```

### Note Templates by Component Type

| Component | Note Text |
|-----------|-----------|
| Button | `ℹ️ Auto-injects via <button>. Explicit: data-wb="button"` |
| Card | `ℹ️ Auto-injects via <article>. Explicit: data-wb="card"` |
| Details | `ℹ️ Auto-injects via <details>. Explicit: data-wb="details"` |
| Input | `ℹ️ Auto-injects via <input>. Explicit: data-wb="input"` |
| No Auto-Inject | `ℹ️ No auto-inject. Use: data-wb="behaviorname"` |

---

## Inline Format (Optional Override)

For compact documentation or specific use cases, inline format can be enabled:

### Configuration to Enable Inline

```javascript
const codeDisplayConfig = {
  format: 'inline'  // Switch to inline format
};
```

### Inline Format Example

```html
<button data-variant="primary" data-size="lg">Click Me</button>
```

**Note:** Inline format should only be used when:
- Space is extremely limited
- Showing single-attribute elements
- Explicitly requested by configuration

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
  data-wb="card"
  data-title="Card Title"
  data-subtitle="Subtitle"
  data-elevated="true"
  data-clickable="true">
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

- [CSS Standards](./css-standards.md) - CSS architecture and layering
- [Semantic Standard](./semantic-standard.md) - HTML semantic structure
- [Auto-Injection](./Auto-Injection.md) - Auto-inject behavior system
- [Test Schema Standard](./test-schema-standard.md) - Component schema testing

---

*This document is the single source of truth for code example formatting in WB Starter.*
