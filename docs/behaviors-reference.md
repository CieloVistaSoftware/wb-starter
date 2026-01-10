# Web Behaviors (WB) Reference

This document lists all available behaviors in the WB Starter kit, categorized by function.

---

## What is a Behavior?

A **behavior** is a JavaScript function that **enhances** an HTML element by adding:
- CSS classes (styling hooks)
- Inline styles (visual enhancement)
- Event listeners (interactivity)
- ARIA attributes (accessibility)
- Data attributes (state tracking)

A behavior does **NOT** change what the element fundamentally is - it enhances it.

---

## Syntax & Usage

Behaviors are applied using attributes with a configurable prefix (default: `x-`).

### 1. Decoration (`x-{behavior}`)
Enhances an element without changing its fundamental structure.

```html
<!-- Add ripple effect to a button -->
<button x-ripple>Click Me</button>

<!-- Add tooltip -->
<div x-tooltip="Hello World">Hover Me</div>
```

| Element | Behavior | Result |
|---------|----------|--------|
| `<button>` | `button` | Button with variants, sizes, loading state |
| `<table>` | `table` | Table with sorting, striping, hover |
| `<details>` | `details` | Details with smooth animation |
| `<dialog>` | `dialog` | Dialog with backdrop, animations |
| `<img>` | `image` | Lazy loading, fade-in, lightbox |

### 2. Morphing (`x-as-{behavior}`)
Transforms an element into a complex component. The `-as-` infix is required for morphing behaviors to make the transformation explicit.

```html
<!-- Explicitly morph an article into a card -->
<article x-as-card>
  <header><h3>Title</h3></header>
  <main>Content</main>
</article>
```

| Element | Behavior | Result |
|---------|----------|--------|
| `<article>` | `card` | Morphs into card component |
| `<nav>` | `navbar` | Morphs into navigation bar |
| `<aside>` | `sidebar` | Morphs into sidebar component |

### 3. Configuration (Optional)
If the `x-` prefix conflicts with other libraries (like Alpine.js), you can change it globally.

```javascript
// In your main entry point
WB.init({
  prefix: 'b' // Changes syntax to b-ripple, b-as-card, etc.
});
```

---

## Auto Injection

Behaviors can be configured to automatically attach to standard HTML5 semantic elements. This feature is **optional** and disabled by default.

To enable, set `"autoInject": true` in your `config/site.json` or pass it to `WB.init()`.

```html
<!-- When autoInject is enabled: -->

<!-- Decorating: dialog gets backdrop and animations -->
<dialog>...</dialog>

<!-- Decorating: img gets lazy loading and lightbox -->
<img src="...">
```

### Custom Tags (Declarative)
For layouts and specific components, you can use custom `<wb-*>` tags. This provides a clean, semantic way to define structure.

```html
<!-- Declarative Layout -->
<wb-grid columns="3">
  <article>...</article>
</wb-grid>

<!-- Semantic Aliases -->
<wb-row>...</wb-row>    <!-- Horizontal Flex -->
<wb-column>...</wb-column> <!-- Vertical Stack -->
```

**Note:** `<wb-row>` is an alias for `flex` behavior and can be used anywhere to create horizontal layouts.

---

## Categories

