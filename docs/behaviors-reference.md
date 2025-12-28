# WB Behaviors Reference

This document lists all available behaviors in the WB Behaviors, categorized by function.

## Usage

### Auto Injection (Preview)
Behaviors are automatically attached to standard HTML5 semantic elements. This is the recommended way to use WB Behaviors.

```html
<!-- Automatically becomes a Card -->
<article>...</article>

<!-- Automatically becomes a Navigation Bar -->
<nav>...</nav>
```

### Explicit Injection (Legacy)
You can also apply any behavior by adding the `data-wb` attribute to an HTML element:

```html
<div data-wb="behavior-name" data-option="value"></div>
```

You can combine multiple behaviors:

```html
<div data-wb="card animate" data-animation="fadein"></div>
```

## Categories

### 1. Semantic HTML & Forms
Enhances standard HTML elements with better styling and functionality.

| Behavior | Description | Semantic Element (Auto) | Usage (Explicit) |
|----------|-------------|-------------------------|------------------|
| `audio` | Enhanced audio player | `<audio>` | `<audio data-wb="audio">` |
| `video` | Enhanced video player | `<video>` | `<video data-wb="video">` |
| `img` | Enhanced image with lazy loading | `<img>` | `<img data-wb="img">` |
| `figure` | Figure with caption support | `<figure>` | `<figure data-wb="figure">` |
| `table` | Sortable, responsive tables | `<table>` | `<table data-wb="table">` |
| `code` | Inline code styling | `<code>` | `<code data-wb="code">` |
| `pre` | Code block with copy button | `<pre>` | `<pre data-wb="pre">` |
| `input` | Styled input field | `<input>` | `<input data-wb="input">` |
| `textarea` | Styled textarea | `<textarea>` | `<textarea data-wb="textarea">` |
| `select` | Custom select dropdown | `<select>` | `<select data-wb="select">` |
| `checkbox` | Custom checkbox | `<input type="checkbox">` | `<input type="checkbox" data-wb="checkbox">` |
| `radio` | Custom radio button | `<input type="radio">` | `<input type="radio" data-wb="radio">` |
| `button` | Styled button with states | `<button>` | `<button data-wb="button">` |
| `switch` | Toggle switch | - | `<input type="checkbox" data-wb="switch">` |
| `range` | Range slider | `<input type="range">` | `<input type="range" data-wb="range">` |
| `rating` | Star rating input | - | `<div data-wb="rating">` |
| `form` | Form validation and handling | `<form>` | `<form data-wb="form">` |
| `details` | Animated details/summary | `<details>` | `<details data-wb="details">` |
| `dialog` | Dialog/Modal trigger | `<dialog>` | `<button data-wb="dialog">` |

### 2. UI Components
Rich interactive components.

| Behavior | Description | Semantic Element (Auto) | Usage (Explicit) |
|----------|-------------|-------------------------|------------------|
| `hero` | Hero section component | - | `<section data-wb="hero">` |
| `card` | Versatile card component | `<article>` | `<div data-wb="card">` |
| `card*` | Card variants (image, video, etc.) | - | `<div data-wb="cardimage">` |
| `progressbar` | Progress bar | `<progress>` | `<div data-wb="progressbar">` |
| `spinner` | Loading spinner | - | `<div data-wb="spinner">` |
| `toast` | Toast notification | `<output>` | `<div data-wb="toast">` |
| `notify` | Cycling notification | - | `<div data-wb="notify">` |
| `badge` | Status badge | - | `<span data-wb="badge">` |
| `chip` | Interactive chip/tag | - | `<span data-wb="chip">` |
| `alert` | Alert message | - | `<div data-wb="alert">` |
| `skeleton` | Loading placeholder | - | `<div data-wb="skeleton">` |
| `divider` | Styled divider | `<hr>` | `<hr data-wb="divider">` |
| `breadcrumb` | Breadcrumb navigation | - | `<nav data-wb="breadcrumb">` |
| `avatar` | User avatar | - | `<div data-wb="avatar">` |
| `tooltip` | Tooltip on hover | - | `<span data-wb="tooltip" title="Hi">` |
| `dropdown` | Dropdown menu | - | `<div data-wb="dropdown">` |
| `accordion` | Accordion list | - | `<div data-wb="accordion">` |
| `tabs` | Tabbed interface | - | `<div data-wb="tabs">` |
| `navbar` | Navigation bar | `<nav>` | `<nav data-wb="navbar">` |
| `sidebar` | Sidebar navigation | `<aside>` | `<aside data-wb="sidebar">` |
| `menu` | Menu list | `<menu>` | `<ul data-wb="menu">` |
| `pagination` | Pagination controls | - | `<nav data-wb="pagination">` |
| `steps` | Step wizard | - | `<div data-wb="steps">` |

### 3. Layout & Structure
Tools for arranging content.

