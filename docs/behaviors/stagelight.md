# Stage Light - wb-starter v3.0

Decorative stage-lighting effects — a sweeping beam, a mouse-tracking spotlight, or a
clickable light fixture — driven entirely by CSS custom properties the behavior sets
on the host element.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `stagelight` |
| Attribute | `x-stagelight` |
| Custom Tag | `<wb-stagelight>` |
| Applies to | any element |
| Category | Effects |
| Support level | Experimental |
| Schema | `src/wb-models/stagelight.schema.json` |
| Source | `src/wb-viewmodels/stagelight.js` |

Both forms run the same behavior: `<div x-stagelight>` and `<wb-stagelight>` are
equivalent — the tag form is registered in the tag map
([`src/core/tag-map.js`](../../src/core/tag-map.js)) and dispatches to the identical
`stagelight()` function. `autoInject` is on by default site-wide
([`src/core/config.js`](../../src/core/config.js)), so `x-stagelight` activates
without any manual `WB.scan()` call.

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `variant` | `variant` | `beam` \| `spotlight` \| `fixture` | `"beam"` | Which lighting effect to render |
| `color` | `color` | string (hex/rgb/named) | `"#ffffff"` | Light color |
| `size` | `size` | string (CSS length) | `"300px"` | Beam width / spotlight radius |
| `intensity` | `intensity` | number (0–1) | `"0.5"` | Brightness/opacity of the light |
| `speed` | `speed` | string (CSS duration) | `"3s"` | Beam swing animation speed (`beam` variant only) |
| `target` | `target` | string | `"mouse"` | Only `"mouse"` is implemented — attaches a `mousemove` tracker for the `spotlight` variant. Any other value leaves the spotlight untracked (stays centered) |
| `label` | `label` | string | none | Caption shown under the `fixture` variant's housing |

Every property also accepts a `data-*` fallback (e.g. `data-variant`) for
back-compat, but the plain attribute above is canonical.

## Usage

### Beam (default) — sweeping animated cone

<wb-demo>
<div x-stagelight variant="beam" color="#6366f1" style="height: 220px;"></div>
</wb-demo>

### Spotlight — follows the mouse

`spotlight` renders a fixed, viewport-covering overlay (`position: fixed`) that
darkens everything except a circle around the cursor — move the mouse over the page
to see it track.

<wb-demo>
<div x-stagelight variant="spotlight" size="200px"></div>
</wb-demo>

### Fixture — clickable light housing with a label

Click the housing to toggle the light on/off (dims to `intensity="0.1"`).

<wb-demo>
<div x-stagelight variant="fixture" color="#ef4444" label="Key Light"></div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.wb-stagelight--beam` | `variant="beam"` | Positions the swinging beam cone at the top of the host |
| `.wb-stagelight--spotlight` | `variant="spotlight"` | Fixed, full-viewport darkening overlay with a radial cutout |
| `.wb-stagelight--fixture` | `variant="fixture"` | Inline-flex housing + label layout |
| `.wb-stagelight__source` | `beam` variant | The fixture nub the beam appears to emit from |
| `.wb-stagelight__beam` | `beam` variant | The gradient cone itself |
| `.wb-stagelight__housing` | `fixture` variant | The clickable bulb housing |

## CSS Custom Properties

Set on the host element and consumed by the injected stylesheet:

| Property | Description |
|----------|--------------|
| `--wb-stagelight-color` | Light color |
| `--wb-stagelight-size` | Beam/spotlight size |
| `--wb-stagelight-intensity` | Opacity/brightness |
| `--speed` | Beam swing duration |

## Methods

| Method | Description |
|--------|--------------|
| `element.wbStageLight.setColor(color)` | Updates `--wb-stagelight-color` |
| `element.wbStageLight.setIntensity(intensity)` | Updates `--wb-stagelight-intensity` |
| `element.wbStageLight.setSize(size)` | Updates `--wb-stagelight-size` |

## Accessibility

`stagelight` is purely decorative — the schema marks its implicit role as
`presentation`, and the behavior adds no text alternative. The `spotlight` variant
darkens the rest of the page (`mix-blend-mode: multiply` at high opacity), which can
reduce contrast for the surrounding content; avoid it around text that needs to stay
readable while the spotlight is active.

## Source

[src/wb-viewmodels/stagelight.js](../../src/wb-viewmodels/stagelight.js)
