# Doc viewer: semantic-only fences

Fixture for tests/regression/docs-illustrations-never-render-live.spec.ts (#1169).
docs/ authors its examples as `x-demo` blocks (#307), so the doc viewer's
fence-to-demo path is exercised here instead.

A plain semantic tag, no `x-*` attribute:

```html
<article title="Plain">A card from the element alone.</article>
```

A semantic tag that also carries a behavior attribute:

```html
<article title="Elevated" x-ripple>A card with a ripple.</article>
```
