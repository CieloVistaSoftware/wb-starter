# x-label Behavior

Generates a real, associated `<label>` from an `x-label="text"` attribute on a
form control — no separate `<label for="...">` to write by hand.

<div x-demo>
<input x-label="Full name" id="label-demo-name" type="text">
<input x-label="Email" type="email" required>
<input x-label="Nickname" type="text" optional>
</div>

The value is the label text. The behavior creates the `<label>`, wires up
`for`/`id` (assigning an id to the control if it doesn't have one), and
inserts it right before the control, so it renders to its left. `required` /
`optional` on the control add the matching `x-label--required` /
`x-label--optional` style.

## Label on the right

`label-position="right"` puts the label after the control instead. Use it for
RTL layouts (Hebrew, Arabic), where the label conventionally sits on the right:

<div x-demo>
<input x-label="שם מלא" label-position="right" type="text">
</div>

## On your own label

When you already write your own `<label for="...">`, it gets the same label
styling on its own — no attribute needed. Writing `x-label` on a `<label>`
would only repeat what the element already is:

<div x-demo>
<label required for="label-demo-own">Project name</label>
<input id="label-demo-own" type="text">
</div>

- [Demo](../../demos/site/forms.html#x-label-including-rtl-layouts)
- [Schema](../../src/wb-models/label.schema.json)
- [Test](../../tests/behaviors/label.spec.ts)
