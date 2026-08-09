# UL (Unordered List) Component Design & User Guide

## 1. Design Philosophy

The `ul` component enhances the unordered list to support common UI patterns like checklists and icon lists. It allows developers to move beyond simple bullet points without writing custom CSS for every list.

### Key Features
- **Checklist Variant**: Visual support for checked/unchecked items.
- **Icon List**: Use custom icons/emojis as bullets.
- **Gap Control**: Configurable spacing between items.

## 2. User Guide

### Basic Usage
Add `x-ul` to a `<ul>` element.

```html
<ul x-ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | String | `default` | Style: `default`, `checklist`, `icon-list`, `none`. |
| `marker` | String | `disc` | CSS list-style-type (e.g., `square`). |
| `gap` | String | `0.5rem` | Spacing between items. |

## 3. Examples

### Example 1: Feature Checklist
A list of features with checkmarks.

```html
<ul
  x-ul
  variant="checklist">
  <li checked>Fast Performance</li>
  <li checked>Secure</li>
  <li>Offline Mode</li>
</ul>
```

### Example 2: Custom Icons
Using emojis as bullets.

```html
<ul
  x-ul
  variant="icon-list">
  <li icon="🚀">Launch</li>
  <li icon="📈">Grow</li>
  <li icon="💰">Profit</li>
</ul>
```

## 4. Why It Works
For variants like `checklist` and `icon-list`, the component removes the default list styling and uses Flexbox to align the custom marker (injected as a `span`) with the text content. This ensures that multi-line text aligns correctly with the bullet, which is often a pain point with standard CSS `list-style-image`.
