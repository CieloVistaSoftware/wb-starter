# Progress

Progress bar with determinate and indeterminate states

## Type — decorates a semantic element

`x-progressbar` is the **progress behavior**. It attaches to `<progress>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<progress x-progressbar value="72" max="100" label="Uploading footage" show-value></progress>
```

### On a different element

Use `x-progressbar` when the host is not a `<progress>` and you want the same behavior:

```html
<div x-progressbar>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Current progress value (0-100) |
| `max` | `number` | `100` | Maximum value |
| `label` | `string` | — | Progress label text |
| `show-value` | `boolean` | `false` | Show percentage value |
| `variant` | `default` · `primary` · `success` · `warning` · `error` · `info` | `primary` | Color variant |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` | `md` | Bar height size |
| `animated` | `boolean` | `true` | Animate on load |
| `striped` | `boolean` | `false` | Show striped pattern |
| `indeterminate` | `boolean` | `false` | Indeterminate loading state |

## Methods

- `getValue()` — Gets the current progress value
- `setValue()` — Sets the progress value
- `increment()` — Increments the progress value
- `decrement()` — Decrements the progress value
- `reset()` — Resets progress to 0
- `complete()` — Sets progress to 100%
- `setIndeterminate()` — Sets indeterminate state

## Accessibility

- **role** — progressbar
- **ariaValueMin** — 0
- **ariaValueMax** — dynamic from max
- **ariaValueNow** — dynamic from value
- **ariaLabel** — dynamic from label or default

## Live example

See `x-progressbar` on the [Behaviors showcase](/?page=behaviors) — search for `x-progressbar` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/progress.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
