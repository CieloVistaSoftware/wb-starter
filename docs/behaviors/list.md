# List Behavior

The List behavior (`semantics/list.js`) is a utility behavior that populates a list (`<ul>` or `<ol>`) from a `items` attribute.

## Usage

<div x-demo>
<ul x-list items="Item 1, Item 2, Item 3"></ul>
</div>

`list` is applied with its own `x-list` attribute. (This page used to show the
generic `x-behavior="list"` form, now deprecated (#1642), and before that
`is="x-list"`, a customized-built-in spelling nothing in the runtime reads --
copying it rendered an empty list.)

## Attributes

- `items`: A comma-separated list of items or a JSON array string.
- `dividers`: If present, adds dividers between list items.

## CSS Classes

- `.x-list`: Added to the list element.
- `.x-list__item`: Added to each list item.
- `.x-list--dividers`: Added if dividers are enabled.