### 1. Semantic HTML & Forms
Enhances standard HTML elements with better styling and functionality.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| [`audio`](components/semantics/audio.md) | `<audio>` | Decorate | Enhanced audio player styling |
| [`video`](components/semantics/video.md) | `<video>` | Decorate | Enhanced video player styling |
| [`img`](components/semantics/img.md) | `<img>` | **Morph** → `image` | Lazy loading, fade-in, lightbox |
| [`figure`](components/semantics/figure.md) | `<figure>` | Decorate | Figure with caption styling |
| [`table`](components/semantics/table.md) | `<table>` | Decorate | Sortable headers, striped rows |
| [`code`](components/semantics/code.md) | `<code>` | Decorate | Inline code styling |
| [`pre`](components/semantics/pre.md) | `<pre>` | Decorate | Code block with copy button |
| [`input`](components/semantics/input.md) | `<input>` | Decorate | Styled input with variants |
| [`textarea`](components/semantics/textarea.md) | `<textarea>` | Decorate | Auto-resize, counter |
| [`select`](components/semantics/select.md) | `<select>` | Decorate | Custom dropdown styling |
| [`checkbox`](components/semantics/checkbox.md) | `<input type="checkbox">` | Decorate | Custom checkbox styling |
| [`radio`](components/semantics/radio.md) | `<input type="radio">` | Decorate | Custom radio styling |
| [`button`](components/semantics/button.md) | `<button>` | Decorate | Variants, sizes, loading state |
| [`switch`](components/semantics/switch.md) | `<input type="checkbox">` | Decorate | Toggle switch UI |
| [`range`](components/semantics/range.md) | `<input type="range">` | Decorate | Custom track/thumb styling |
| [`rating`](components/semantics/rating.md) | `<div>` | - | Star rating input |
| [`form`](components/semantics/form.md) | `<form>` | Decorate | Validation UI, loading states |
| [`details`](components/semantics/details.md) | `<details>` | Decorate | Smooth expand/collapse animation |
| [`dialog`](components/semantics/dialog.md) | `<dialog>` | Decorate | Backdrop, close button, animations |

### 2. UI Components
Rich interactive components.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `hero` | `<section>` | - | Hero section component |
| [`card`](components/cards/card.md) | `<article>` | - | Card component |
| `cardlink` | `<article data-href>` | - | Clickable card |
| [`card*`](components/cards/index.md) | `<article>` | - | Card variants (image, video, etc.) |
| [`progressbar`](components/semantics/progress.md) | `<progress>` | Decorate | Progress bar styling |
| `spinner` | `<div>` | - | Loading spinner |
| `toast` | `<div>` | - | Toast notification |
| `notify` | `<div>` | - | Cycling notification |
| `badge` | `<span>` | - | Status badge |
| `chip` | `<span>` | - | Interactive chip/tag |
| `alert` | `<div>` | - | Alert message |
| `skeleton` | `<div>` | - | Loading placeholder |
| `divider` | `<hr>` | Decorate | Styled divider |
| `breadcrumb` | `<nav>` | - | Breadcrumb navigation |
| `avatar` | `<div>` | - | User avatar |
| `tooltip` | any | - | Tooltip on hover |
| `dropdown` | `<div>` | - | Dropdown menu |
| `accordion` | `<div>` | - | Accordion list |
| [`tabs`](components/tabs.md) | `<div>` | - | Tabbed interface |
| `navbar` | `<nav>` | - | Navigation bar |
| `sidebar` | `<aside>` | - | Sidebar component |
| `menu` | `<menu>` | Decorate | Menu list styling |
| `pagination` | `<nav>` | - | Pagination controls |
| `steps` | `<div>` | - | Step wizard |

### 3. Layout & Structure
Tools for arranging content.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `grid` | `<wb-grid>` | - | CSS Grid layout |
| `flex` | `<wb-flex>`, `<wb-row>` | - | Flexbox layout |
| `container` | `<wb-container>` | - | Responsive container |
| `stack` | `<wb-stack>`, `<wb-column>` | - | Vertical stack |
| `cluster` | `<wb-cluster>` | - | Horizontal cluster |
| `center` | `<wb-center>` | - | Centered content |
| `masonry` | `<wb-masonry>` | - | Masonry grid layout |
| `sticky` | `<wb-sticky>` | - | Sticky positioning |
| `scrollable` | `<div>` | - | Scrollable area |
| [`drawerLayout`](components/drawer.md) | `<wb-drawer>` | - | App layout with drawer |
| `sidebarlayout` | `<wb-sidebar>` | - | Sidebar layout |
| `switcher` | `<wb-switcher>` | - | Responsive switcher |
| `cover` | `<wb-cover>` | - | Full-screen cover |
| `frame` | `<wb-frame>` | - | Aspect ratio frame |
| `reel` | `<wb-reel>` | - | Horizontal reel |
| `icon` | `<wb-icon>` | - | Icon wrapper |
| [`draggable`](components/cards/carddraggable.md) | any | - | Draggable element |
| `resizable` | any | - | Resizable element |

