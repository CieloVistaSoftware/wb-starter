# wb-demo

A wrapper for demoing components or behaviors: it renders the **live control** and
shows its **source** underneath. Drop it straight into a Markdown doc or an HTML
page — no build step.

## Live example

<wb-demo>
  <wb-button variant="primary">Button</wb-button>
</wb-demo>

The block above is a real `<wb-demo>` embedded in this Markdown — the button you see
is live, and its source is rendered beneath it.

## Syntax

```html
<wb-demo>
  <wb-button variant="primary">Button</wb-button>
</wb-demo>
```

- [Source](../../src/wb-viewmodels/wb-demo.js)