| Behavior | Description | Semantic Element (Auto) | Usage (Explicit) |
|----------|-------------|-------------------------|------------------|
| `grid` | CSS Grid layout | - | `<div data-wb="grid">` |
| `flex` | Flexbox layout | - | `<div data-wb="flex">` |
| `container` | Responsive container | - | `<div data-wb="container">` |
| `stack` | Vertical stack | - | `<div data-wb="stack">` |
| `cluster` | Horizontal cluster | - | `<div data-wb="cluster">` |
| `center` | Centered content | - | `<div data-wb="center">` |
| `masonry` | Masonry grid layout | - | `<div data-wb="masonry">` |
| `sticky` | Sticky positioning | - | `<div data-wb="sticky">` |
| `scrollable` | Scrollable area | - | `<div data-wb="scrollable">` |
| `drawerLayout` | App layout with drawer | - | `<div data-wb="drawerLayout">` |
| `draggable` | Draggable element | - | `<div data-wb="draggable">` |
| `resizable` | Resizable element | - | `<div data-wb="resizable">` |

### 4. Media & Overlays
Handling media content and overlaying views.

| Behavior | Description | Semantic Element (Auto) | Usage (Explicit) |
|----------|-------------|-------------------------|------------------|
| `gallery` | Image gallery | - | `<div data-wb="gallery">` |
| `youtube` | YouTube embed | - | `<div data-wb="youtube" data-id="...">` |
| `vimeo` | Vimeo embed | - | `<div data-wb="vimeo" data-id="...">` |
| `carousel` | Image/Content carousel | - | `<div data-wb="carousel">` |
| `popover` | Popover content | - | `<button data-wb="popover">` |
| `drawer` | Slide-out drawer | - | `<div data-wb="drawer">` |
| `lightbox` | Image lightbox | - | `<a data-wb="lightbox">` |
| `offcanvas` | Off-canvas sidebar | - | `<div data-wb="offcanvas">` |
| `sheet` | Bottom sheet | - | `<div data-wb="sheet">` |

### 5. Utilities & Helpers
Functional utilities.

| Behavior | Description | Semantic Element (Auto) | Usage (Explicit) |
|----------|-------------|-------------------------|------------------|
| `copy` | Copy to clipboard button | - | `<button data-wb="copy">` |
| `toggle` | Toggle visibility/state | - | `<button data-wb="toggle">` |
| `ripple` | Material ripple effect | - | `<button data-wb="ripple">` |
| `darkmode` | Dark mode toggle/enforcer | - | `<div data-wb="darkmode">` |
| `themecontrol` | Theme switcher | - | `<div data-wb="themecontrol">` |
| `lazy` | Lazy loading content | - | `<div data-wb="lazy">` |
| `print` | Print button | - | `<button data-wb="print">` |
| `share` | Share button | - | `<button data-wb="share">` |
| `fullscreen` | Fullscreen toggle | - | `<button data-wb="fullscreen">` |
| `scroll` | Scroll to anchor | - | `<a data-wb="scroll">` |
| `truncate` | Text truncation | - | `<p data-wb="truncate">` |
| `highlight` | Text highlighting | `<mark>` | `<span data-wb="highlight">` |
| `countdown` | Countdown timer | `<time>` | `<div data-wb="countdown">` |
| `clock` | Live clock | `<time>` | `<div data-wb="clock">` |
| `relativetime` | "5 mins ago" format | `<time>` | `<time data-wb="relativetime">` |
| `visible` | Visibility observer | - | `<div data-wb="visible">` |
| `validator` | Input validator | - | `<input data-wb="validator">` |
| `notes` | Notes system | - | `<div data-wb="notes">` |
| `mdhtml` | Markdown renderer | - | `<div data-wb="mdhtml">` |
| `builder` | Page builder container | - | `<div data-wb="builder">` |

### 6. Animations (Effects)
Apply animations to elements.

| Behavior | Description | Semantic Element (Auto) | Usage (Explicit) |
|----------|-------------|-------------------------|------------------|
| `animate` | Generic animation | - | `<div data-wb="animate" data-effect="...">` |
| `fadein` | Fade in | - | `<div data-wb="fadein">` |
| `slidein` | Slide in | - | `<div data-wb="slidein">` |
| `zoomin` | Zoom in | - | `<div data-wb="zoomin">` |
| `bounce` | Bounce effect | - | `<div data-wb="bounce">` |
| `shake` | Shake effect | - | `<div data-wb="shake">` |
| `pulse` | Pulse effect | - | `<div data-wb="pulse">` |
| `flip` | Flip effect | - | `<div data-wb="flip">` |
| `confetti` | Confetti explosion | - | `<button data-wb="confetti">` |
| `sparkle` | Sparkle effect | - | `<span data-wb="sparkle">` |
| `glow` | Glow effect | - | `<div data-wb="glow">` |
| `rainbow` | Rainbow text/bg | - | `<span data-wb="rainbow">` |
| `typewriter` | Typewriter text effect | - | `<span data-wb="typewriter">` |
| `parallax` | Parallax scroll effect | - | `<div data-wb="parallax">` |
| `reveal` | Scroll reveal effect | - | `<div data-wb="reveal">` |

---
*Generated automatically from `src/behaviors/index.js`*
