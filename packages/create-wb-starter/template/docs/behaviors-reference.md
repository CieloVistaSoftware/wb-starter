# WB-Starter Reference

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

<wb-demo>
<button x-ripple>Click Me</button>
</wb-demo>

<wb-demo>
<div x-tooltip="Hello World">Hover Me</div>
</wb-demo>

| Element | Behavior | Result |
|---------|----------|--------|
| `<button>` | `button` | Button with variants, sizes, loading state |
| `<table>` | `table` | Table with sorting, striping, hover |
| `<details>` | `details` | Details with smooth animation |
| `<dialog>` | `dialog` | Dialog with backdrop, animations |
| `<img>` | `image` | Lazy loading, fade-in, lightbox |

### 2. Morphing (`x-as-{behavior}`)
Transforms an element into a complex component. The `-as-` infix is required for morphing behaviors to make the transformation explicit.

<wb-demo>
<article x-as-card>
  <header>
    <h3>Title</h3>
  </header>
  <main>Content</main>
</article>
</wb-demo>

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

When enabled, plain semantic elements like `<dialog>` and `<img>` below get the
`dialog`/`image` behaviors attached automatically, with no `x-` attribute needed:

<wb-demo columns="1">
<p>Auto-decorated dialog (zero <code>x-</code> attributes):</p>
<dialog open>Auto-decorated dialog content.</dialog>
</wb-demo>

<wb-demo>
<img src="photo.jpg" alt="Auto-decorated image">
</wb-demo>

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

#### Live Examples

**`audio`**

<wb-demo>
<wb-audio></wb-audio>
</wb-demo>

**`video`**

<wb-demo>
<wb-video src="movie.mp4"></wb-video>
</wb-demo>

**`img` → `image`**

<wb-demo>
<img
  x-image
  src="photo.jpg"
  alt="Photo">
</wb-demo>

**`code`**

<wb-demo>
<code
  x-code
  language="Python">
  print("Hello")
</code>
</wb-demo>

**`input`**

<wb-demo>
<wb-input
  label="Email"
  input-type="email"
  placeholder="Enter your email">
</wb-input>
</wb-demo>

**`textarea`**

<wb-demo>
<wb-textarea
  label="Message"
  placeholder="Enter your message...">
</wb-textarea>
</wb-demo>

**`select`**

<wb-demo>
<wb-select
  label="Country"
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'>
</wb-select>
</wb-demo>

**`checkbox`**

<wb-demo>
<wb-checkbox label="I agree to the terms"></wb-checkbox>
</wb-demo>

**`switch`**

<wb-demo events="wb:switch:change">
<wb-switch label="Dark mode"></wb-switch>
</wb-demo>

**`rating`**

<wb-demo>
<wb-rating value="3"></wb-rating>
</wb-demo>

**`form`**

<wb-demo>
<wb-form action="/api/submit">
  <wb-input
    name="email"
    label="Email"
    required>
  </wb-input>
  <wb-button type="submit">Submit</wb-button>
</wb-form>
</wb-demo>

**`details`**

<wb-demo>
<wb-details summary="More Information">
  <p>Hidden content revealed when expanded.</p>
</wb-details>
</wb-demo>

**`dialog`**

<wb-demo>
<wb-dialog
  title="Welcome"
  id="behaviors-ref-dialog">
  <p>Dialog content goes here.</p>
</wb-dialog>
<button onclick="document.getElementById('behaviors-ref-dialog').open()">Open Dialog</button>
</wb-demo>

**`button`**

<wb-demo>
<wb-button>Click Me</wb-button>
</wb-demo>

`figure`, `table`, `pre`, `radio`, and `range` don't yet have a dedicated component doc
with a live example to pull from — tracked as remaining work, not guessed here.

### 2. UI Components
Rich interactive components.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `hero` | `<section>` | - | Hero section component |
| [`card`](components/cards/card.md) | `<article>` | - | Card component |
| `cardlink` | `<article href>` | - | Clickable card |
| [`card*`](components/cards/cards.index.md) | `<article>` | - | Card variants (image, video, etc.) |
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
| [`tooltip`](behaviors/tooltip.md) | any | - | Tooltip on hover |
| `dropdown` | `<div>` | - | Dropdown menu |
| `accordion` | `<div>` | - | Accordion list |
| [`tabs`](components/tabs.md) | `<div>` | - | Tabbed interface |
| `navbar` | `<nav>` | - | Navigation bar |
| `sidebar` | `<aside>` | - | Sidebar component |
| `menu` | `<menu>` | Decorate | Menu list styling |
| `pagination` | `<nav>` | - | Pagination controls |
| `steps` | `<div>` | - | Step wizard |

