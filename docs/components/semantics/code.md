# Code Component Design & User Guide

## 1. Design Philosophy

The `code` component enhances the `<code>` element to support both inline and block-level code snippets. It adds developer-friendly features like syntax highlighting (via CSS classes), a copy-to-clipboard button, and language badges.

### Key Features
- **Inline & Block Modes**: Automatically detects or configures display mode.
- **Copy Button**: One-click copy functionality with visual feedback.
- **Language Badge**: Displays the programming language name.
- **Theming**: Uses CSS variables for easy dark/light mode adaptation.

## 2. User Guide

### Basic Usage
Add `data-wb="code"` to a `<code>` element.

```html
<code data-wb="code">const x = 1;</code>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-language` | String | `''` | Language name to display (e.g., "JS", "HTML"). |
| `data-show-copy` | Boolean | `false` | Show a copy button (block mode only). |
| `data-variant` | String | `inline` | Display style: `inline`, `block`. |

## 3. Examples

### Example 1: Inline Code
Simple inline code highlighting.

```html
<p>Use the <code data-wb="code">init()</code> function to start.</p>
```

### Example 2: Code Block with Copy
A code block with a language badge and copy button.

```html
<code 
  data-wb="code" 
  data-variant="block" 
  data-language="JS" 
  data-show-copy="true">
function hello() {
  console.log("Hello World");
}
</code>
```

## 4. Why It Works
For block-level code, the component wraps the `<code>` element in a relative container. This allows absolute positioning of the "Copy" button and language badge. The copy functionality uses the `navigator.clipboard` API for a seamless experience.
