# `<data>` Element

The `<data>` element links content with a machine-readable value. In WB-Starter, it's used for statistics, prices, and other numeric data.

## Semantic Meaning

- Associates human-readable content with machine-readable value
- The `value` attribute contains the machine-readable form
- Useful for numbers, codes, prices, measurements

## WB Behaviors Using `<data>`

### 1. Card Stats (`cardstats`)

`x-cardstats` builds its own `<data>` element from the `value` attribute —
hand-authored children are replaced, not merged. The trend line uses `trend`
(`up`/`down`) plus `trend-value` for the display text.

<div x-demo>
<article
  x-cardstats
  value="1234"
  label="Total Users"
  trend="up"
  trend-value="+12%">
</article>
</div>

### 2. Card Product (`cardproduct`)

**Note:** `cardproduct` displays price as a plain `<span class="x-card__price-current">`,
not a `<data>` element — its `price`/`original-price` attributes are strings
shown verbatim, not machine-readable values.

<div x-demo>
<article
  x-cardproduct
  price="$99.99"
  original-price="$129.99"
  description="Wireless headphones">
</article>
</div>

### 3. Card Pricing (`cardpricing`)

**Note:** like `cardproduct`, `cardpricing` renders `price` as a plain
`<span class="x-card__amount">`, not a `<data>` element.

<div x-demo>
<article
  x-cardpricing
  plan="Starter"
  price="$29"
  period="/month">
</article>
</div>

## `value` Attribute Formats

| Content Type | Human Display | `value` Attribute |
|--------------|---------------|-------------------|
| Currency | $1,234.56 | `1234.56` |
| Percentage | +12.5% | `0.125` |
| Large numbers | 1.2M | `1200000` |
| Product codes | SKU-ABC | `ABC` |
| Ratings | ⭐⭐⭐⭐ | `4` |

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `value` | Machine-readable for processors/scripts |
| Content | Human-readable for users |
| `aria-label` | Override for screen readers if needed |

## Example: Dashboard Stats

<div x-demo>
<section
  class="dashboard-stats"
  aria-label="Key Metrics">
  <article
    x-cardstats
    icon="👥"
    value="15234"
    label="Active Users"
    trend="up"
    trend-value="8%">
  </article>
  <article
    x-cardstats
    icon="💰"
    value="$52,340.50"
    label="Revenue"
    trend="down"
    trend-value="3%">
  </article>
</section>
</div>

## CSS Styling

```css
data.x-card__stats-value {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums; /* Aligned numbers */
  color: var(--text-primary);
}

data.x-card__stats-trend {
  font-size: 0.875rem;
  font-weight: 600;
}

data.x-card__stats-trend--up {
  color: var(--success);
}

data.x-card__stats-trend--down {
  color: var(--danger);
}

data.x-card__price-current {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

data.x-card__price-original {
  font-size: 0.875rem;
  color: var(--text-muted);
}
```

## JavaScript Integration

```javascript
// Get machine-readable value
const priceElement = document.querySelector('.x-card__price-current');
const price = parseFloat(priceElement.value); // 99.99

// Calculate discount
const originalElement = document.querySelector('.x-card__price-original');
const original = parseFloat(originalElement.value); // 129.99
const discount = ((original - price) / original * 100).toFixed(0);
console.log(`${discount}% off!`); // "23% off!"
```

## Best Practices

1. **Always include `value`** - The whole point of `<data>`
2. **Use standard formats** - ISO for dates, decimals for numbers
3. **Format for humans** - Display text should be readable
4. **Consider localization** - Human display may vary by locale
5. **Use tabular-nums** - CSS for aligned numeric columns
