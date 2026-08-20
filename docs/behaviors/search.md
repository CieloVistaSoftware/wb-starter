# Search

Search input component with icon and debounced search events

Applies to `<div>`, and to any element carrying `x-search`.

## Usage

```html
<input type="text" x-search placeholder="Search with icon">
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | `Search...` | Placeholder text |
| `value` | `string` | — | Search value |
| `name` | `string` | — | Form field name |
| `debounce` | `number` | `300` | Debounce delay in milliseconds |
| `instant` | `boolean` | `false` | Search on every keystroke (no debounce) |
| `disabled` | `boolean` | `false` | Disabled state |
| `size` | `sm` · `md` · `lg` | `md` | Search input size |
| `variant` | `default` · `glass` · `minimal` | `default` | Visual variant |
| `icon` | `string` | `🔍` | Search icon (emoji or icon name) |
| `clearable` | `boolean` | `true` | Show clear button when has value |
| `loading` | `boolean` | `false` | Show loading state |

## Events

- `wb:search` — Fired when search is triggered (debounced or instant)
- `wb:search:clear` — Fired when search is cleared
- `input` — Fired on every input change
- `focus` — Fired when input receives focus
- `blur` — Fired when input loses focus

## Methods

- `getValue()` — Gets the current search value
- `setValue()` — Sets the search value
- `clear()` — Clears the search value
- `focus()` — Focuses the search input
- `blur()` — Removes focus from search input
- `search()` — Triggers a search with current value
- `setLoading()` — Sets loading state

## Accessibility

- **role** — searchbox
- **ariaLabel** — Search input
- **ariaDescribedBy** — search results if applicable

## Live example

See `x-search` on the [Behaviors showcase](/?page=behaviors) — search for `x-search` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/search.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
