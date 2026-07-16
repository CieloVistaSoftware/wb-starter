# x-resizable

Makes an element resizable by dragging its edge/corner. See [src/wb-viewmodels/resizable.js](../../src/wb-viewmodels/resizable.js).

- **Type:** Attribute
- **Usage:** `[x-resizable]`

## Description
Adds a drag handle to the element's border (default: bottom-right corner) and lets the user resize it by dragging. The element must have visible width/height (or content) to have something to grab — an empty element with no default size has nothing to drag.

## Attributes
| Attribute | Default | Description |
|---|---|---|
| `directions` | `se` | Which edges/corners get a resize handle: `n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`, or `all` |
| `min-width` | `50` | Minimum width in px |
| `min-height` | `50` | Minimum height in px |
| `max-width` | none | Maximum width in px |
| `max-height` | none | Maximum height in px |
| `aspect-ratio` | off | Lock width/height ratio while resizing |

## Demo
See [Interactive & Utility demos](../../demos/site/interactive.html#resizable-resizable).

## Schema/Test
[resizable.schema.json](../../src/wb-models/resizable.schema.json)
