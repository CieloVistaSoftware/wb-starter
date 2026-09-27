# Mark

A plain `<mark>` highlights text; `variant` picks a success, warning, danger or info colour, and `color` sets any colour with the text colour chosen to stay readable.

## Usage

<div x-demo>
<p>Search matched <mark>light DOM</mark> in 12 documents; <mark variant="danger">3</mark> are out of date.</p>
</div>

No attribute needed on `<mark>`. Don't add `x-mark` to it (#746).

`<mark x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `string` | — | Semantic highlight colour: `success`, `warning`, `danger` or `info`. **Ignored when `color` is set** — an explicit colour wins. |
| `color` | `string` | — | Any CSS colour, used as the highlight background. The text colour is computed from its luminance so the mark stays readable, and setting this overrides `variant`. |

<sub>Schema: [`mark.schema.json`](../../src/wb-models/mark.schema.json)</sub>
