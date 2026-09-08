# Form Behavior

Schema for x-form behavior (form enhancement)

## Type — new capability

`x-form` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<form validate ajax action="/api/demo-form" successMessage="Sent — check the events panel below.">
  <label>Email <input type="email" name="email" required placeholder="you@example.com"></label>
  <label>Message <textarea name="message" rows="3" required></textarea></label>
  <button type="submit">
  type: submit
</button>
</form>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `ajax` | `boolean` | `false` | Enable AJAX form submission |
| `validate` | `boolean` | `false` | Enable validation on submit |

## Live example

See `x-form` on the [Behaviors showcase](/?page=behaviors) — search for `x-form` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/form.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
