# OL (Ordered List) Component Design & User Guide

## 1. Design Philosophy

The `ol` component transforms the standard ordered list into a versatile tool for displaying sequences. It goes beyond simple numbering to support complex visualizations like step-by-step guides and timelines, all while maintaining semantic HTML structure.

### Key Features
- **Variants**: `default`, `stepped` (circular numbers), `timeline` (vertical line).
- **Custom Numbering**: Support for roman numerals, letters, etc.
- **Gap Control**: Configurable spacing between items.
- **Start Value**: Respects the native `start` attribute.

## 2. User Guide

### Basic Usage
Add `data-wb="ol"` to an `<ol>` element.

```html
<ol data-wb="ol">
  <li>First item</li>
  <li>Second item</li>
</ol>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-variant` | String | `default` | Style: `default`, `stepped`, `timeline`. |
| `data-number-type` | String | `decimal` | CSS list-style-type (e.g., `lower-alpha`). |
| `data-gap` | String | `0.5rem` | Spacing between items. |
| `data-start` | Number | `1` | Starting number. |

## 3. Examples

### Example 1: Stepped Guide
Perfect for "How-to" instructions.

```html
<ol data-wb="ol" data-variant="stepped">
  <li>Create Account</li>
  <li>Verify Email</li>
  <li>Setup Profile</li>
</ol>
```

### Example 2: Vertical Timeline
Visualizing a history or log.

```html
<ol data-wb="ol" data-variant="timeline">
  <li><strong>2020:</strong> Project Started</li>
  <li><strong>2021:</strong> First Release</li>
  <li><strong>2022:</strong> Major Update</li>
</ol>
```

## 4. Why It Works
For the `stepped` and `timeline` variants, the component suppresses the default list styling (`list-style-type: none`) and uses CSS counters and pseudo-elements (`::before`) to draw the custom markers. This allows for complete styling control over the numbers/bullets, which is not possible with standard CSS list styles.
