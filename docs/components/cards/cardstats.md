# Card Stats - WB Framework v3.0

Statistics/metric display card using semantic `<data>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardstats>` |
| Behavior | `cardstats` |
| Semantic | `<article>` + `<data>` |
| Base Class | `wb-card wb-stats` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | `""` | Statistic value |
| `label` | string | `""` | Metric label |
| `icon` | string | `""` | Icon/emoji |
| `trend` | string | `""` | Trend: `up`, `down`, `neutral` |
| `trendValue` | string | `""` | Trend percentage/value |

## Usage

### Basic Stats Card

```html
<wb-cardstats 
  value="1,234"
  label="Total Users"
  icon="👥">
</wb-cardstats>
```

### With Trend

```html
<wb-cardstats 
  value="$45,678"
  label="Revenue"
  icon="💰"
  trend="up"
  trendValue="+12.5%">
</wb-cardstats>
```

### Negative Trend

```html
<wb-cardstats 
  value="23"
  label="Open Issues"
  icon="🐛"
  trend="down"
  trendValue="-5">
</wb-cardstats>
```

## Generated Structure

```html
<article class="wb-card wb-stats">
  <header>
    <span class="wb-card__icon">👥</span>
  </header>
  <main>
    <data value="1234" class="wb-card__stats-value">1,234</data>
    <p class="wb-card__stats-label">Total Users</p>
    <p class="wb-card__stats-trend">↑ +12.5%</p>
  </main>
</article>
```

## Schema

Location: `src/wb-models/cardstats.schema.json`
