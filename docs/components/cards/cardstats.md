# Card Stats

A statistics display card showing a key metric with label and optional trend indicator. Perfect for dashboards, KPIs, and data visualization.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardstats` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card--stats` |
| Category | Cards |
| Icon | 📊 |

## Inheritance

```
article (semantic) → card.base → cardstats
```

Card Stats **IS-A** card, inheriting semantic structure.

### Containment (HAS-A)

| Element | HTML | Description |
|---------|------|-------------|
| Value | `<data>` | Semantic data element for machine-readable value |
| Label | `<p>` | Description of the metric |
| Trend | `<p>` | Trend indicator with direction |

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Stats Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | **required** | The main statistic value |
| `label` | string | `""` | Label describing the value |
| `icon` | string | `""` | Icon emoji or symbol |
| `trend` | enum | `""` | Trend direction |
| `trendValue` | string | `""` | Trend value (e.g., "+12%") |
| `color` | string | `""` | Accent color |

### Trend Options

| Value | Icon | Color |
|-------|------|-------|
| `up` | ↑ | Green (success) |
| `down` | ↓ | Red (danger) |
| `neutral` | → | Gray (muted) |
| (empty) | (none) | (none) |

## Usage

### Basic Stat

```html
<article data-wb="cardstats" data-value="1,234"></article>
```

### Stat with Label

```html
<article data-wb="cardstats"
         data-value="1,234"
         data-label="Total Users">
</article>
```

### Stat with Icon

```html
<article data-wb="cardstats"
         data-value="$50K"
         data-label="Revenue"
         data-icon="💰">
</article>
```

### Stat with Trend

```html
<article data-wb="cardstats"
         data-value="89%"
         data-label="Satisfaction"
         data-trend="up"
         data-trend-value="+5%">
</article>
```

### Full Stats Card

```html
<article data-wb="cardstats"
         data-value="2,847"
         data-label="Active Users"
         data-icon="👥"
         data-trend="up"
         data-trend-value="+12%"
         data-elevated="true">
</article>
```

## Structure

```html
<article class="wb-card wb-card--stats">
  <!-- Header with icon (when icon is set) -->
  <header class="wb-card__header">
    <span class="wb-card__stats-icon">💰</span>
  </header>
  
  <!-- Main content -->
  <main class="wb-card__main">
    <!-- Semantic data element for value -->
    <data class="wb-card__stats-value" value="50000">$50K</data>
    
    <!-- Label -->
    <p class="wb-card__stats-label">Revenue</p>
    
    <!-- Trend indicator (when trend is set) -->
    <p class="wb-card__stats-trend wb-card__stats-trend--up">
      <span class="trend-icon">↑</span>
      <span class="trend-value">+12%</span>
    </p>
  </main>
</article>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card--stats` | Stats variant styling |
| `.wb-card__stats-icon` | Icon display |
| `.wb-card__stats-value` | Main value (large) |
| `.wb-card__stats-label` | Label text (muted) |
| `.wb-card__stats-trend` | Trend container |
| `.wb-card__stats-trend--up` | Positive trend (green) |
| `.wb-card__stats-trend--down` | Negative trend (red) |
| `.wb-card__stats-trend--neutral` | Neutral trend (gray) |

## Semantic HTML

The value uses the `<data>` element for machine-readability:

```html
<data class="wb-card__stats-value" value="1234">1,234</data>
```

Benefits:
- Screen readers can access raw value
- Parseable by search engines
- Semantic meaning for statistics

## Accessibility

| Element | Implementation |
|---------|----------------|
| Value | `<data>` element with `value` attribute |
| Icon | Decorative (not announced) |
| Trend | Includes direction text |

### Screen Reader Announcement

```
"1,234 Total Users, up 12 percent"
```

## Builder Integration

### Sidebar

```
📁 Cards
└── 📊 Card Stats
```

### Property Panel

| Group | Properties |
|-------|------------|
| Data | value, label |
| Display | icon, color |
| Trend | trend, trendValue |
| Style | elevated |

### Defaults

```json
{
  "value": "0",
  "label": "",
  "icon": "",
  "trend": "",
  "trendValue": "",
  "color": ""
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `value="100"` | Value in data element |
| `value="100" label="Items"` | Value and label |
| `value="100" icon="📊"` | Icon in header |
| `value="100" trend="up" trendValue="+10%"` | Green up trend |
| `value="100" trend="down" trendValue="-5%"` | Red down trend |
| Full combination | All elements present |

## Examples

### Dashboard KPIs

```html
<!-- Users -->
<article data-wb="cardstats"
         data-value="12,847"
         data-label="Total Users"
         data-icon="👥"
         data-trend="up"
         data-trend-value="+8.2%">
</article>

<!-- Revenue -->
<article data-wb="cardstats"
         data-value="$284K"
         data-label="Monthly Revenue"
         data-icon="💰"
         data-trend="up"
         data-trend-value="+15%">
</article>

<!-- Orders -->
<article data-wb="cardstats"
         data-value="1,492"
         data-label="Orders"
         data-icon="📦"
         data-trend="down"
         data-trend-value="-3.1%">
</article>

<!-- Conversion -->
<article data-wb="cardstats"
         data-value="3.2%"
         data-label="Conversion Rate"
         data-icon="📈"
         data-trend="neutral"
         data-trend-value="0%">
</article>
```

### Compact Stats Row

```html
<div style="display: flex; gap: 1rem;">
  <article data-wb="cardstats" data-value="42" data-label="Projects"></article>
  <article data-wb="cardstats" data-value="128" data-label="Tasks"></article>
  <article data-wb="cardstats" data-value="97%" data-label="Complete"></article>
</div>
```

### Large Elevated Stats

```html
<article data-wb="cardstats"
         data-value="$1.2M"
         data-label="Annual Revenue"
         data-icon="🏆"
         data-trend="up"
         data-trend-value="+24%"
         data-elevated="true">
</article>
```

## Formatting Values

The `value` property accepts any string. Common formats:

| Format | Example | Use Case |
|--------|---------|----------|
| Number | `1,234` | Counts |
| Currency | `$50K` | Money |
| Percentage | `89%` | Rates |
| Decimal | `3.14` | Metrics |
| Time | `2h 30m` | Duration |
| Mixed | `1.2M` | Large numbers |

## Related

- [Card](./card.md) - Base card component
- [Progress](../progress.md) - Progress indicator
- [Badge](../badge.md) - Status badge
