
# x-behavior (deprecated)

> **Deprecated (#1642).** John, 2026-10-06: `x-behavior="cardimage"` — "this format is deprecated in entire project". Write the behavior's own attribute instead.

| Instead of | Write |
|---|---|
| `<article x-behavior="cardimage">` | `<article x-cardimage>` |
| `<span x-behavior="chip">` | `<span x-chip>` |
| `<button x-behavior="tooltip ripple">` | `<button x-tooltip x-ripple>` |
| `<pre x-behavior="pre">`, `<textarea x-behavior="textarea">`, `<table x-behavior="table">` | `<pre>`, `<textarea>`, `<table>`: the tag already is the behavior, so it needs no attribute (#967) |

Old markup still works: the runtime applies the behaviors it names, and prints one console warning per spelling with the markup to write instead. Nothing in this project writes it any more, and `tests/compliance/no-x-behavior-attribute.spec.ts` fails if a page, demo or src file starts to again.

<div x-demo>
<span x-badge label="Beta" variant="warning"></span>
</div>

- **Implementation:** the legacy dispatch is in `src/core/wb.js` and `src/core/wb-lazy.js`; the warning is `src/core/x-behavior-deprecation.js`.
- **Demo:** [autoinject.html](../../demos/autoinject.html) shows which tags need no attribute at all.
