# Article Behavior

Semantic article behavior for blog posts, news, and documentation pages.

Applies to `<article>`, and to any element carrying `x-article`.

## Usage

```html
<article x-article>
  …
</article>
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

See `x-article` on the [Behaviors showcase](/?page=behaviors) — search for `x-article` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/article.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
