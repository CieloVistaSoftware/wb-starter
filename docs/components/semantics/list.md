# List Component

The List component (`semantics/list.js`) is a utility behavior that populates a list (`<ul>` or `<ol>`) from a `data-items` attribute.

## Usage

```html
<ul is="wb-list" data-items="Item 1, Item 2, Item 3"></ul>
```

## Attributes

- `data-items`: A comma-separated list of items or a JSON array string.
- `data-dividers`: If present, adds dividers between list items.

## CSS Classes

- `.wb-list`: Added to the list element.
- `.wb-list__item`: Added to each list item.
- `.wb-list--dividers`: Added if dividers are enabled.
