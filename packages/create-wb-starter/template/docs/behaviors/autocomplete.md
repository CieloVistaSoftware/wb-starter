# x-autocomplete Behavior

Adds a filterable suggestion list under a text input as the user types. See
[src/wb-viewmodels/autocomplete.js](../../src/wb-viewmodels/autocomplete.js).

- **Type:** Modifier
- **Root CSS class:** `x-autocomplete`
- **Schema:** [autocomplete.schema.json](../../src/wb-models/autocomplete.schema.json)

## Usage

Apply `x-autocomplete` directly to a real `<input>` — the behavior wraps it in a
`.x-autocomplete` container and inserts the suggestion `<ul>` as a sibling (an
`<input>` is a void element and can't hold children, so nothing is ever
appended inside it).

```html
<input
  type="text"
  x-autocomplete
  items="Apple,Banana,Cherry,Date,Elderberry"
  placeholder="Start typing a fruit…">
```

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<input type="text" x-autocomplete items="Apple,Banana,Cherry,Date,Elderberry" placeholder="Start typing a fruit…">
</div>

`items` also accepts a JSON array string instead of CSV:

<div x-demo>
<input type="text" x-autocomplete items='["Red","Green","Blue","Yellow","Purple"]' placeholder="Pick a color…">
</div>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `items` | string (CSV or JSON array) | `[]` | Suggestion list. `"Apple,Banana"` or `'["Apple","Banana"]'`. Filtered case-insensitively against whatever the user has typed. |
| `src` / `href` | string (URL) | none | Optional remote endpoint returning a JSON array of strings. Fetched once and merged into `items`; while loading, the wrapper carries `x-autocomplete--loading`. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `x-autocomplete` | wrapper `<div>` | always |
| `x-autocomplete__input` | the `<input>` | always |
| `x-autocomplete__list` | the suggestion `<ul>` | always |
| `x-autocomplete--loading` | wrapper `<div>` | while a `src`/`href` fetch is in flight |

## Events

| Event | Bubbles | `detail` | Fired when |
|---|---|---|---|
| `wb:autocomplete:select` | yes | `{ value }` | A suggestion is clicked |

- [Schema](../../src/wb-models/autocomplete.schema.json)
- [Source](../../src/wb-viewmodels/autocomplete.js)
