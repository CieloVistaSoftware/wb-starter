# x-autocomplete Behavior

Adds a filterable suggestion list under a text input as the user types. See
[src/wb-viewmodels/autocomplete.js](../../src/wb-viewmodels/autocomplete.js).

- **Type:** Modifier
- **Root CSS class:** `<div x-autocomplete>`
- **Schema:** [autocomplete.schema.json](../../src/wb-models/autocomplete.schema.json)

## Usage

Apply `x-autocomplete` directly to a real `<input>` — the behavior wraps it in a
`.wb-autocomplete` container and inserts the suggestion `<ul>` as a sibling (an
`<input>` is a void element and can't hold children, so nothing is ever
appended inside it).

```html
<input
  type="text"
  x-autocomplete
  items="Apple,Banana,Cherry,Date,Elderberry"
  placeholder="Start typing a fruit…">
```

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<input type="text" x-autocomplete items="Apple,Banana,Cherry,Date,Elderberry" placeholder="Start typing a fruit…">
</wb-demo>

`items` also accepts a JSON array string instead of CSV:

<wb-demo>
<input type="text" x-autocomplete items='["Red","Green","Blue","Yellow","Purple"]' placeholder="Pick a color…">
</wb-demo>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `items` | string (CSV or JSON array) | `[]` | Suggestion list. `"Apple,Banana"` or `'["Apple","Banana"]'`. Filtered case-insensitively against whatever the user has typed. |
| `src` / `href` | string (URL) | none | Optional remote endpoint returning a JSON array of strings. Fetched once and merged into `items`; while loading, the wrapper carries `wb-autocomplete--loading`. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `<div x-autocomplete>` | wrapper `<div>` | always |
| `wb-autocomplete__input` | the `<input>` | always |
| `wb-autocomplete__list` | the suggestion `<ul>` | always |
| `wb-autocomplete--loading` | wrapper `<div>` | while a `src`/`href` fetch is in flight |

## Events

| Event | Bubbles | `detail` | Fired when |
|---|---|---|---|
| `wb:autocomplete:select` | yes | `{ value }` | A suggestion is clicked |

- [Schema](../../src/wb-models/autocomplete.schema.json)
- [Source](../../src/wb-viewmodels/autocomplete.js)
