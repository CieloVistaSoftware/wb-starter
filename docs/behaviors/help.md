# x-help Behavior

Displays always-visible help text for form fields or UI elements.

- **Type:** Modifier
- **Usage:**
  ```html
  <span x-help>Enter your email address here.</span>
  ```
- **Note:** x-help is functionally the same as a span except for styling and accessibility (adds role="note" and a help class). For hover-based help, use x-tooltip.

- [Demo](../../demos/help-demo.html)
- [Schema](../../src/wb-models/help.schema.json)
- [Test](../../tests/behaviors/help.spec.ts)
