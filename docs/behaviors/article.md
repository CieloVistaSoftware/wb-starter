# Article Component

Semantic article component for blog posts, news, and documentation pages.

## Type — decorates a semantic element

`x-card` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article title="Trailhead access" subtitle="Updated this morning" elevated>
  The north gate is open. Parking fills by 9am on weekends — the overflow lot adds
  about ten minutes on foot.
</article>
```

### On a different element

Use `x-card` when the host is not a `<article>` and you want the same behavior:

```html
<div x-card>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Article title |
| `subtitle` | `string` | — | Article subtitle or deck |
| `author` | `string` | — | Author name |
| `date` | `string` | — | Publication date |
| `category` | `string` | — | Category or tag |
| `image` | `string` | — | Cover image URL |
| `image-alt` | `string` | — | Cover image alt text |
| `reading-time` | `string` | — | Estimated reading time |
| `featured` | `boolean` | `false` | Whether the article is featured |

## Live example

See `x-card` on the [Behaviors showcase](/?page=behaviors) — search for `x-card` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/article.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
