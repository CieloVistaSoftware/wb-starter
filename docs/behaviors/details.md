# Details

Native HTML5 details disclosure widget with optional animation

## Type — decorates a semantic element

`x-details` is the **details behavior**. It attaches to `<details>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<!-- Plain semantic HTML. The behavior is injected automatically -->
<!-- because the element itself implies it. No attribute needed. -->
<details summary="Details sample of Trail conditions" animated>
  <img src="images/placeholder.svg" alt="Trail through autumn woodland" width="480" height="200">
  <p>Open to show the summary text is authored via the <code>summary</code>
     attribute — it reads "Details" only when none is set.</p>
</details>
```

### On a different element

Use `x-details` when the host is not a `<details>` and you want the same behavior:

```html
<div x-details>
  …
</div>
```

> Do not write `<details x-details>`. The element already injects it, and the redundant attribute can suppress the behavior (#746).

### Declining it

A `<details>` **is** the details behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<details x-ignore>
  <!-- a plain details: no behavior is injected -->
</details>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).


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
