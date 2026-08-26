# x-searchfield Behavior

A complete search input: icon, debounced/instant search events, clear
button, and loading state. See `searchField()` in
[src/wb-viewmodels/search.js](../../src/wb-viewmodels/search.js) — the
container-aware wrapper around the lower-level `search()`/`x-search`
behavior in the same file.

- **Type:** Modifier
- **Root CSS class:** `<div x-searchfield>`
- **Schema:** none dedicated (the plain `x-search` behavior it wraps has
  [search.schema.json](../../src/wb-models/search.schema.json); `searchfield`
  itself has no separate schema file)
- **Tag form:** `<div x-searchfield>` (see `elementMap` in
  [src/core/tag-map.js](../../src/core/tag-map.js)) — a **container** tag,
  not an input itself.

## Usage

On a plain container, `searchField()` finds (or creates) a child `<input>`
and wires the full search UI around it:

```html
<div x-searchfield placeholder="Search docs..." variant="glass"></div>
```

<div x-demo>
<div x-searchfield placeholder="Search docs..." variant="glass"></div>
</div>

The `<div x-searchfield>` custom tag is the same behavior, applied via the element
map instead of the attribute:

<div x-demo>
<div x-searchfield placeholder="Search..." size="lg"></div>
</div>

Applied directly to a real `<input>`, it delegates straight to the plain
`search()` behavior (no container is built):

<div x-demo>
<input type="text" x-searchfield placeholder="Search…" instant>
</div>

## Properties

| Attribute | Type | Default | Description |
|---|---|---|---|
| `placeholder` | string | `Search...` | Input placeholder. |
| `value` | string | `""` | Initial search value. |
| `name` | string | `""` | Form field `name`. |
| `debounce` | integer (ms) | `300` | Delay before a non-instant `wb:search` event fires after typing stops. |
| `instant` | boolean (presence) | `false` | Fire `wb:search` on every keystroke instead of debouncing. |
| `disabled` | boolean (presence) | `false` | Disables the input. |
| `size` | `sm` \| `md` \| `lg` | `md` | Applies `x-search--{size}` (omitted for `md`). |
| `variant` | `default` \| `glass` \| `minimal` | `default` | Applies `x-search--{variant}` (omitted for `default`). |
| `icon` | string | `🔍` | Icon shown before the input. |
| `clearable` | boolean | `true` | Set `clearable="false"` to hide the clear (✕) button. |
| `loading` | boolean (presence) | `false` | Shows a loading indicator (⏳) and `x-search--loading`. |

## CSS Classes

| Class | Applies to | When |
|---|---|---|
| `<div x-searchfield>` | host element (and the inner `<input>`) | always |
| `x-search--{size}` | host element | `size` ≠ `md` |
| `x-search--{variant}` | host element | `variant` ≠ `default` |
| `x-search--disabled` | host element | `disabled` present |
| `x-search--loading` | host element (and toggled via `setLoading()`) | `loading` present |
| `x-search__wrapper` | generated wrapper `<div>` around the input | always |
| `x-search__icon` | generated icon `<span>` | always |
| `x-search__input` | the `<input>` | always |
| `x-search__clear` | generated clear `<button>` | `clearable` |
| `x-search__loading` | generated loading `<span>` | `loading` present |

## Events

| Event | Bubbles | `detail` | Fired when |
|---|---|---|---|
| `wb:search` | yes | `{ query, instant }` | A search is triggered (debounced or instant) |
| `wb:search:clear` | yes | — | The clear button is clicked, or `.clear()` is called |
| `wb:search:focus` | yes | — | The input gains focus |
| `wb:search:blur` | yes | — | The input loses focus |
| `wb:search:navigate` | yes | `{ direction: 'up' \| 'down' }` | Arrow keys pressed in the input |
| `wb:search:select` | yes | `{ query }` | Enter pressed in the input |

## API

The container form exposes an imperative API on `element.wbSearch`:
`value` (get/set), `focus()`, `blur()`, `clear()`, `search()`, `setLoading(bool)`.

- [Schema (underlying `search` behavior)](../../src/wb-models/search.schema.json)
- [Test](../../tests/behaviors/x-search-select-effect.spec.ts)
- [Source](../../src/wb-viewmodels/search.js)
