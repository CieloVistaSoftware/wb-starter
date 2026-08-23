# Card Stats - wb-starter v3.0

Statistics/metric display card using semantic `<data>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<articlestats>` |
| Behavior | `cardstats` |
| Semantic | `<article>` + `<data>` |
| Root CSS Class | `wb-card wb-stats` |
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

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<articlestats
  value="1,234"
  label="Total Users"
  icon="👥">
</div>
</wb-demo>

## Usage

### Basic Stats Card

```html
<articlestats
  value="1,234"
  label="Total Users"
  icon="👥">
</div>
```

### With Trend

<wb-demo>
<articlestats
  value="$45,678"
  label="Revenue"
  icon="💰"
  trend="up"
  trendValue="+12.5%">
</div>
</wb-demo>

### Negative Trend

<wb-demo>
<articlestats
  value="23"
  label="Open Issues"
  icon="🐛"
  trend="down"
  trendValue="-5">
</div>
</wb-demo>

## Generated Structure

```html
<article class="wb-card wb-stats">
  <header>
    <span class="wb-card__icon">👥</span>
  </header>
  <main>
    <data
      value="1234"
      class="wb-card__stats-value">
      1,234
    </data>
    <p class="wb-card__stats-label">Total Users</p>
    <p class="wb-card__stats-trend">↑ +12.5%</p>
  </main>
</article>
```

## Schema

Location: `src/wb-models/cardstats.schema.json`
