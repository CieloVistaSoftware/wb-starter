# Button

A plain `<button>` gets the button styling: `variant` sets the colour, `size` the scale, `icon` adds a leading icon, and `loading` swaps the label for a spinner. Setting `href` makes it navigate like a link.

## Usage

<div x-demo>
<button variant="primary" icon="download">Download report</button>
<button variant="secondary" size="sm">Cancel</button>
<button variant="primary" loading>Saving</button>
</div>

No attribute needed on `<button>`. Don't add `x-button` to it (#746).

On another element, write `x-button`:

```html
<div x-button variant="primary" icon="download">Download report</div>
```

`<button x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Button text |
| `icon` | `star` · `check` · `close` · `warning` · `info` · `error` · `heart` · `search` · `edit` · `trash` · `plus` · `minus` · `home` · `settings` · `download` · `upload` · `arrow_right` · `arrow_left` · `copy` · `save` | `star` | Icon name from built-in library, or any emoji/text |
| `icon-position` | `start` · `end` | `start` | Icon position relative to label |
| `variant` | `primary` · `secondary` · `success` · `warning` · `error` · `ghost` · `outline` · `link` | `primary` | Visual style variant |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` | `md` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Loading state with spinner |
| `full-width` | `boolean` | `false` | Full width button |
| `icon-only` | `boolean` | `false` | Icon-only button (square) |
| `href` | `string` | `#` | Destination URL. Turns the control into a real link — required for variant="link" to mean anything. |
| `target` | `_self` · `_blank` | `_self` | Where to open href |

## Events

- `wb:button:click` — Fired when the button is activated (mouse click, Enter, or Space)

## Methods

- `enable()` — Enables the button
- `disable()` — Disables the button
- `startLoading()` — Shows loading state
- `stopLoading()` — Hides loading state
- `click()` — Programmatically clicks the button
- `focus()` — Focuses the button
- `blur()` — Removes focus from button

## Accessibility

- **role** — button
- **ariaDisabled** — dynamic when disabled

<sub>Schema: [`button.schema.json`](../../src/wb-models/button.schema.json)</sub>
