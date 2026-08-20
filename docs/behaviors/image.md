# Image

Behavior applied with x-image.

Apply `x-image` to any element.

## Usage

```html
<img x-image src="https://picsum.photos/200/150?r=enh1" alt="Lazy loaded" lazy class="demo-image">
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | — | Read by image(). |
| `fallback` | `string` | — | Read by image(). |
| `aspect-ratio` | `string` | — | Read by image(). |
| `lazy` | `boolean` | `false` | Read by image(). Bare attribute. |
| `data-lazy` | `boolean` | `false` | Read by image(). Bare attribute. |
| `zoomable` | `boolean` | `false` | Read by image(). Bare attribute. |
| `data-zoomable` | `boolean` | `false` | Read by image(). Bare attribute. |

## Live example

See `x-image` on the [Behaviors showcase](/?page=behaviors) — search for `x-image` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/image.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
