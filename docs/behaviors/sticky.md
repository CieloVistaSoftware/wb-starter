# Sticky

`x-sticky` keeps the element pinned `offset` from the top of its scroll container once it scrolls there, adds `stuckClass` while pinned, and fires `wb:sticky:stuck` and `wb:sticky:unstuck`.

## Usage

<div x-demo>
<div x-sticky offset="0" stuckClass="is-stuck">
  Sticks to the top of its scroll container once you pass it.
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `offset` | CSS length | `0` | Offset from top when stuck |
| `zIndex` | `number` | `100` | Z-index when stuck |
| `threshold` | `number` | `0` | Scroll position to trigger sticky |
| `stuckClass` | CSS class name | `is-stuck` | Class added when stuck |
| `animated` | `boolean` | `true` | Animate stick/unstick |

## Events

- `wb:sticky:stuck` — Element became stuck
- `wb:sticky:unstuck` — Element unstuck

## Methods

- `stick()` — Forces sticky state
- `unstick()` — Forces unsticky state
- `isStuck()` — Returns stuck state

<sub>Schema: [`sticky.schema.json`](../../src/wb-models/sticky.schema.json)</sub>
