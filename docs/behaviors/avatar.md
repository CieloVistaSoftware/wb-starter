# Avatar

`x-avatar` renders a round (or `shape`d) picture from `src`, and falls back to initials taken from `name` when there is no image or it fails to load. `status` adds an online/busy/away dot. Put it on an empty `<div>` or `<span>`.

## Usage

<div x-demo>
<div x-avatar name="Ada Lovelace" size="lg" status="online"></div>
<div x-avatar src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/1280px-Ada_Lovelace_portrait.jpg" alt="Ada Lovelace" name="Ada Lovelace" size="lg"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `#` | Image source URL |
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

<sub>Schema: [`avatar.schema.json`](../../src/wb-models/avatar.schema.json)</sub>
