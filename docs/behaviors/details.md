# Details

A plain `<details>` gets the styled disclosure: the `summary` attribute supplies the heading, `animated` slides the content open and closed, and giving several the same `name` makes them an accordion where only one stays open.

## Usage

<div x-demo>
<details summary="Trail conditions" animated>
  <p>Mud on the north ridge after Tuesday's rain; the lower loop is dry.</p>
</details>
</div>

No attribute needed on `<details>`. Don't add `x-details` to it (#746).

On another element, write `x-details`:

<div x-demo>
<div x-details summary="Trail conditions" animated>
  <p>Mud on the north ridge after Tuesday's rain; the lower loop is dry.</p>
</div>
</div>

`<details x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `summary` | text | — | Clickable summary text |
| `open` | `boolean` | `false` | Initially expanded |
| `name` | group name | — | Accordion group name (native exclusive behavior) |
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

<sub>Schema: [`details.schema.json`](../../src/wb-models/details.schema.json)</sub>
