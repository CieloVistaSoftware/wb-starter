# x-masked Behavior

Formats input as the user types against a mask pattern (phone numbers, SSNs,
license plates, etc). See [src/wb-viewmodels/masked.js](../../src/wb-viewmodels/masked.js).

- **Type:** Modifier
- **Root CSS class:** `wb-masked`
- **Schema:** [masked.schema.json](../../src/wb-models/masked.schema.json)

## Usage

`9` in the mask means "digit", `A` means "letter"; everything else is a
literal separator inserted automatically as the user fills in slots:

```html
<input type="text" x-masked mask="(999) 999-9999" placeholder="(000) 000-0000">
```

<wb-demo>
<input type="text" x-masked mask="(999) 999-9999" placeholder="(000) 000-0000">
</wb-demo>

<wb-demo>
<input type="text" x-masked mask="AA-9999" mask-placeholder="#">
</wb-demo>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `mask` | string | `""` (behavior is a no-op without one) | Mask pattern. `9` = digit slot, `A` = letter slot (auto-uppercased), any other character is a literal. |
| `mask-placeholder` | string | `_` | Character used to auto-fill an empty `placeholder` derived from the mask (only applied when the element has no `placeholder` of its own). |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `wb-masked` | the `<input>` | always |

## Events

None — the behavior listens to the field's native `input`/`paste` events; it doesn't dispatch any of its own.

- [Schema](../../src/wb-models/masked.schema.json)
- [Source](../../src/wb-viewmodels/masked.js)
