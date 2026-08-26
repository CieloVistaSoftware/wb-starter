# Code

Behavior applied with x-code.

Apply `x-code` to any element.

## Usage

```html
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
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `language` | `string` | — | Read by code(). |
| `variant` | `string` | — | Read by code(). |
| `scrollable` | `string` | — | Read by code(). |
| `size` | `string` | — | Read by code(). |
| `show-copy` | `boolean` | `false` | Read by code(). Bare attribute. |
| `data-show-copy` | `boolean` | `false` | Read by code(). Bare attribute. |
| `data-copy` | `boolean` | `false` | Read by code(). Bare attribute. |

## Events

- `wb:code:copy` — Fired by code().

## Live example

See `x-code` on the [Behaviors showcase](/?page=behaviors) — search for `x-code` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/code.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
