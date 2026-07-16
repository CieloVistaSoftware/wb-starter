# x-label Behavior

Generates a real, associated `<label>` from an `x-label="text"` attribute on a
form control — no separate `<label for="...">` to write by hand.

- **Type:** Modifier
- **Usage:**
  ```html
  <input
    x-label="Label for input:"
    id="input1"
    type="text">
  ```
  The value is the label text. The behavior creates the `<label>`, wires up
  `for`/`id` (assigning an id to the control if it doesn't have one), and
  inserts it right before the control (so it renders to its left). Add `required` / `optional` for the
  matching `wb-label--required` / `wb-label--optional` style:
  ```html
  <input
    x-label="Email"
    required>
  ```
- **`label-position="right"`** — puts the label after the control instead
  (to its right). For RTL layouts (Hebrew, Arabic) where the label
  conventionally sits on the right:
  ```html
  <input
    x-label="שם מלא"
    label-position="right">
  ```
- **Legacy form:** a bare `x-label` (no value) on an actual `<label>` element
  just adds the `wb-label` styling classes to that label directly — for when
  you already have your own `<label for="...">` markup:
  ```html
  <label x-label required for="input1">Label</label>
  ```
- [Demo](../../demos/site/forms.html#x-label-including-rtl-layouts)
- [Schema](../../src/wb-models/label.schema.json)
- [Test](../../tests/behaviors/label.spec.ts)