#### Live Examples

**`card`**

<wb-demo>
<wb-card title="Hello" variant="elevated">
  <p>It just works.</p>
</wb-card>
</wb-demo>

**`cardlink`**

<wb-demo>
<wb-cardlink
  title="Documentation"
  href="/docs"
  icon="📚">
</wb-cardlink>
</wb-demo>

**`progressbar`**

<wb-demo>
<wb-progress value="50"></wb-progress>
</wb-demo>

**`tooltip`**

<wb-demo>
<button x-tooltip="Tooltip text">Hover me</button>
</wb-demo>

**`tabs`**

<wb-demo events="wb:tabs:change">
<wb-tabs>
  <div tab="Tab 1">Content 1</div>
  <div tab="Tab 2">Content 2</div>
  <div tab="Tab 3">Content 3</div>
</wb-tabs>
</wb-demo>

`hero`, `card*` variants, `spinner`, `toast`, `notify`, `badge`, `chip`, `alert`,
`skeleton`, `divider`, `breadcrumb`, `avatar`, `dropdown`, `accordion`, `navbar`,
`sidebar`, `menu`, `pagination`, and `steps` don't yet have a dedicated component doc
with a live example to pull from — tracked as remaining work, not guessed here.

### 3. Layout & Structure
Tools for arranging content.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `grid` | `<wb-grid>` | - | CSS Grid layout |
| `flex` | `<wb-flex>`, `<wb-row>` | - | Flexbox layout |
| `container` | `<wb-container>` | - | Responsive container |
| [`stack`](behaviors/wb-stack.md) | `<wb-stack>`, `<wb-column>`, `[x-stack]` | - | Vertical stack |
| [`cluster`](behaviors/wb-cluster.md) | `<wb-cluster>`, `[x-cluster]` | - | Horizontal cluster |
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

#### Live Examples

**`drawerLayout`**

<wb-demo>
<wb-drawer-layout
  position="left"
  width="300px">
  <h3>Sidebar</h3>
  <nav>Navigation content...</nav>
</wb-drawer-layout>
</wb-demo>

**`draggable`**

<wb-demo>
<wb-carddraggable title="Drag Me">Drag this card around.</wb-carddraggable>
</wb-demo>

**`stack`**

<wb-demo>
<wb-stack gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</wb-stack>
</wb-demo>

<wb-demo>
<div x-stack gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</wb-demo>

**`cluster`**

<wb-demo>
<wb-cluster gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</wb-cluster>
</wb-demo>

<wb-demo>
<div x-cluster gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</wb-demo>

`grid`, `flex`, `container`, `center`, `masonry`, `sticky`, `scrollable`,
`sidebarlayout`, `switcher`, `cover`, `frame`, `reel`, `icon`, and `resizable` don't yet
have a dedicated component doc with a live example to pull from — tracked as remaining
work, not guessed here.

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

#### Live Examples

**`drawer`**

<wb-demo>
<button
  x-drawer
  title="Settings"
  content="Settings content...">
  Open Settings
</button>
</wb-demo>

`gallery`, `youtube`, `vimeo`, `carousel`, `popover`, `lightbox`, `offcanvas`, and
`sheet` don't yet have a dedicated component doc with a live example to pull from —
tracked as remaining work, not guessed here.

### 5. Utilities & Helpers
Functional utilities.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `copy` | `<button>` | - | Copy to clipboard button |
| `toggle` | any | - | Toggle visibility/state |
| `ripple` | any | - | Material ripple effect |
| `darkmode` | `<button>` | - | Dark mode toggle |
| [`themecontrol`](behaviors/wb-themecontrol.md) | `<div>` | - | Theme switcher |
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
| [`mdhtml`](components/mdhtml.md) | `<div>` | - | Markdown renderer |
| `builder` | `<div>` | - | Page builder container |

#### Live Examples

**`themecontrol`**

<wb-demo>
<wb-themecontrol></wb-themecontrol>
</wb-demo>

**`mdhtml`**

<wb-demo>
<wb-mdhtml> # Hello World This is **bold** and *italic*. </wb-mdhtml>
</wb-demo>

