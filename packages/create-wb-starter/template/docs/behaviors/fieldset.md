# x-fieldset Behavior

Marks a `<fieldset>` as a group of related form controls by adding the
`x-fieldset` class. That is all it does: a fieldset groups controls under its
`<legend>`, and has no disclosure (open/closed) semantics. See
[src/wb-viewmodels/fieldset.js](../../src/wb-viewmodels/fieldset.js).

- **Root CSS class:** `x-fieldset`
- **Schema:** [fieldset.schema.json](../../src/wb-models/fieldset.schema.json)
- **Auto-inject:** `<fieldset>` is in the tag map (`src/core/tag-map.js`), so a
  bare `<fieldset>` gets the `x-fieldset` class without any attribute.

## Usage

<div x-demo>
<fieldset>
  <legend>Shipping details</legend>
  <input type="text" placeholder="Address line 1">
  <input type="text" placeholder="City">
</fieldset>
</div>

The `<legend>` is the group's accessible name, so screen readers announce
"Shipping details" when focus enters either input.

If a group genuinely needs to open and close, wrap it in the platform's
disclosure element instead of asking the fieldset to do it:

<div x-demo>
<details>
  <summary>Advanced options</summary>
  <fieldset>
    <legend>Coupon</legend>
    <input type="text" placeholder="Coupon code">
  </fieldset>
</details>
</div>

## Properties

None. The former open/close flags were removed in #999: they were implemented
twice, each overwriting the other's `legend.onclick`, and never visibly did
anything.

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `x-fieldset` | the `<fieldset>` | always |

## Events

None.

- [Schema](../../src/wb-models/fieldset.schema.json)
- [Demo](../../demos/site/forms.html#x-fieldset-grouping)
- [Source](../../src/wb-viewmodels/fieldset.js)
