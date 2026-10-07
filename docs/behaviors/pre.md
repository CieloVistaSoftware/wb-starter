# Pre

A plain `<pre>` gets a code block: syntax highlighting for `language`, line numbers, an optional copy button (`showCopy`), wrapping or horizontal scrolling, and a `maxHeight` after which it scrolls.

## Usage

<div x-demo>
<pre>npm run test:compliance
  7591 passed
     82 failed</pre>
</div>

No attribute needed on `<pre>`. Don't add `x-pre` to it (#746).

`<pre x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `language` | language name, e.g. `html`, `js` | — | Language for syntax highlighting (e.g. `html`, `js`, `css`). Falls back to a `language` on the inner `<code>`, then to none — an unset language renders plain, uncoloured text. |
| `scrollable` | `true` to turn on | — | When `"true"`, the block scrolls horizontally instead of wrapping. Long lines keep their shape rather than reflowing. |
| `showLineNumbers` | on unless `false` | — | Line numbers in a gutter beside the code. On unless set to `"false"`. |
| `maxHeight` | CSS length | — | A CSS length capping the rendered height (e.g. `20rem`). Past it the block scrolls vertically instead of growing the page. |
| `wrap` | `boolean` | `false` | Wrap long lines instead of overflowing. Off unless set; `wrap="false"` is honoured as off. |
| `size` | `xs` · `sm` · `md` · `lg` | — | Type scale for the code text: `xs`, `sm`, `md`, `lg`. Defaults to `md`. |
| `showCopy` | `boolean` | `false` | Show a copy-to-clipboard button in the corner of the block. |
| `data-show-copy` | `boolean` | `false` | The `data-` spelling of `showCopy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `showCopy`. |
| `data-copy` | `boolean` | `false` | The `data-` spelling of `copy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `copy`. |
| `data-wrap` | `boolean` | `false` | The `data-` spelling of `wrap`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `wrap`. |

<sub>Schema: [`pre.schema.json`](../../src/wb-models/pre.schema.json)</sub>
