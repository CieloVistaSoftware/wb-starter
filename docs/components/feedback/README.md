# Feedback Components

## Overview

Web Behaviors (WB) provides components for user feedback, notifications, and loading states.

---

## Alert (`alert`)

Static alert message.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | "info" | Type: info, success, warning, error |
| `title` | string | "" | Alert title |
| `message` | string | "" | Alert message |
| `dismissible` | boolean | false | Show close button |
| `icon` | string | "" | Custom icon |

```html
<div data-wb="alert" 
     data-type="success" 
     data-title="Success!" 
     data-message="Your changes have been saved."
     data-dismissible="true">
</div>
```

### Alert Types
| Type | Color | Icon |
|------|-------|------|
| `info` | Blue | ℹ️ |
| `success` | Green | ✅ |
| `warning` | Yellow | ⚠️ |
| `error` | Red | ❌ |

---

## Toast (`toast`)

Temporary notification popup.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | "info" | Type: info, success, warning, error |
| `message` | string | "" | Toast message |
| `duration` | string | "3000" | Duration in ms (0 = permanent) |
| `position` | string | "bottom-right" | Position |
| `dismissible` | boolean | true | Show close button |

```html
<div data-wb="toast" 
     data-type="success" 
     data-message="Item added to cart"
     data-duration="3000"
     data-position="top-right">
</div>
```

### Toast Positions
- `top-left`, `top-center`, `top-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### Programmatic API
```javascript
WB.toast({
  type: 'success',
  message: 'Operation completed!',
  duration: 3000
});
```

---

## Notify (`notify`)

Push notification style popup.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "" | Notification title |
| `message` | string | "" | Notification body |
| `icon` | string | "" | Icon URL or emoji |
| `image` | string | "" | Image URL |
| `duration` | string | "5000" | Duration in ms |
| `actions` | string | "" | JSON array of actions |

```html
<div data-wb="notify" 
     data-title="New Message" 
     data-message="You have a new message from John"
     data-icon="💬">
</div>
```

---

## Progress (`progress`)

Native progress bar.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | "0" | Current value |
| `max` | string | "100" | Maximum value |
| `label` | string | "" | Label text |
| `showValue` | boolean | false | Show percentage |

```html
<progress data-wb="progress" 
          data-value="70" 
          data-max="100"
          data-label="Upload Progress"
          data-show-value="true">
</progress>
```

**Semantic HTML:** `<progress>`

---

## Progressbar (`progressbar`)

Custom styled progress bar.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | "0" | Current value (0-100) |
| `label` | string | "" | Label text |
| `showValue` | boolean | true | Show percentage |
| `color` | string | "" | Bar color |
| `striped` | boolean | false | Striped pattern |
| `animated` | boolean | false | Animate stripes |
| `size` | string | "md" | Size: sm, md, lg |

```html
<div data-wb="progressbar" 
     data-value="45" 
     data-label="Loading..."
     data-striped="true"
     data-animated="true">
</div>
```

---

## Spinner (`spinner`)

Loading spinner.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | string | "md" | Size: xs, sm, md, lg, xl |
| `color` | string | "" | Spinner color |
| `label` | string | "" | Accessibility label |
| `variant` | string | "border" | Variant: border, grow, dots |

```html
<div data-wb="spinner" 
     data-size="lg" 
     data-variant="dots"
     data-label="Loading content...">
</div>
```

### Spinner Variants
| Variant | Description |
|---------|-------------|
| `border` | Spinning border |
| `grow` | Growing/shrinking |
| `dots` | Three bouncing dots |

---

## Skeleton (`skeleton`)

Loading placeholder.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | string | "text" | Variant: text, circle, rect, card |
| `width` | string | "100%" | Element width |
| `height` | string | "" | Element height |
| `lines` | string | "1" | Number of text lines |
| `animation` | string | "pulse" | Animation: pulse, wave, none |

```html
<div data-wb="skeleton" 
     data-variant="card"
     data-animation="wave">
</div>
```

### Skeleton Variants
```html
<!-- Text placeholder -->
<div data-wb="skeleton" data-variant="text" data-lines="3"></div>

<!-- Avatar placeholder -->
<div data-wb="skeleton" data-variant="circle" data-width="48px"></div>

<!-- Image placeholder -->
<div data-wb="skeleton" data-variant="rect" data-height="200px"></div>

<!-- Card placeholder -->
<div data-wb="skeleton" data-variant="card"></div>
```

---

## Badge (`badge`)

Small status indicator.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | string | "" | Badge text |
| `variant` | string | "default" | Variant: default, primary, success, warning, error |
| `color` | string | "" | Custom color |
| `size` | string | "md" | Size: sm, md, lg |
| `pill` | boolean | false | Rounded pill shape |
| `dot` | boolean | false | Dot without text |

```html
<span data-wb="badge" 
      data-text="New" 
      data-variant="primary"
      data-pill="true">
</span>
```

---

## Chip (`chip`)

Compact element with optional dismiss.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | string | "" | Chip text |
| `icon` | string | "" | Icon before text |
| `avatar` | string | "" | Avatar image URL |
| `dismissible` | boolean | false | Show remove button |
| `variant` | string | "default" | Variant: default, outlined, filled |
| `color` | string | "" | Custom color |

```html
<div data-wb="chip" 
     data-text="React" 
     data-dismissible="true"
     data-icon="⚛️">
</div>
```

---

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:alert:dismiss` | Alert dismissed | `{ alert }` |
| `wb:toast:show` | Toast shown | `{ toast }` |
| `wb:toast:hide` | Toast hidden | `{ toast }` |
| `wb:progress:complete` | Progress reached 100% | `{ progress }` |
| `wb:chip:dismiss` | Chip dismissed | `{ chip, text }` |

---

## CSS Classes

```css
/* Alert */
.wb-alert { }
.wb-alert--info { }
.wb-alert--success { }
.wb-alert--warning { }
.wb-alert--error { }
.wb-alert__icon { }
.wb-alert__title { }
.wb-alert__message { }
.wb-alert__close { }

/* Toast */
.wb-toast { }
.wb-toast-container { }
.wb-toast-container--top-right { }
.wb-toast-container--bottom-right { }

/* Progress */
.wb-progress { }
.wb-progressbar { }
.wb-progressbar__track { }
.wb-progressbar__fill { }
.wb-progressbar--striped { }
.wb-progressbar--animated { }

/* Spinner */
.wb-spinner { }
.wb-spinner--sm { }
.wb-spinner--md { }
.wb-spinner--lg { }
.wb-spinner--border { }
.wb-spinner--grow { }
.wb-spinner--dots { }

/* Skeleton */
.wb-skeleton { }
.wb-skeleton--text { }
.wb-skeleton--circle { }
.wb-skeleton--rect { }
.wb-skeleton--pulse { }
.wb-skeleton--wave { }

/* Badge */
.wb-badge { }
.wb-badge--primary { }
.wb-badge--pill { }
.wb-badge--dot { }

/* Chip */
.wb-chip { }
.wb-chip__icon { }
.wb-chip__avatar { }
.wb-chip__text { }
.wb-chip__remove { }
```
