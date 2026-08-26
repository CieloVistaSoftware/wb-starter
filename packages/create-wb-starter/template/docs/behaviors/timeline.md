# Timeline

Vertical timeline component for displaying sequential events

Applies to `<div>`, and to any element carrying `x-timeline`.

## Usage

```html
<div x-timeline items="Project kickoff,Design phase,Development,Testing,Launch"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `items` | `string` | — | Comma-separated list of timeline items |

## Methods

- `show()` — Shows the timeline
- `hide()` — Hides the timeline
- `toggle()` — Toggles visibility
- `update()` — Updates timeline items

## Live example

See `x-timeline` on the [Behaviors showcase](/?page=behaviors) — search for `x-timeline` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/timeline.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
