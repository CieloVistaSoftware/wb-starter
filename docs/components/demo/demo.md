# wb-demo

A container that does two things:

1. Renders its children normally (in a CSS grid)
2. Shows the raw HTML as a syntax-highlighted, auto-formatted code sample below

That's it.

## Usage

```html
<wb-demo columns="3">
  <wb-card title="Elevated Card" elevated>
    <p>This card has elevation shadow.</p>
  </wb-card>
  <wb-card title="Clickable Card" clickable>
    <p>Click me! I'm interactive.</p>
  </wb-card>
  <wb-card title="With Footer" footer="Last updated: Today">
    <p>This card has a footer section.</p>
  </wb-card>
</wb-demo>
```

This renders three cards in a row. Below them, the exact HTML above appears as a syntax-highlighted code sample — automatically. The code is auto-formatted with consistent 2-space indentation regardless of how the source is written.

## Attributes

| Attribute | Type    | Default | Description                   |
|-----------|---------|---------|-------------------------------|
| columns   | integer | 3       | Grid columns for children (1-6) |

## How It Works

1. `demo()` fetches the raw page source via `fetch(location.href)`
2. Extracts the nth `<wb-demo>` block from the raw source using regex
3. `formatHtml()` auto-formats the raw source: trims blank lines, strips common indent, re-indents with 2 spaces based on tag nesting
4. Wraps live children in a `.wb-demo__grid` div (CSS grid, `columns` wide)
5. Creates a `<pre><code>` block and sets the formatted source via `textContent`
6. WB scans the pre/code for syntax highlighting (x-pre, x-code)

## Why fetch + textContent?

Two problems had to be solved:

**Problem 1: innerHTML is inflated.** Child custom elements like `wb-card` inflate via `connectedCallback` before `wb-demo`'s behavior runs. By the time `demo()` reads `innerHTML`, cards already have injected headers, footers, inline styles, and classes. Solution: fetch the raw HTML file from the server before the browser touches it.

**Problem 2: innerHTML creates real elements.** Setting `mdEl.innerHTML = rawBlock` makes the browser parse the raw HTML into real `<wb-card>` elements. The MutationObserver picks them up and inflates them. By the time anything reads the content back, it's bloated. Solution: use `textContent` on a `<code>` element — the browser treats it as plain text, no parsing, no custom elements, no inflation.

## Auto-Formatting

The `formatHtml()` function normalizes code display regardless of source indentation:

- Trims blank lines from top and bottom
- Finds the minimum indent across all lines and strips it (dedent)
- Re-indents based on HTML tag nesting using 2-space indentation
- Handles void tags (br, hr, img, etc.) without adding depth
- Handles self-closing tags
- Skips blank lines in output

## CSS Setup

**Required:** `demo.css` must be imported in `site.css`:
```css
@import url('./behaviors/demo.css');
```

All styles in `src/styles/behaviors/demo.css`. Zero inline styles.

- `wb-demo` — block container, margin-bottom 1rem, max-width 100vw
- `.wb-demo__grid` — CSS grid with 1rem gap
- `.wb-demo__grid--cols-{n}` — column count (1-6)
- `.wb-demo__code` / `pre` / `.x-pre-wrapper` — 0.5rem top margin below grid
- Responsive: 2 cols at 768px, 1 col at 480px

## Theme Dependency

The page must have `data-theme` set on `<html>` for proper dark/light mode. The `[data-theme]` rule in `themes.css` applies both `background-color: var(--bg-color)` and `color: var(--text-primary)` to the page.

## Files

| File | Purpose |
|------|---------|
| `src/wb-viewmodels/demo.js` | Behavior logic (fetch, format, render) |
| `src/wb-viewmodels/wb-demo.js` | Custom element registration |
| `src/wb-models/demo.schema.json` | Schema |
| `src/styles/behaviors/demo.css` | Styles (must be imported in site.css) |
