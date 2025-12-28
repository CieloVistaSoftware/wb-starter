# `<aside>` Element

The `<aside>` element represents content that is tangentially related to the content around it. In WB Behaviors, it's used for notifications, alerts, and side content.

## Semantic Meaning

- Content that could be removed without affecting the main content
- Typically rendered as a sidebar or callout
- Should relate to surrounding content but not be essential to understanding it

## WB Components Using `<aside>`

### 1. Card Notification (`cardnotification`)

```html
<aside data-wb="cardnotification" data-type="info" data-title="Heads Up">
  <!-- Notification content -->
</aside>
```

**Why `<aside>`?** Notifications are supplementary information that doesn't affect the main page content.

### 2. Alert (`alert`)

```html
<aside data-wb="alert" data-type="warning" data-title="Warning">
  <!-- Alert message -->
</aside>
```

**Why `<aside>`?** Alerts are tangential messages that inform but don't constitute main content.

## Accessibility Considerations

| Attribute | Purpose |
|-----------|---------|
| `role="complementary"` | Default ARIA role (implicit) |
| `role="alert"` | For urgent notifications |
| `role="status"` | For non-urgent status updates |
| `aria-live` | For dynamic content updates |

## Example: Notification with ARIA

```html
<aside 
  data-wb="cardnotification" 
  data-type="success"
  role="status"
  aria-live="polite">
  <div class="wb-card__notif-icon">✅</div>
  <div class="wb-card__notif-content">
    <h4 class="wb-card__notif-title">Success</h4>
    <p class="wb-card__notif-message">Your changes were saved.</p>
  </div>
</aside>
```

## CSS Styling

```css
aside[data-wb="cardnotification"],
aside[data-wb="alert"] {
  /* Visually distinct from main content */
  border-left: 4px solid var(--color-info);
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 0.5rem;
}
```

## Best Practices

1. **Don't overuse** - Reserve for truly supplementary content
2. **Keep brief** - Aside content should be concise
3. **Provide context** - Include clear titles/labels
4. **Consider dismissibility** - Allow users to close non-essential asides