`copy`, `toggle`, `ripple`, `darkmode`, `lazy`, `print`, `share`, `fullscreen`,
`scroll`, `truncate`, `highlight`, `countdown`, `clock`, `relativetime`, `visible`,
`validator`, `notes`, and `builder` don't yet have a dedicated component doc with a
live example to pull from — tracked as remaining work, not guessed here.

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
| `sparkle` | any | - | Sparkle effect |
| `glow` | any | - | Glow effect |
| `rainbow` | any | - | Rainbow text/bg |
| `typewriter` | any | - | Typewriter text effect |
| `parallax` | any | - | Parallax scroll effect |
| `reveal` | any | - | Scroll reveal effect |

#### Live Examples

**`confetti`**

<wb-demo>
<wb-confetti
  count="100"
  label="Celebrate!">
</wb-confetti>
</wb-demo>

`animate`, `fadein`, `slidein`, `zoomin`, `bounce`, `shake`, `pulse`, `flip`,
`sparkle`, `glow`, `rainbow`, `typewriter`, `parallax`, and `reveal` don't yet have a
dedicated component doc with a live example to pull from — tracked as remaining work,
not guessed here.

## Events

Wiring up a control (`x-toast`, `x-search`, `<wb-tabs>`, …) is only half the story — most
behaviors also **fire a real, bubbling `CustomEvent`** the moment something happens
(a click, a debounced keystroke, a drag ending). Every event below was verified against
the current source in `src/wb-viewmodels/` — the name, what triggers it, and its
`detail` payload all come straight from the `dispatchEvent(new CustomEvent(...))` call
that fires it, not from guesswork.

### How to listen

Because every `wb:*` event **bubbles**, you don't need a reference to the exact element —
listen on the control itself, or on any ancestor (including `document`):

```javascript
// On the control itself
document.querySelector('[x-copy]').addEventListener('wb:copy:success', (e) => {
  console.log('Copied:', e.detail.text);
});

// Or on an ancestor — bubbling means one listener can catch many instances
document.addEventListener('wb:search', (e) => {
  console.log('Search query:', e.detail.query);
});
```

### Full event inventory

Events that fire with **no `detail`** are listed with `—`. `component.md` docs marked in
the last column carry the authoritative per-component write-up (full attribute list,
schema, styling) — this table is the cross-behavior index.

**Buttons, toggles & selection**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:toggle` | `toggle.js` (`x-toggle`) | mousedown/touch/Enter/Space on the toggle | `{ active, targets, class }` |
| `wb:switch:change` | `semantics/switch.js` (`<wb-switch>`) | the switch is flipped | `{ checked }` |
| `wb:rating:change` | `semantics/rating.js` (`<wb-rating>`) | a star/icon is clicked | `{ value }` |
| `wb:stepper:change` | `stepper.js` (`x-stepper`) | the `+`/`-` buttons change the value | `{ value }` |
| `wb:colorpicker:change` | `colorpicker.js` (`x-colorpicker`) | a color is picked | `{ value }` |
| `wb:autocomplete:select` | `autocomplete.js` (`x-autocomplete`) | a suggestion is chosen | `{ value }` |
| `wb:file:change` | `file.js` (`x-file`) | the native file input changes | `{ files }` |
| `wb:otp:input` | `otp.js` | a digit is typed into an OTP field | `{ value }` |
| `wb:otp:complete` | `enhancements.js` (OTP auto-enhance) | every OTP digit is filled | `{ value }` |
| `wb:validator:validate` | `validator.js` (`x-validator`) | the form's `validate()` runs | `{ valid }` |

**Feedback**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:toast:show` | `feedback.js` (`x-toast`) | the toast trigger is clicked | `{ message, variant }` |
| `wb:notify:show` | `feedback.js` (`x-notify`) | clicked (cycles info→success→warning→error each click) | `{ message, variant }` |
| `wb:chip:remove` | `feedback.js` (chip) | a chip's remove (×) button is clicked | `—` |
| `wb:copy:success` | `copy.js` (`x-copy`) | text is copied to the clipboard | `{ text }` |
| `wb:copy:error` | `copy.js` (`x-copy`) | the clipboard write fails | `{ error }` |

