# Tabs

`x-tabs` turns its child sections into tab panels: each child's `title` becomes a tab button, and only the active panel is shown. `variant` picks the tab style and `activeTab` the starting panel.

## Usage

<div x-demo>
<div x-tabs activeTab="0" variant="underline">
  <section title="Overview">Composition over inheritance, in light DOM.</section>
  <section title="Attributes">Every attribute is kebab-case (§31).</section>
  <section title="Events">Behaviors fire wb:&lt;name&gt;:&lt;action&gt;.</section>
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `activeTab` | `number` | `0` | Initially active tab index |
| `variant` | `default` · `pills` · `underline` · `bordered` | `default` |  |
| `size` | `sm` · `md` · `lg` | `md` |  |
| `fullWidth` | `boolean` | `false` | Tabs fill container width |
| `vertical` | `boolean` | `false` | Vertical tab layout |

## Events

- `wb:tabs:change` — Tab changed

## Methods

- `setActiveTab()` — Activates a tab by index
- `getActiveTab()` — Returns active tab index
- `next()` — Activates next tab
- `prev()` — Activates previous tab
- `first()` — Activates first tab
- `last()` — Activates last tab

## Accessibility

- **tablist** — {"role":"tablist"}
- **tab** — {"role":"tab","ariaSelected":"dynamic","ariaControls":"panel id"}
- **panel** — {"role":"tabpanel","ariaLabelledBy":"tab id"}

<sub>Schema: [`tabs.schema.json`](../../src/wb-models/tabs.schema.json)</sub>
