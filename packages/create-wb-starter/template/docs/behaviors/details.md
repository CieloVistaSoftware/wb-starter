# Details

Native HTML5 details disclosure widget with optional animation

Applies to `<details>`, and to any element carrying `x-details`.

## Usage

```html
<details summary="Trail conditions" animated>
  <img src="https://picsum.photos/seed/details/480/200" alt="Trail through autumn woodland" width="480" height="200">
  <p>Open to show the summary text is authored via the <code>summary</code>
     attribute — it reads "Details" only when none is set.</p>
</details>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `summary` | `string` | — | Clickable summary text |
| `open` | `boolean` | `false` | Initially expanded |
| `name` | `string` | — | Accordion group name (native exclusive behavior) |
| `animated` | `boolean` | `true` | Animate open/close |
| `variant` | `default` · `bordered` · `filled` | `default` |  |

## Events

- `toggle` — Native toggle event
- `wb:details:toggle` — Custom toggle event

## Methods

- `open()` — Opens the details
- `close()` — Closes the details
- `toggle()` — Toggles open state
- `isOpen()` — Returns open state

## Live example

See `x-details` on the [Behaviors showcase](/?page=behaviors) — search for `x-details` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/details.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
