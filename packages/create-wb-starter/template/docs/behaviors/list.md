# List Behavior

The List behavior (`semantics/list.js`) is a utility behavior that populates a list (`<ul>` or `<ol>`) from a `items` attribute.

## Usage

<div x-demo>
<ul x-behavior="list" items="Item 1, Item 2, Item 3"></ul>
</div>

`list` has no `x-list` attribute of its own; it is applied through the generic
`x-behavior="list"` form. (This page used to show `is="x-list"`, a
customized-built-in spelling nothing in the runtime reads -- copying it
rendered an empty list.)

## Attributes

- `items`: A comma-separated list of items or a JSON array string.
- `dividers`: If present, adds dividers between list items.

## CSS Classes

- `.x-list`: Added to the list element.
- `.x-list__item`: Added to each list item.
- `.x-list--dividers`: Added if dividers are enabled.
