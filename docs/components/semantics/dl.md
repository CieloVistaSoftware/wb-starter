# DL (Description List) Component Design & User Guide

## 1. Design Philosophy

The `dl` component enhances the standard `<dl>` (Description List) element, which is often underused due to its default styling limitations. This component transforms it into a powerful layout tool for key-value pairs, supporting grids, stripes, and borders.

### Key Features
- **Layout Variants**: Switch between vertical (stacked) and horizontal (grid) layouts.
- **Visual Polish**: Optional borders and striped backgrounds for readability.
- **Gap Control**: Configurable spacing between items.
- **Semantic Styling**: Distinct styles for `<dt>` (terms) and `<dd>` (definitions).

## 2. User Guide

### Basic Usage
Add `data-wb="dl"` to a `<dl>` element.

```html
<dl data-wb="dl">
  <dt>Name</dt>
  <dd>John Doe</dd>
</dl>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-variant` | String | `vertical` | Layout: `vertical`, `horizontal`. |
| `data-gap` | String | `0.5rem` | Spacing between items. |
| `data-bordered` | Boolean | `false` | Add a border around the list. |
| `data-striped` | Boolean | `false` | Add background stripes (horizontal mode only). |

## 3. Examples

### Example 1: Horizontal Grid
Perfect for metadata or specs.

```html
<dl data-wb="dl" data-variant="horizontal" data-striped="true">
  <dt>Version</dt> <dd>1.0.0</dd>
  <dt>Author</dt> <dd>Web Behaviors (WB) Team</dd>
  <dt>License</dt> <dd>MIT</dd>
</dl>
```

### Example 2: Bordered Vertical List
Good for sidebars or summaries.

```html
<dl data-wb="dl" data-bordered="true">
  <dt>Status</dt> <dd>Active</dd>
  <dt>Uptime</dt> <dd>99.9%</dd>
</dl>
```

## 4. Why It Works
For the `horizontal` variant, the component applies `display: grid` with a 2-column template (`auto 1fr`). This ensures terms align perfectly regardless of their length. The `striped` option uses JavaScript to iterate through the pairs and apply background colors to every other row.
