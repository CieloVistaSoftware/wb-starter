# Truncate

Behavior applied with x-truncate.

Apply `x-truncate` to any element.

## Usage

```html
<p x-truncate lines="2" class="truncate-box">
        This is a very long text that will be truncated after two lines. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `lines` | `string` | `1` | Read by truncate(). |
| `data-expandable` | `boolean` | `false` | Read by truncate(). Bare attribute. |
| `expandable` | `boolean` | `false` | Read by truncate(). Bare attribute. |

## Live example

See `x-truncate` on the [Behaviors showcase](/?page=behaviors) — search for `x-truncate` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/truncate.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