### 4. Media & Overlays
Handling media content and overlaying views.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `gallery` | `<div>` | - | Image gallery |
| `youtube` | `<div>` | - | YouTube embed |
| `vimeo` | `<div>` | - | Vimeo embed |
| `carousel` | `<div>` | - | Image/Content carousel |
| `popover` | any | - | Popover content |
| [`drawer`](components/drawer.md) | `<div>` | - | Slide-out drawer |
| `lightbox` | `<img>` | - | Image lightbox |
| `offcanvas` | `<div>` | - | Off-canvas sidebar |
| `sheet` | `<div>` | - | Bottom sheet |

### 5. Utilities & Helpers
Functional utilities.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `copy` | `<button>` | - | Copy to clipboard button |
| `toggle` | any | - | Toggle visibility/state |
| `ripple` | any | - | Material ripple effect |
| `darkmode` | `<button>` | - | Dark mode toggle |
| `themecontrol` | `<div>` | - | Theme switcher |
| `lazy` | any | - | Lazy loading content |
| `print` | `<button>` | - | Print button |
| `share` | `<button>` | - | Share button |
| `fullscreen` | `<button>` | - | Fullscreen toggle |
| `scroll` | `<a>` | - | Scroll to anchor |
| `truncate` | any | - | Text truncation |
| `highlight` | `<mark>` | Decorate | Text highlighting |
| `countdown` | `<time>` | Decorate | Countdown timer |
| `clock` | `<time>` | Decorate | Live clock |
| `relativetime` | `<time>` | Decorate | "5 mins ago" format |
| `visible` | any | - | Visibility observer |
| `validator` | `<input>` | - | Input validator |
| `notes` | `<div>` | - | Notes system |
| `mdhtml` | `<div>` | - | Markdown renderer |
| `builder` | `<div>` | - | Page builder container |

### 6. Animations (Effects)
Apply animations to elements.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `animate` | any | - | Generic animation |
| `fadein` | any | - | Fade in |
| `slidein` | any | - | Slide in |
| `zoomin` | any | - | Zoom in |
| `bounce` | any | - | Bounce effect |
| `shake` | any | - | Shake effect |
| `pulse` | any | - | Pulse effect |
| `flip` | any | - | Flip effect |
| [`confetti`](components/effects/confetti.md) | any | - | Confetti explosion |
| [`sparkle`](components/effects/sparkle.md) | any | - | Sparkle effect |
| `glow` | any | - | Glow effect |
| `rainbow` | any | - | Rainbow text/bg |
| `typewriter` | any | - | Typewriter text effect |
| `parallax` | any | - | Parallax scroll effect |
| `reveal` | any | - | Scroll reveal effect |

### Quick Reference: Auto-Injection Mappings

| Element | Behavior | Type |
|---------|----------|------|
| `<img>` | [`image`](components/semantics/img.md) | Decorate |
| `<audio>` | [`audio`](components/semantics/audio.md) | Decorate |
| `<video>` | [`video`](components/semantics/video.md) | Decorate |
| `<figure>` | [`figure`](components/semantics/figure.md) | Decorate |
| `<table>` | [`table`](components/semantics/table.md) | Decorate |
| `<code>` | [`code`](components/semantics/code.md) | Decorate |
| `<pre>` | [`pre`](components/semantics/pre.md) | Decorate |
| `<input>` | [`input`](components/semantics/input.md) | Decorate |
| `<textarea>` | [`textarea`](components/semantics/textarea.md) | Decorate |
| `<select>` | [`select`](components/semantics/select.md) | Decorate |
| `<button>` | [`button`](components/semantics/button.md) | Decorate |
| `<form>` | [`form`](components/semantics/form.md) | Decorate |
| `<details>` | [`details`](components/semantics/details.md) | Decorate |
| `<dialog>` | [`dialog`](components/semantics/dialog.md) | Decorate |

---

*Document Version: 3.0.1*
