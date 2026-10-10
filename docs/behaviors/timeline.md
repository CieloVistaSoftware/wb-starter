# Timeline

`x-timeline` draws a vertical timeline, one marker per entry in the comma-separated `items`. Use it for a sequence of events or milestones.

## Usage

<figure x-demo>
<div x-timeline items="Project kickoff,Design phase,Development,Testing,Launch"></div>
</figure>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `items` | comma-separated list | — | Comma-separated list of timeline items |

## Methods

- `show()` — Shows the timeline
- `hide()` — Hides the timeline
- `toggle()` — Toggles visibility
- `update()` — Updates timeline items

<sub>Schema: [`timeline.schema.json`](../../src/wb-models/timeline.schema.json)</sub>