**Overlays & dialogs**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:confirm:ok` | `overlay.js` (`x-confirm`) | the confirm dialog's OK button is clicked | `—` |
| `wb:confirm:cancel` | `overlay.js` (`x-confirm`) | the confirm dialog's Cancel button is clicked | `—` |
| `wb:prompt:ok` | `overlay.js` (`x-prompt`) | the prompt dialog's OK button (or Enter) is used | `{ value }` |
| `wb:prompt:cancel` | `overlay.js` (`x-prompt`) | the prompt dialog's Cancel button (or Escape) is used | `—` |
| `wb:dialog:ok` | `semantics/dialog.js` (`<dialog>`) | the dialog's confirm button is clicked | `—` |
| `wb:notes:open` / `wb:notes:close` | `notes.js` | the notes panel opens/closes | `—` |
| `wb:notes:save` | `notes.js` | a note is saved | `{ path, data, newNote }` |
| `wb:notes:position` | `notes.js` | the notes panel is moved | `{ position }` |

**Navigation**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:tabs:change` | `tabs.js` (`<wb-tabs>`) | a tab is clicked | `{ index, title }` |
| `wb:menu:select` | `navigation.js` (`x-menu`) | a menu item is clicked | `{ index, label, value }` |
| `wb:pagination:change` | `navigation.js` (`x-pagination`) | a page control is clicked | `{ page }` |
| `wb:dropdown:select` | `dropdown.js` (`x-dropdown`) | a dropdown item is chosen | `{ value, href }` |
| `wb:details:toggle` | `semantics/details.js` (`<details>`) | the element opens/closes | `{ open }` |
| `wb:collapse:toggle` | `collapse.js` (`x-collapse`) | the collapsible region opens/closes | `{ open }` |
| `wb:accordion:toggle` | `collapse.js` (accordion) | an accordion item opens/closes | `{ open, title }` |
| `wb:accordion:ready` | `collapse.js` (accordion) | the accordion finishes initializing | `{ items }` |

**Search**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:search` | `search.js` (`x-search`) | debounced as-you-type, or instantly on clear/`instant` config | `{ query, instant }` |
| `wb:search:clear` | `search.js` | the clear (×) button is clicked | `—` |
| `wb:search:focus` / `wb:search:blur` | `search.js` | the input gains/loses focus | `—` |
| `wb:search:navigate` | `search.js` | Arrow Up/Down is pressed | `{ direction }` |
| `wb:search:select` | `search.js` | Enter is pressed | `{ query }` |
| `wb:search:escape` | `search.js` | Escape is pressed | `—` |

**Forms** — `wb:form:submit` / `wb:form:success` / `wb:form:error` fire from **two**
independent implementations, so the exact `detail` shape depends on which one enhanced
your form: the `<wb-form ajax>` component (`form.js`: `{ formData }` / `{ data }` /
`{ error }`) and native `<form x-form>` auto-enhancement (`semantics/form.js` /
`enhancements.js`: `{ response }` / `{ error }`). See
[components/semantics/form.md](components/semantics/form.md) for the authoritative,
per-implementation breakdown.

**Cards**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:cardbutton:primary` | `card.js` | a card's primary footer button is clicked | `{ label }` |
| `wb:cardbutton:secondary` | `card.js` | a card's secondary footer button is clicked | `{ label }` |
| `wb:cardproduct:addtocart` | `card.js` (`wb-cardproduct`) | "Add to Cart" is clicked | `{ title, ... }` |
| `wb:cardnotification:dismiss` | `card.js` (`wb-cardnotification`) | a notification card is dismissed | `{ variant, title }` |
| `wb:cardexpandable:toggle` | `card.js` (`wb-cardexpandable`) | the card expands/collapses | `{ expanded }` |
| `wb:cardminimizable:toggle` | `card.js` (`wb-cardminimizable`) | the card minimizes/restores | `{ minimized }` |
| `wb:carddraggable:dragstart/drag/dragend` | `card.js` (`wb-carddraggable`) | a draggable card starts/moves/finishes dragging | `{ x, y }` |
| `wb:cardstats:hydrated` | `card.js` (`wb-cardstats`) | stats card finishes initializing (test hook) | `—` |

