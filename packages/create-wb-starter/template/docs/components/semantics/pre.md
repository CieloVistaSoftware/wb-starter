# Pre Component Design & User Guide

## 1. Design Philosophy

The `pre` component upgrades the `<pre>` element to be a full-featured code block container. It addresses the needs of technical documentation by adding line numbers, copy functionality, and proper overflow handling, making code snippets easier to read and use.

### Key Features
- **Line Numbers**: Automatic line numbering for easy reference.
- **Copy Button**: One-click copy to clipboard.
- **Language Badge**: Visual indicator of the content type.
- **Overflow Handling**: Scrollable container with optional wrapping.

## 2. User Guide

### Basic Usage
`autoInjectComponents` is on by default — a plain `<pre>` is enhanced
automatically, no `x-pre` attribute needed.

```html
<pre>
Line 1
Line 2
</pre>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `language` | String | `''` | Language label (e.g., "JSON"). |
| `show-line-numbers` | Boolean | `false` | Show line numbers gutter. |
| `show-copy` | Boolean | `false` | Show copy button. |
| `wrap` | Boolean | `false` | Enable text wrapping. |
| `max-height` | String | `''` | Max height with scroll (e.g., "300px"). |

## 3. Examples

### Example 1: Code Block with Features
A complete code block with all features enabled.

```html
<pre
  language="JS"
  show-line-numbers="true"
  show-copy="true">
const x = 10;
const y = 20;
console.log(x + y);
</pre>
```

### Example 2: Log Output
A scrollable container for long text output.

```html
<pre
  max-height="200px"
  wrap="true">
[INFO] Starting server...
[INFO] Connected to DB...
...
</pre>
```

## 4. Why It Works
The component wraps the `<pre>` in a relative container to position the absolute elements (copy button, language badge). For line numbers, it splits the text content by newline characters (`\n`) and generates a separate column of numbers, ensuring they align perfectly with the text lines even when scrolling.
