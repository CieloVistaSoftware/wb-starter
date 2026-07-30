# x-tooltip Behavior

Shows a tooltip on hover/focus for any element.

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<button x-tooltip="Tooltip text">Hover me</button>
</wb-demo>

- **Type:** Modifier
- **Usage:**
  ```html
  <button x-tooltip="Tooltip text">Hover me</button>
  ```
- **Note:** Use for contextual, hover-based help.

- [Demo](../../demos/site/feedback.html#x-tooltip-on-a-real-trigger-element)
- [Schema](../../src/wb-models/tooltip.schema.json)
- [Test](../../tests/behaviors/tooltip-demo.spec.ts)