**Media, layout & effects**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:lazy:loaded` | `helpers.js` (lazy loading) | a lazy image/element finishes loading | `{ src }` |
| `wb:hotkey:triggered` | `helpers.js` (`x-hotkey`) | the configured key combo is pressed | `{ key }` |
| `wb:countdown:complete` | `helpers.js` (`x-countdown`) | the countdown reaches zero | `—` |
| `wb:sticky:stuck` / `wb:sticky:unstuck` | `sticky.js` | a sticky element becomes stuck/unstuck | `{ offset }` / `—` |
| `wb:resize:start/move/end` | `resizable.js` (`x-resizable`) | a resize handle is pressed/dragged/released | `{ width, height }` |
| `wb:drag:start/move/end` | `draggable.js` (`x-draggable`) | a draggable element is picked up/moved/dropped | `{ x, y }` |
| `wb:reorder` | `move.js` | drag-reordering a list drops a new order | `{ items }` |
| `wb:darkmode:toggle` | `darkmode.js` (`x-darkmode`) | the dark-mode button is clicked | `{ theme }` |
| `wb:darkmode:applied` | `darkmode.js` | a theme is applied (incl. on page load) | `{ theme }` |
| `wb:theme:change` | `themecontrol.js` (`<wb-themecontrol>`) | a theme is selected | `{ theme, name }` |
| `wb:tags:add` / `wb:tags:remove` | `tags.js` (`x-tags`) | a tag is added/removed | `{ tag }` |
| `wb:table:select` | `semantics/table.js` (`<table>`) | a row is clicked | `{ row, index }` |
| `wb:code:copy` | `semantics/code.js` (`<pre>`/`<code>`) | the code block's copy button is clicked | `{ text }` |
| `wb:mdhtml:loaded` | `mdhtml.js` (`x-mdhtml`) | Markdown finishes rendering | `{ src, length }` |
| `wb:mdhtml:error` | `mdhtml.js` | the Markdown fetch/render fails | `{ src, error }` |
| `wb:mdhtml:hydrated` | `mdhtml.js` | Markdown DOM is inserted (test hook) | `—` |

### Listening for the most-used events

A few worked examples for the behaviors developers reach for most often. Each snippet is
real, runnable code — copy it, swap the selector, done.

**Toast** — `x-toast` fires once per click, right after the toast is shown:

```javascript
document.querySelectorAll('[x-toast]').forEach((button) => {
  button.addEventListener('wb:toast:show', (e) => {
    console.log(`Toast shown: "${e.detail.message}" (${e.detail.variant})`);
  });
});
```

**Copy** — `x-copy` fires success or error, never both:

```javascript
document.querySelectorAll('[x-copy]').forEach((button) => {
  button.addEventListener('wb:copy:success', (e) => {
    console.log('Copied to clipboard:', e.detail.text);
  });
  button.addEventListener('wb:copy:error', (e) => {
    console.error('Copy failed:', e.detail.error);
  });
});
```

**Tabs** — `<wb-tabs>` fires on every tab change, including the initial selection:

```javascript
document.querySelector('wb-tabs').addEventListener('wb:tabs:change', (e) => {
  console.log(`Switched to tab ${e.detail.index}: "${e.detail.title}"`);
});
```

**Search** — `x-search` debounces `wb:search` while typing; `instant` tells you whether
this fire was a debounced keystroke or an immediate clear:

```javascript
document.querySelector('[x-search]').addEventListener('wb:search', (e) => {
  const { query, instant } = e.detail;
  if (!query) return console.log('Search cleared');
  console.log(`Searching for "${query}" (instant: ${instant})`);
});
```

**Confirm & Prompt** — both fire an `:ok` or `:cancel` event; only `x-prompt`'s `:ok`
carries a `detail`:

```javascript
document.querySelector('[x-confirm]').addEventListener('wb:confirm:ok', () => {
  console.log('User confirmed — proceed with the action');
});
document.querySelector('[x-confirm]').addEventListener('wb:confirm:cancel', () => {
  console.log('User cancelled');
});

document.querySelector('[x-prompt]').addEventListener('wb:prompt:ok', (e) => {
  console.log('User entered:', e.detail.value);
});
```

**Card buttons** — every card's footer buttons fire a namespaced event with the button's
label, so one listener can distinguish which card and which button fired:

```javascript
document.querySelectorAll('wb-card, wb-cardproduct, wb-cardnotification').forEach((card) => {
  card.addEventListener('wb:cardbutton:primary', (e) => {
    console.log('Primary button clicked:', e.detail.label);
  });
  card.addEventListener('wb:cardbutton:secondary', (e) => {
    console.log('Secondary button clicked:', e.detail.label);
  });
});
```

Every component's own doc under `components/` also documents its events in an "Events"
section with the full attribute/schema context — e.g.
[components/semantics/details.md](components/semantics/details.md),
[components/cards/cardproduct.md](components/cards/cardproduct.md),
[components/tabs.md](components/tabs.md), and [search.md](search.md). This section exists
so you don't have to open a dozen files to see what's available across the whole library.

---

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

*Document Version: 3.2.0*
