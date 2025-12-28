# `<time>` Element

The `<time>` element represents a specific period in time. In WB Behaviors, it's used for timestamps, dates, and durations in cards and content.

## Semantic Meaning

- Machine-readable datetime with human-readable display
- The `datetime` attribute contains ISO 8601 format
- Can represent: dates, times, durations, date ranges

## `datetime` Attribute Formats

| Type | Format | Example |
|------|--------|---------|
| Date | `YYYY-MM-DD` | `2024-12-15` |
| Time | `HH:MM:SS` | `14:30:00` |
| DateTime | `YYYY-MM-DDTHH:MM:SS` | `2024-12-15T14:30:00` |
| With timezone | `YYYY-MM-DDTHH:MM:SSZ` | `2024-12-15T14:30:00Z` |
| Duration | `P[n]Y[n]M[n]DT[n]H[n]M[n]S` | `PT2H30M` |
| Year-Month | `YYYY-MM` | `2024-12` |
| Year | `YYYY` | `2024` |
| Week | `YYYY-W[n]` | `2024-W50` |

## WB Components Using `<time>`

### 1. Card File (`cardfile`)

```html
<article data-wb="cardfile" data-date="Dec 15, 2024">
  <time datetime="2024-12-15" class="wb-card__file-date">
    Dec 15, 2024
  </time>
</article>
```

### 2. Card Notification (`cardnotification`)

```html
<aside data-wb="cardnotification">
  <time datetime="2024-12-15T14:30:00Z" class="wb-card__notif-time">
    2 hours ago
  </time>
</aside>
```

### 3. Timeline Component

```html
<div data-wb="timeline">
  <article class="wb-timeline__item">
    <time datetime="2024-01" class="wb-timeline__date">
      January 2024
    </time>
    <div class="wb-timeline__content">
      <h4>Project Started</h4>
    </div>
  </article>
</div>
```

### 4. Relative Time Component (`relativetime`)

```html
<time 
  data-wb="relativetime" 
  datetime="2024-12-15T10:30:00Z"
  data-format="auto">
  3 hours ago
</time>
```

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `datetime` | Machine-readable for screen readers |
| Content | Human-readable display |
| `aria-label` | Override if display is ambiguous |

## Example: Blog Post Metadata

```html
<article class="blog-post">
  <header>
    <h1>Understanding Semantic HTML</h1>
    <div class="post-meta">
      <span>By John Doe</span>
      <time datetime="2024-12-15T09:00:00Z" class="post-date">
        December 15, 2024
      </time>
      <time datetime="PT8M" class="post-reading-time">
        8 min read
      </time>
    </div>
  </header>
  
  <footer>
    <p>
      Last updated: 
      <time datetime="2024-12-18T14:30:00Z">
        December 18, 2024 at 2:30 PM
      </time>
    </p>
  </footer>
</article>
```

## CSS Styling

```css
time {
  /* Often used inline, no special styling needed */
}

time.wb-card__file-date,
time.wb-card__notif-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

time.wb-timeline__date {
  font-weight: 600;
  color: var(--primary);
}

/* Relative time with auto-update */
time[data-wb="relativetime"] {
  /* Will be updated by JavaScript */
}
```

## JavaScript: Relative Time Updates

```javascript
// Update relative times periodically
function updateRelativeTimes() {
  document.querySelectorAll('time[datetime]').forEach(el => {
    const datetime = new Date(el.getAttribute('datetime'));
    const now = new Date();
    const diff = now - datetime;
    
    // Format as relative time
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    
    if (diff < 60000) {
      el.textContent = 'just now';
    } else if (diff < 3600000) {
      el.textContent = rtf.format(-Math.floor(diff / 60000), 'minute');
    } else if (diff < 86400000) {
      el.textContent = rtf.format(-Math.floor(diff / 3600000), 'hour');
    } else {
      el.textContent = rtf.format(-Math.floor(diff / 86400000), 'day');
    }
  });
}

// Update every minute
setInterval(updateRelativeTimes, 60000);
```

## Best Practices

1. **Always include `datetime`** - Even if display is relative
2. **Use ISO 8601** - Standard format for `datetime` attribute
3. **Localize display** - Use `Intl.DateTimeFormat` for human text
4. **Consider timezones** - Include timezone in `datetime` when relevant
5. **Durations** - Use ISO 8601 duration format (PT2H30M)
