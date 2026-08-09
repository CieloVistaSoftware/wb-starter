# `<details>` and `<summary>` Elements

The `<details>` element represents a native, disclosure widget — content that can be
toggled open/closed by the user. `<summary>` is its always-visible label. In
WB-Starter, every `<details>` on the page is automatically enhanced (no
attribute required) for consistent styling and toggle events.

## Semantic Meaning

- A disclosure widget: collapsed by default unless the `open` attribute is present
- `<summary>` is the visible, clickable label — required for a sensible default
- Built-in keyboard support (Enter/Space) and accessibility — no ARIA needed
- Works with JavaScript disabled; WB only adds styling and events on top

## WB Components Using `<details>`

### Auto-Enhanced (no attribute needed)

Every native `<details>` element is automatically picked up by the `details`
behavior (`src/wb-viewmodels/semantics/details.js`) — it adds themed styling,
a rotating disclosure icon, and a `wb:details:toggle` event. No `x-*`
attribute is required. (Non-`<details>` elements use `x-details` explicitly —
see below.)

<wb-demo>
<details>
  <summary>What is WB-Starter?</summary>
  <p>A schema-first MVVM site starter with zero build step — components are
  plain custom elements enhanced by small, composable behaviors.</p>
</details>
</wb-demo>

### Open by Default

The native `open` attribute controls initial state — WB reads it on init.

<wb-demo>
<details open>
  <summary>Already expanded</summary>
  <p>Content is visible immediately because the <code>open</code> attribute
  is present.</p>
</details>
</wb-demo>

### Non-`<details>` Elements (`x-details`)

Applying the `details` behavior to a non-`<details>` element wraps its
content in a real `<details>`/`<summary>` pair — the label comes from the
`summary` attribute (content is preserved, not discarded).

<wb-demo>
<div x-details summary="Click to expand">
  <p>This started as a plain &lt;div&gt; — the behavior replaced it with a
  real, native &lt;details&gt; element wrapping this same content.</p>
</div>
</wb-demo>

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `open` | Native boolean — controls initial expanded state |
| `<summary>` | Required for a meaningful accessible name; browsers announce it as the toggle control |
| Keyboard | Enter/Space toggle — handled natively, no JS needed |
| `toggle` event | Native DOM event; WB listens to it to animate the icon, doesn't replace it |

## Example: FAQ List

Multiple `<details>` elements are independent by default — opening one
doesn't close the others (unlike a true accordion, where only one panel is
open at a time).

<wb-demo>
<details>
  <summary>Do I need a build step?</summary>
  <p>No — everything runs directly in the browser via ES modules.</p>
</details>
<details>
  <summary>Can I use my own CSS framework?</summary>
  <p>Yes, though the theme system expects CSS custom properties for colors.</p>
</details>
</wb-demo>

## CSS Styling

```css
details.wb-details {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-primary);
}

summary.wb-details__summary {
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  cursor: pointer;
  font-weight: 500;
  list-style: none; /* Remove default disclosure triangle — WB draws its own */
}

.wb-details__icon {
  transition: transform 0.2s;
}

details[open] .wb-details__icon {
  transform: rotate(180deg);
}
```

## Best Practices

1. **Always include `<summary>`** — without it, browsers show a generic "Details" label
2. **Don't nest interactive controls in `<summary>`** — buttons/links inside it conflict with the native toggle click target
3. **Use `open` for above-the-fold content** — don't hide content search engines or first-time users need immediately
4. **Prefer real `<details>` markup** — the `x-behavior="details"` wrapper path exists for content you don't control (e.g. CMS output), not as the default choice
5. **For mutually-exclusive panels** — use a dedicated accordion pattern instead; independent `<details>` elements don't coordinate with each other
