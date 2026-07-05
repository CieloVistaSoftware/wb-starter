# wb-column

A layout utility for columnar (vertical) alignment. Use it as a **tag** or as a
**class** — the tag is the idiomatic wb-starter way.

## As a tag — `<wb-column>`

The custom element stacks its children in a column with configurable spacing and
alignment. Rendered live below, with its source underneath:

<wb-demo>
<wb-column gap="1rem" align="stretch">
  <wb-button variant="primary">Item 1</wb-button>
  <wb-button variant="secondary">Item 2</wb-button>
  <wb-button variant="success">Item 3</wb-button>
</wb-column>
</wb-demo>

### Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `gap` | `1rem` | Space between items |
| `justify` | `flex-start` | Main-axis alignment (`flex-start`, `center`, `space-between`, …) |
| `align` | `stretch` | Cross-axis alignment (`stretch`, `center`, `flex-start`, …) |
| `wrap` | `nowrap` | Flex wrap (`nowrap`, `wrap`) |

## As a class — `.wb-column`

For plain markup, the same column layout is available as a utility class:

```html
<div class="wb-column">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

- [Source](../../src/wb-viewmodels/wb-column.js)
