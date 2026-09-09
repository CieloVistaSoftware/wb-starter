# Pre

Behavior applied with x-pre.

## Type — new capability

`x-pre` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<pre>npm run test:compliance
  7591 passed
     82 failed</pre>
```



### Declining it

A `<pre>` **is** the pre behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<pre x-ignore>
  <!-- a plain pre: no behavior is injected -->
</pre>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).
## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `language` | `string` | — | Language for syntax highlighting (e.g. `html`, `js`, `css`). Falls back to a `language` on the inner `<code>`, then to none — an unset language renders plain, uncoloured text. |
| `scrollable` | `string` | — | When `"true"`, the block scrolls horizontally instead of wrapping. Long lines keep their shape rather than reflowing. |
| `show-line-numbers` | `string` | — | Line numbers in a gutter beside the code. On unless set to `"false"`. |
| `max-height` | `string` | — | A CSS length capping the rendered height (e.g. `20rem`). Past it the block scrolls vertically instead of growing the page. |
| `wrap` | `boolean` | `false` | Wrap long lines instead of overflowing. Off unless set; `wrap="false"` is honoured as off. |
| `size` | `string` | — | Type scale for the code text: `xs`, `sm`, `md`, `lg`. Defaults to `md`. |
| `show-copy` | `boolean` | `false` | Show a copy-to-clipboard button in the corner of the block. |
| `data-show-copy` | `boolean` | `false` | The `data-` spelling of `show-copy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `show-copy`. |
| `data-copy` | `boolean` | `false` | The `data-` spelling of `copy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `copy`. |
| `data-wrap` | `boolean` | `false` | The `data-` spelling of `wrap`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `wrap`. |

## Live example

See `x-pre` on the [Behaviors showcase](/?page=behaviors) — search for `x-pre` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/pre.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
