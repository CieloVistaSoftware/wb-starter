# Avatar

User avatar with image, initials fallback, and status indicator

## Type — new capability

`x-avatar` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-avatar src="https://picsum.photos/seed/ada/64/64" alt="Ada Lovelace" name="Ada Lovelace" size="lg"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | — | Image source URL |
| `alt` | `string` | — | Alt text for image |
| `initials` | `string` | — | Fallback initials (2 chars) |
| `name` | `string` | — | Full name (generates initials if not provided) |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` · `2xl` | `md` |  |
| `shape` | `circle` · `square` · `rounded` | `circle` |  |
| `status` | `` · `online` · `offline` · `busy` · `away` | — | Status indicator (empty = no indicator) |
| `bordered` | `boolean` | `false` | Show border |

## Methods

- `setImage()` — Sets the image source
- `setInitials()` — Sets initials
- `setStatus()` — Sets status
- `clearStatus()` — Removes status indicator

## Accessibility

- **role** — img
- **ariaLabel** — dynamic from name or alt

## Live example

See `x-avatar` on the [Behaviors showcase](/?page=behaviors) — search for `x-avatar` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/avatar.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
