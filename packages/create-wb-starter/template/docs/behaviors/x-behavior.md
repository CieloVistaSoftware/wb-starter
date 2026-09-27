# x-behavior

`x-behavior="name"` applies the behavior named in its value, and takes several separated by spaces: `<span x-behavior="chip">` does what `<span x-chip>` does. The runtime uses it for elements it creates itself, such as the `<pre x-behavior="pre">` blocks in code panels. When writing markup by hand, prefer the direct attribute (`x-chip`).

Do not name a behavior the element already gets from its tag: `<textarea x-behavior="textarea">` is redundant, the same way writing `x-button` on a `<button>` is (#967).

<div x-demo>
<span x-behavior="badge" label="Beta" variant="warning"></span>
</div>

- **Implementation:** [src/wb-viewmodels/behavior.js](../../src/wb-viewmodels/behavior.js) adds the `x-behavior` class; the dispatch by value is in `src/core/wb.js`.
- **Demo:** [autoinject.html](../../demos/autoinject.html).
