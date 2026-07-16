# x-toggle

Toggles a CSS class on a target element (or itself). See [src/wb-viewmodels/toggle.js](../../src/wb-viewmodels/toggle.js).

- **Type:** Attribute
- **Usage:** `[x-toggle]`

## Description
Distinct from the `switch`/`wb-switch` form component under Form Controls — `x-toggle` toggles an arbitrary CSS class on any element, not a form value. Triggers on **mousedown** (not `click`), for immediate visual feedback before the click completes; also responds to Enter/Space when focused.

## Attributes
| Attribute | Default | Description |
|---|---|---|
| `class` | `active` | Class name(s) to toggle (space-separated for multiple) |
| `target` | none | CSS selector for the element(s) to toggle the class on. If omitted, toggles on the trigger element itself |
| `toggle-self` | `true` | Whether the trigger element itself also gets the class toggled, even when `target` is set |

## Events
Dispatches `wb:toggle` (bubbles) with `detail: { active, targets, class }` on every toggle.

## Demo
See [Interactive & Utility demos](../../demos/site/interactive.html#x-toggle-toggle-a-class-on-a-target-element).

## Schema/Test
[toggle.schema.json](../../src/wb-models/toggle.schema.json)
