# List Component

The List component (`semantics/list.js`) is a utility behavior that populates a list (`<ul>` or `<ol>`) from a `items` attribute.

## Usage

```html
<ul
  is="x-list"
  items="Item 1, Item 2, Item 3">
</ul>
```

## Attributes

- `items`: A comma-separated list of items or a JSON array string.
- `dividers`: If present, adds dividers between list items.

## CSS Classes

- `.x-list`: Added to the list element.
- `.x-list__item`: Added to each list item.
- `.x-list--dividers`: Added if dividers are enabled.
