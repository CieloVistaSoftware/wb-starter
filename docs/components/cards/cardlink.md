# Card Link

A clickable card that navigates to a URL. The entire card surface is interactive, making it ideal for navigation menus, resource links, and featured content.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `cardlink` |
| Semantic | `<article>` |
| Base Class | `wb-card wb-card--link` |
| Category | Cards |
| Icon | 🔗 |

## Inheritance

```
article (semantic) → card.base → cardlink
```

Card Link **IS-A** card, inheriting semantic structure.
Card Link **HAS-A** implicit click handler for navigation.

## Properties

### Inherited from Card Base

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Card title |
| `subtitle` | string | `""` | Subtitle below title |
| `footer` | string | `""` | Footer text |
| `elevated` | boolean | `false` | Add drop shadow |
| `hoverable` | boolean | `true` | Enable hover effects |

### Card Link Specific

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | string | `"#"` | Link destination URL |
| `content` | string | `"Click to visit link"` | Card content/description |
| `target` | enum | `"_blank"` | Link target window |
| `icon` | string | `"🔗"` | Link icon |

### Target Options

| Value | Description |
|-------|-------------|
| `_self` | Open in same window |
| `_blank` | Open in new tab (default) |

## Usage

### Basic Link Card

```html
<article data-wb="cardlink"
         data-href="https://example.com">
</article>
```

### Link with Title

```html
<article data-wb="cardlink"
         data-href="https://example.com"
         data-title="Example Website">
</article>
```

### Internal Link

```html
<article data-wb="cardlink"
         data-href="/about"
         data-title="About Us"
         data-content="Learn more about our company"
         data-target="_self">
</article>
```

### Full Link Card

```html
<article data-wb="cardlink"
         data-href="https://docs.example.com"
         data-title="Documentation"
         data-content="Read the full API documentation"
         data-icon="📚"
         data-target="_blank"
         data-elevated="true">
</article>
```

## Structure

```html
<article class="wb-card wb-card--link"
         role="link"
         tabindex="0">
  <!-- Header with icon -->
  <header class="wb-card__header">
    <span class="wb-card__link-icon">🔗</span>
    <h3 class="wb-card__title">Link Title</h3>
    <p class="wb-card__subtitle">Subtitle</p>
  </header>
  
  <!-- Main content -->
  <main class="wb-card__main">
    <p>Click to visit link</p>
  </main>
  
  <!-- Footer (when set) -->
  <footer class="wb-card__footer">
    Footer text
  </footer>
</article>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.wb-card--link` | Link variant styling |
| `.wb-card__link-icon` | Icon display |

### Hover State

```css
.wb-card--link:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  cursor: pointer;
}
```

### Focus State

```css
.wb-card--link:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

## Interactions

### Click Behavior

Clicking anywhere on the card navigates to `href`:

| Target | Behavior |
|--------|----------|
| `_self` | Navigate in current window |
| `_blank` | Open new tab |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus card |
| `Enter` | Navigate to href |

### Event

The `wb:cardlink:click` event fires before navigation:

```javascript
card.addEventListener('wb:cardlink:click', (e) => {
  console.log('Navigating to:', e.detail.href);
  console.log('Title:', e.detail.title);
  
  // Prevent navigation if needed
  // e.preventDefault();
});
```

| Property | Type | Description |
|----------|------|-------------|
| `detail.href` | string | Destination URL |
| `detail.title` | string | Card title |

## Accessibility

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `role` | `link` | Semantic link role |
| `tabindex` | `0` | Keyboard focusable |

### Screen Reader

Announced as: "Link Title, link"

### Focus Indicator

Visible focus ring for keyboard users.

## Builder Integration

### Sidebar

```
📁 Cards
└── 🔗 Card Link
```

### Property Panel

| Group | Properties |
|-------|------------|
| Link | href, target |
| Content | title, content, icon |
| Style | elevated, hoverable |

### Defaults

```json
{
  "href": "#",
  "title": "",
  "content": "Click to visit link",
  "icon": "🔗",
  "target": "_blank"
}
```

## Test Matrix

| Combination | Expected |
|-------------|----------|
| `href="https://example.com"` | Clickable card |
| `href="..." title="Title"` | Title displayed |
| `href="#section" target="_self"` | Internal navigation |
| `href="..." icon="🌐"` | Custom icon |

## Examples

### Resource Links

```html
<div style="display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr);">
  <article data-wb="cardlink"
           data-href="https://docs.example.com"
           data-title="Documentation"
           data-content="API reference and guides"
           data-icon="📚">
  </article>
  
  <article data-wb="cardlink"
           data-href="https://github.com/example"
           data-title="GitHub"
           data-content="View source code"
           data-icon="💻">
  </article>
  
  <article data-wb="cardlink"
           data-href="https://discord.gg/example"
           data-title="Community"
           data-content="Join the discussion"
           data-icon="💬">
  </article>
</div>
```

### Internal Navigation

```html
<article data-wb="cardlink"
         data-href="/dashboard"
         data-title="Go to Dashboard"
         data-content="View your projects and analytics"
         data-icon="📊"
         data-target="_self">
</article>
```

### External Resource

```html
<article data-wb="cardlink"
         data-href="https://developer.mozilla.org"
         data-title="MDN Web Docs"
         data-content="Comprehensive web development documentation"
         data-icon="🌐"
         data-target="_blank"
         data-elevated="true">
</article>
```

### Download Link

```html
<article data-wb="cardlink"
         data-href="/downloads/app.zip"
         data-title="Download App"
         data-content="Version 2.0.0 - 15MB"
         data-icon="⬇️"
         data-target="_self">
</article>
```

### Featured Article

```html
<article data-wb="cardlink"
         data-href="/blog/getting-started"
         data-title="Getting Started Guide"
         data-subtitle="5 min read"
         data-content="Everything you need to know to begin using our platform."
         data-icon="📖"
         data-target="_self"
         data-elevated="true">
</article>
```

## URL Validation

The builder validates URLs before saving:

| URL Type | Example | Valid |
|----------|---------|-------|
| Internal anchor | `#section` | ✅ |
| Internal path | `/about` | ✅ |
| External HTTPS | `https://example.com` | ✅ |
| External HTTP | `http://example.com` | ✅ |
| Invalid | `example.com` | ❌ |

### Valid URL Formats

```html
<!-- Internal anchor -->
data-href="#features"

<!-- Internal path -->
data-href="/about"

<!-- External URL -->
data-href="https://example.com"

<!-- External with path -->
data-href="https://example.com/docs/guide"
```

## JavaScript Integration

### Preventing Navigation

```javascript
const card = document.querySelector('[data-wb="cardlink"]');

card.addEventListener('wb:cardlink:click', (e) => {
  // Check condition
  if (!userIsLoggedIn) {
    e.preventDefault();
    showLoginModal();
  }
});
```

### Tracking Clicks

```javascript
card.addEventListener('wb:cardlink:click', (e) => {
  // Analytics
  analytics.track('link_click', {
    href: e.detail.href,
    title: e.detail.title
  });
});
```

## Related

- [Card](./card.md) - Base card component
- [Card Button](./cardbutton.md) - Card with action buttons
- [Link](../link.md) - Inline link component
