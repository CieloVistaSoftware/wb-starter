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
| `data-scrollable` | Boolean | `false` | If true, enables scrolling. If false (default), wraps content and expands height. |

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

### Example 3: Scrollable Code Block
A code block that scrolls instead of wrapping.

```html
<code 
  data-wb="code" 
  data-variant="block" 
  data-scrollable="true">
const veryLongLine = "This is a very long line of code that will scroll horizontally instead of wrapping to the next line because scrollable is set to true.";
</code>
```

## 4. Why It Works
For block-level code, the component wraps the `<code>` element in a relative container. This allows absolute positioning of the "Copy" button and language badge. The copy functionality uses the `navigator.clipboard` API for a seamless experience.
