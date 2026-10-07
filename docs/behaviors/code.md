# Code

A `<code>` element gets syntax highlighting for its `language` and, with `showCopy`, a copy-to-clipboard button; `variant` and `size` set the surface it is drawn on and its type scale.

## Usage

<div x-demo>
<code language="javascript">
// Debounce — delay a call until the caller stops firing.
export function debounce(fn, wait = 200) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() =&gt; fn.apply(this, args), wait);
  };
}
// Throttle — run at most once per interval.
export function throttle(fn, interval = 100) {
  let last = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - last &lt; interval) return;
    last = now;
    return fn.apply(this, args);
  };
}
const onResize = debounce(() =&gt; {
  const { innerWidth: w, innerHeight: h } = window;
  console.log(`viewport ${w}x${h}`);
}, 250);
window.addEventListener('resize', onResize);
</code>
</div>

No attribute needed on `<code>`. Don't add `x-code` to it (#746).

`<code x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `language` | language name, e.g. `html`, `js` | — | Language for syntax highlighting (e.g. `html`, `js`). Unset renders plain, uncoloured text. |
| `variant` | `inline` · `block` | — | Visual treatment of the code span or block — controls the surface it is drawn on. |
| `scrollable` | `true` to turn on | — | When `"true"`, scroll horizontally rather than wrapping long lines. |
| `size` | `xs` · `sm` · `md` · `lg` | — | Type scale for the code text: `xs`, `sm`, `md`, `lg`. Defaults to `md`. |
| `showCopy` | `boolean` | `false` | Show a copy-to-clipboard button. |
| `data-show-copy` | `boolean` | `false` | The `data-` spelling of `showCopy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `showCopy`. |
| `data-copy` | `boolean` | `false` | The `data-` spelling of `copy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `copy`. |

## Events

- `wb:code:copy` — Fired by code().

<sub>Schema: [`code.schema.json`](../../src/wb-models/code.schema.json)</sub>
