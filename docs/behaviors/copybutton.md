# Copybutton

Behavior applied with x-copybutton.

Apply `x-copybutton` to any element.

## Usage

```html
<button x-copybutton copy-target="#wb-ex-copy-source">Copy command</button>
<code id="wb-ex-copy-source">npm run test:compliance</code>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `x-copybutton` | `string` | — | Read by copybutton(). |
| `label` | `string` | `Copy` | Read by copybutton(). |
| `position` | `string` | `top-right` | Read by copybutton(). |
| `copy-feedback` | `string` | `Copied ✓` | Read by copybutton(). |
| `copy-duration` | `string` | `2000` | Read by copybutton(). |
| `copy-target` | `string` | — | Read by copybutton(). |

## Events

- `wb:copy:success` — Fired by copybutton().
- `wb:copy:error` — Fired by copybutton().

## Live example

See `x-copybutton` on the [Behaviors showcase](/?page=behaviors) — search for `x-copybutton` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/copybutton.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
