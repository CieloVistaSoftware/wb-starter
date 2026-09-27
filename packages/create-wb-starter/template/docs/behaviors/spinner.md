# Spinner

`x-spinner` draws an animated loading ring in the element, sized by `size` and coloured by `variant`, with `label` as its accessible name. Show it while content loads and remove it when done.

## Usage

<div x-demo>
<div x-spinner size="md" variant="primary" label="Loading results…"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` | `md` |  |
| `variant` | `default` · `primary` · `success` · `warning` · `error` | `primary` |  |
| `speed` | `slow` · `medium` · `fast` | `medium` |  |
| `label` | `string` | `Loading` | Accessible label |

## Methods

- `show()` — Shows the spinner
- `hide()` — Hides the spinner

## Accessibility

- **role** — status
- **ariaLabel** — dynamic from label

<sub>Schema: [`spinner.schema.json`](../../src/wb-models/spinner.schema.json)</sub>
