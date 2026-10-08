# Search

`x-search` turns a text `<input>` into a search box with an icon and a clear button, and fires `wb:search` once typing pauses for `debounce` milliseconds (or on every key with `instant`).

## Usage

<div x-demo>
<input type="text" x-search placeholder="Search with icon">
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | text | `Search...` | Placeholder text |
| `value` | text | — | Search value |
| `name` | text | — | Form field name |
| `debounce` | `number` | `300` | Debounce delay in milliseconds |
| `instant` | `boolean` | `false` | Search on every keystroke (no debounce) |
| `disabled` | `boolean` | `false` | Disabled state |
| `size` | `sm` · `md` · `lg` | `md` | Search input size |
| `variant` | `default` · `glass` · `minimal` | `default` | Visual variant |
| `icon` | emoji or icon name | `🔍` | Search icon (emoji or icon name) |
| `clearable` | `boolean` | `true` | Show clear button when has value |
| `loading` | `boolean` | `false` | Show loading state |

## Events

- `wb:search` — Fired when search is triggered (debounced or instant)
- `wb:search:clear` — Fired when search is cleared
- `input` — Fired on every input change
- `wb:search:focus` — Fired when the input receives focus
- `wb:search:blur` — Fired when the input loses focus

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

<sub>Schema: [`search.schema.json`](../../src/wb-models/search.schema.json)</sub>
