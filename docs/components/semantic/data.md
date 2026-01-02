# `<data>` Element

The `<data>` element links content with a machine-readable value. In Web Behaviors (WB), it's used for statistics, prices, and other numeric data.

## Semantic Meaning

- Associates human-readable content with machine-readable value
- The `value` attribute contains the machine-readable form
- Useful for numbers, codes, prices, measurements

## WB Components Using `<data>`

### 1. Card Stats (`cardstats`)

```html
<article data-wb="cardstats" data-value="1234" data-label="Total Users">
  <data value="1234" class="wb-card__stats-value">
    1,234
  </data>
  <span class="wb-card__stats-label">Total Users</span>
  <data value="0.12" class="wb-card__stats-trend wb-card__stats-trend--up">
    +12%
  </data>
</article>
```

### 2. Card Product (`cardproduct`)

```html
<article data-wb="cardproduct" data-price="99.99">
  <div class="wb-card__pricing">
    <data value="99.99" class="wb-card__price-current">
      $99.99
    </data>
    <data value="129.99" class="wb-card__price-original">
      <s>$129.99</s>
    </data>
  </div>
</article>
```

### 3. Card Pricing (`cardpricing`)

```html
<article data-wb="cardpricing" data-price="29">
  <data value="29" class="wb-card__amount">
    $29
  </data>
  <span class="wb-card__period">/month</span>
</article>
```

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

```html
<section class="dashboard-stats" aria-label="Key Metrics">
  <article data-wb="cardstats" class="wb-card wb-card--stats">
    <div class="wb-card__stats-icon" aria-hidden="true">👥</div>
    <div class="wb-card__stats-content">
      <data value="15234" class="wb-card__stats-value">
        15,234
      </data>
      <span class="wb-card__stats-label">Active Users</span>
      <data value="0.08" class="wb-card__stats-trend wb-card__stats-trend--up">
        ↑ 8%
      </data>
    </div>
  </article>
  
  <article data-wb="cardstats" class="wb-card wb-card--stats">
    <div class="wb-card__stats-icon" aria-hidden="true">💰</div>
    <div class="wb-card__stats-content">
      <data value="52340.50" class="wb-card__stats-value">
        $52,340.50
      </data>
      <span class="wb-card__stats-label">Revenue</span>
      <data value="-0.03" class="wb-card__stats-trend wb-card__stats-trend--down">
        ↓ 3%
      </data>
    </div>
  </article>
</section>
```

## CSS Styling

```css
data.wb-card__stats-value {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums; /* Aligned numbers */
  color: var(--text-primary);
}

data.wb-card__stats-trend {
  font-size: 0.875rem;
  font-weight: 600;
}

data.wb-card__stats-trend--up {
  color: var(--success);
}

data.wb-card__stats-trend--down {
  color: var(--danger);
}

data.wb-card__price-current {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

data.wb-card__price-original {
  font-size: 0.875rem;
  color: var(--text-muted);
}
```

## JavaScript Integration

```javascript
// Get machine-readable value
const priceElement = document.querySelector('.wb-card__price-current');
const price = parseFloat(priceElement.value); // 99.99

// Calculate discount
const originalElement = document.querySelector('.wb-card__price-original');
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
