# Progress

A plain `<progress>` gets a styled bar with an optional `label` and percentage (`showValue`), colour `variant`s, stripes, and an `indeterminate` state for work of unknown length.

## Usage

<figure x-demo>
<progress value="72" max="100" label="Uploading footage" showValue></progress>
</figure>

No attribute needed on `<progress>`. Don't add `x-progress` to it (#746).

On another element, write `x-progress`:

<figure x-demo>
<div x-progress value="72" max="100" label="Uploading footage" showValue></div>
</figure>

`<progress x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Current progress value (0-100). A number between the tags wins over it ([content wins](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md#primary-value-content-wins), #417). |
| `max` | `number` | `100` | Maximum value |
| `label` | text | — | Progress label text |
| `showValue` | `boolean` | `false` | Show percentage value |
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

<sub>Schema: [`progress.schema.json`](../../src/wb-models/progress.schema.json)</sub>
