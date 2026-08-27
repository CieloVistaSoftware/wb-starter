# Card Stats - wb-starter v3.0

Statistics/metric display card using semantic `<data>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardstats>` |
| Behavior | `cardstats` |
| Semantic | `<article>` + `<data>` |
| Root CSS Class | `x-card x-stats` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | `""` | Statistic value |
| `label` | string | `""` | Metric label |
| `icon` | string | `""` | Icon/emoji |
| `trend` | string | `""` | Trend: `up`, `down`, `neutral` |
| `trendValue` | string | `""` | Trend percentage/value |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-cardstats
  value="1,234"
  label="Total Users"
  icon="👥">
</div>
</div>

## Usage

### Basic Stats Card

```html
<div x-cardstats
  value="1,234"
  label="Total Users"
  icon="👥">
</div>
```

### With Trend

<div x-demo>
<div x-cardstats
  value="$45,678"
  label="Revenue"
  icon="💰"
  trend="up"
  trendValue="+12.5%">
</div>
</div>

### Negative Trend

<div x-demo>
<div x-cardstats
  value="23"
  label="Open Issues"
  icon="🐛"
  trend="down"
  trendValue="-5">
</div>
</div>

## Generated Structure

```html
<article class="x-card x-stats">
  <header>
    <span class="x-card__icon">👥</span>
  </header>
  <main>
    <data
      value="1234"
      class="x-card__stats-value">
      1,234
    </data>
    <p class="x-card__stats-label">Total Users</p>
    <p class="x-card__stats-trend">↑ +12.5%</p>
  </main>
</article>
```

## Schema

Location: `src/wb-models/cardstats.schema.json`
