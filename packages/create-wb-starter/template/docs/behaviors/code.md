# Code

Behavior applied with x-code.

## Type — new capability

`x-code` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

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



### Declining it

A `<code>` **is** the code behavior, so it arrives with the element. To keep the semantic element and decline the behavior, add `x-ignore`:

```html
<code x-ignore>
  <!-- a plain code: no behavior is injected -->
</code>
```

Reaching for a different element instead is the wrong fix — it trades correct HTML for a workaround. See [escape hatches](../escape-hatches.md).
## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `language` | `string` | `this is the language` | Language for syntax highlighting (e.g. `html`, `js`). Unset renders plain, uncoloured text. |
| `variant` | `string` | `this is the variant` | Visual treatment of the code span or block — controls the surface it is drawn on. |
| `scrollable` | `string` | `this is the scrollable` | When `"true"`, scroll horizontally rather than wrapping long lines. |
| `size` | `string` | `this is the size` | Type scale for the code text: `xs`, `sm`, `md`, `lg`. Defaults to `md`. |
| `show-copy` | `boolean` | `false` | Show a copy-to-clipboard button. |
| `data-show-copy` | `boolean` | `false` | The `data-` spelling of `show-copy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `show-copy`. |
| `data-copy` | `boolean` | `false` | The `data-` spelling of `copy`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `copy`. |

## Events

- `wb:code:copy` — Fired by code().

## Live example

See `x-code` on the [Behaviors showcase](/?page=behaviors) — search for `x-code` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/code.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
