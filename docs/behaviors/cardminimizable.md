# Minimizable Card

`x-cardminimizable` renders a card with a minimise button in its header that collapses the body to just the title bar and restores it again. Use it for panels a reader may want out of the way, such as logs.

## Usage

<div x-demo>
<article x-cardminimizable
  title="Build log">tsc --noEmit clean. 141 regression tests passed. Packaged in 4.2s.</article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title (always visible) |
| `content` | `string` | — | Minimizable content |
| `minimized` | `boolean` | `false` | Initial minimized state |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:minimizable:toggle` — Fired on minimize/expand

## Methods

- `minimize()` — Minimizes the card
- `expand()` — Expands the card
- `toggle()` — Toggles minimized state
- `isMinimized()` — Returns minimized state

<sub>Schema: [`cardminimizable.schema.json`](../../src/wb-models/cardminimizable.schema.json)</sub>
