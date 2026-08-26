# WB-Starter Reference

> **This is the cross-behavior INDEX, not the per-behavior documentation.**
> Every behavior now has its own page, generated from its schema, at
> `docs/behaviors/<name>.md` — e.g. [button](behaviors/button.md),
> [ripple](behaviors/ripple.md), [tooltip](behaviors/tooltip.md). Each of those
> pages opens by stating which of the two behavior types it is (decorates a
> semantic element vs. adds a new capability) and how to write it. Go there for
> attributes, events and examples; this page is for *browsing what exists* and
> for the shared syntax/auto-injection/event rules below.
>
> Reach this page from an `x-demo` 📖 badge? That means the behavior has no
> page of its own yet — find its row in the tables below (#842).

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

<div x-demo>
<button x-ripple>Click Me</button>
</div>

<div x-demo>
<div x-tooltip="Hello World">Hover Me</div>
</div>

| Element | Behavior | Result |
|---------|----------|--------|
| `<button>` | `button` | Button with variants, sizes, loading state |
| `<table>` | `table` | Table with sorting, striping, hover |
| `<details>` | `details` | Details with smooth animation |
| `<dialog>` | `dialog` | Dialog with backdrop, animations |
| `<img>` | `image` | Lazy loading, fade-in, lightbox |

### 2. Morphing (`x-as-{behavior}`) — REMOVED (#783)

There is no `-as-` infix any more. A behavior that builds out a component's
internals is applied exactly like any other: the attribute name **is** the
behavior name, and on a semantic element it is injected for you.

<div x-demo>
<article x-card>
  <header>
    <h3>Title</h3>
  </header>
  <main>Content</main>
</article>
</div>

| Element | Behavior | Written as |
|---------|----------|------------|
| `<article>` | `card` | `<article>` (auto-injected) or `<div x-card>` |
| `<nav>` | `navbar` | `<nav>` (auto-injected) or `<div x-navbar>` |
| `<aside>` | `sidebar` | `<aside>` (auto-injected) or `<div x-sidebar>` |

### 3. Configuration (Optional)
If the `x-` prefix conflicts with other libraries (like Alpine.js), you can change it globally.

```javascript
// In your main entry point
WB.init({
  prefix: 'b' // Changes syntax to b-ripple, b-card, etc.
});
```

---

## Auto Injection

Behaviors can be configured to automatically attach to standard HTML5 semantic elements. This feature is **optional** and disabled by default.

To enable, set `"autoInject": true` in your `config/site.json` or pass it to `WB.init()`.

When enabled, plain semantic elements like `<dialog>` and `<img>` below get the
`dialog`/`image` behaviors attached automatically, with no `x-` attribute needed:

<div x-demo columns="1">
<p>Auto-decorated dialog (zero <code>x-</code> attributes):</p>
<dialog open>Auto-decorated dialog content.</dialog>
</div>

<div x-demo>
<img src="https://placehold.co/600x400/1e293b/e2e8f0?text=Photo" alt="Auto-decorated image">
</div>

---

## Categories

### 1. Semantic HTML & Forms
Enhances standard HTML elements with better styling and functionality.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| [`audio`](behaviors/audio.md) | `<audio>` | Decorate | Enhanced audio player styling |
| [`video`](behaviors/video.md) | `<video>` | Decorate | Enhanced video player styling |
| [`img`](behaviors/img.md) | `<img>` | **Morph** → `image` | Lazy loading, fade-in, lightbox |
| [`figure`](behaviors/figure.md) | `<figure>` | Decorate | Figure with caption styling |
| [`table`](behaviors/table.md) | `<table>` | Decorate | Sortable headers, striped rows |
| [`code`](behaviors/code.md) | `<code>` | Decorate | Inline code styling |
| [`pre`](behaviors/pre.md) | `<pre>` | Decorate | Code block with copy button |
| [`input`](behaviors/input.md) | `<input>` | Decorate | Styled input with variants |
| [`textarea`](behaviors/textarea.md) | `<textarea>` | Decorate | Auto-resize, counter |
| [`select`](behaviors/select.md) | `<select>` | Decorate | Custom dropdown styling |
| [`checkbox`](behaviors/checkbox.md) | `<input type="checkbox">` | Decorate | Custom checkbox styling |
| [`radio`](behaviors/radio.md) | `<input type="radio">` | Decorate | Custom radio styling |
| [`button`](behaviors/button.md) | `<button>` | Decorate | Variants, sizes, loading state |
| [`switch`](behaviors/switch.md) | `<input type="checkbox">` | Decorate | Toggle switch UI |
| [`range`](behaviors/range.md) | `<input type="range">` | Decorate | Custom track/thumb styling |
| [`rating`](behaviors/rating.md) | `<div>` | - | Star rating input |
| [`form`](behaviors/form.md) | `<form>` | Decorate | Validation UI, loading states |
| [`details`](behaviors/details.md) | `<details>` | Decorate | Smooth expand/collapse animation |
| [`dialog`](behaviors/dialog.md) | `<dialog>` | Decorate | Backdrop, close button, animations |

#### Live Examples

**`audio`**

<div x-demo>
<audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
</div>

**`video`**

<div x-demo>
<video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"></video>
</div>

**`img` → `image`**

<div x-demo>
<img
  src="https://placehold.co/600x400/1e293b/e2e8f0?text=Photo"
  alt="Photo">
</div>

**`code`**

<div x-demo>
<code
  language="Python">
  print("Hello")
</code>
</div>

**`input`**

<div x-demo>
<div x-input
  label="Email"
  input-type="email"
  placeholder="Enter your email">
</input>
</div>

**`textarea`**

<div x-demo>
<textarea
  label="Message"
  placeholder="Enter your message...">
</textarea>
</div>

**`select`**

<div x-demo>
<select
  label="Country"
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'>
</select>
</div>

**`checkbox`**

<div x-demo>
<div x-checkbox label="I agree to the terms"></input>
</div>

**`switch`**

<div x-demo events="wb:switch:change">
<div x-switch label="Dark mode"></div>
</div>

**`rating`**

<div x-demo>
<span x-rating value="3"></div>
</div>

**`form`**

<div x-demo>
<form action="/api/submit">
  <div x-input
    name="email"
    label="Email"
    required>
  </input>
  <button type="submit">Submit</button>
</form>
</div>

**`details`**

<div x-demo>
<details summary="More Information">
  <p>Hidden content revealed when expanded.</p>
</details>
</div>

**`dialog`**

<div x-demo>
<dialog
  title="Welcome"
  id="behaviors-ref-dialog">
  <p>Dialog content goes here.</p>
</dialog>
<button onclick="document.getElementById('behaviors-ref-dialog').showModal()">Open Dialog</button>
</div>

**`button`**

<div x-demo>
<button>Click Me</button>
</div>

`figure`, `table`, `pre`, `radio`, and `range` don't yet have a dedicated component doc
with a live example to pull from — tracked as remaining work, not guessed here.

### 2. UI Components
Rich interactive components.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `hero` | `<section>` | - | Hero section component |
| [`card`](card.md) | `<article>` | - | Card component |
| `cardlink` | `<article href>` | - | Clickable card |
| `card*` | `<article>` | - | Card variants — [cardimage](behaviors/cardimage.md), [cardvideo](behaviors/cardvideo.md), [cardpricing](behaviors/cardpricing.md), [cardprofile](behaviors/cardprofile.md), … one page each under `docs/behaviors/` |
| [`progressbar`](behaviors/progress.md) | `<progress>` | Decorate | Progress bar styling |
| `spinner` | `<div>` | - | Loading spinner |
| [`toast`](behaviors/toast.md) | `<div>` | - | Toast notification |
| `notify` | `<div>` | - | Cycling notification |
| `badge` | `<span>` | - | Status badge |
| [`chip`](behaviors/chip.md) | `<span>` | - | Interactive chip/tag |
| `alert` | `<div>` | - | Alert message |
| [`skeleton`](behaviors/skeleton.md) | `<div>` | - | Loading placeholder |
| `divider` | `<hr>` | Decorate | Styled divider |
| `breadcrumb` | `<nav>` | - | Breadcrumb navigation |
| `avatar` | `<div>` | - | User avatar |
| [`tooltip`](behaviors/tooltip.md) | any | - | Tooltip on hover |
| [`dropdown`](behaviors/dropdown.md) | `<div>` | - | Dropdown menu |
| [`accordion`](behaviors/accordion.md) | `<div>` | - | Accordion list (deprecated — prefer `<details>`) |
| [`tabs`](behaviors/tabs.md) | `<div>` | - | Tabbed interface |
| `navbar` | `<nav>` | - | Navigation bar |
| `sidebar` | `<aside>` | - | Sidebar component |
| `menu` | `<menu>` | Decorate | Menu list styling |
| `pagination` | `<nav>` | - | Pagination controls |
| `steps` | `<div>` | - | Step wizard |

#### Live Examples

**`card`**

<div x-demo>
<article title="Hello" variant="elevated">
  <p>It just works.</p>
</article>
</div>

**`cardlink`**

<div x-demo>
<div x-cardlink
  title="Documentation"
  href="/docs"
  icon="📚">
</div>
</div>

**`progressbar`**

<div x-demo>
<progress value="50"></progress>
</div>

**`tooltip`**

<div x-demo>
<button x-tooltip="Tooltip text">Hover me</button>
</div>

**`tabs`**

<div x-demo events="wb:tabs:change">
<nav x-tabs>
  <div tab="Tab 1">Content 1</div>
  <div tab="Tab 2">Content 2</div>
  <div tab="Tab 3">Content 3</div>
</nav>
</div>

**`toast`**

<div x-demo>
<button x-toast message="Saved!" toast-variant="success">Show toast</button>
</div>

**`chip`**

<div x-demo>
<span x-chip label="Removable" variant="info" dismissible></span>
</div>

**`skeleton`**

<div x-demo>
<div x-skeleton variant="text" lines="3"></div>
</div>

**`dropdown`**

<div x-demo>
<button x-dropdown items="Profile,Settings,Logout" label="Account"></button>
</div>

**`accordion`**

<div x-demo>
<div x-accordion>
  <div accordion-title="What is wb-starter?">A schema-first, no-build website starter kit.</div>
  <div accordion-title="Is x-accordion recommended?">No, prefer the native details/summary element for new markup.</div>
</div>
</div>

`hero`, `card*` variants, `spinner`, `notify`, `badge`, `alert`, `divider`,
`breadcrumb`, `avatar`, `navbar`, `sidebar`, `menu`, `pagination`, and `steps`
don't yet have a dedicated component doc with a live example to pull from —
tracked as remaining work, not guessed here.

### 3. Layout & Structure
Tools for arranging content.

| Behavior | Element | Type | Description |
|----------|---------|------|-------------|
| `grid` | `<div x-grid>` | - | CSS Grid layout |
| `flex` | `<div x-flex>`, `<div x-flex>` | - | Flexbox layout |
| `container` | `<div x-container>` | - | Responsive container |
| [`articles`](behaviors/articles.md) | `<div x-articles>`, `[x-articles]` | - | Grid/list/masonry wrapper for article-like children |
| [`stack`](behaviors/stack.md) | `<div x-stack>`, `<div x-stack>`, `[x-stack]` | - | Vertical stack |
| [`cluster`](behaviors/cluster.md) | `<div x-cluster>`, `[x-cluster]` | - | Horizontal cluster |
| `center` | `<div x-center>` | - | Centered content |
| `masonry` | `<div x-masonry>` | - | Masonry grid layout |
| `sticky` | `<div x-sticky>` | - | Sticky positioning |
| `scrollable` | `<div>` | - | Scrollable area |
| [`fill`](behaviors/fill.md) | `[x-fill]` | - | As wide as the container allows — picks flex/grid/block sizing from the parent |
| [`drawerLayout`](behaviors/drawer.md) | `<div x-drawer>` | - | App layout with drawer |
| `sidebarlayout` | `<div x-sidebarlayout>` | - | Sidebar layout |
| `switcher` | `<div x-switcher>` | - | Responsive switcher |
| `cover` | `<div x-cover>` | - | Full-screen cover |
| `frame` | `<div x-frame>` | - | Aspect ratio frame |
| `reel` | `<div x-reel>` | - | Horizontal reel |
| `icon` | `<span x-icon>` | - | Icon wrapper |
| [`draggable`](behaviors/carddraggable.md) | any | - | Draggable element |
| `resizable` | any | - | Resizable element |

#### Live Examples

**`drawerLayout`**

<div x-demo>
<div x-drawer-layout
  position="left"
  width="300px">
  <h3>Sidebar</h3>
  <nav>Navigation content...</nav>
</div>
</div>

**`draggable`**

<div x-demo>
<div x-carddraggable title="Drag Me">Drag this card around.</div>
</div>

**`stack`**

<div x-demo>
<div x-stack gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</div>

<div x-demo>
<div x-stack gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</div>

**`cluster`**

<div x-demo>
<div x-cluster gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</div>

<div x-demo>
<div x-cluster gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
</div>

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
| [`drawer`](behaviors/drawer.md) | `<div>` | - | Slide-out drawer |
| `lightbox` | `<img>` | - | Image lightbox |
| `offcanvas` | `<div>` | - | Off-canvas sidebar |
| `sheet` | `<div>` | - | Bottom sheet |

#### Live Examples

**`drawer`**

<div x-demo>
<button
  x-drawer
  title="Settings"
  content="Settings content...">
  Open Settings
</button>
</div>

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
| [`themecontrol`](behaviors/themecontrol.md) | `<div>` | - | Theme switcher |
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
| [`mdhtml`](behaviors/mdhtml.md) | `<div>` | - | Markdown renderer |
| `builder` | `<div>` | - | Page builder container |

#### Live Examples

**`themecontrol`**

<div x-demo>
<div x-themecontrol></div>
</div>

**`mdhtml`**

<div x-demo>
<div x-mdhtml> # Hello World This is **bold** and *italic*. </div>
</div>

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
| [`confetti`](behaviors/confetti.md) | any | - | Confetti explosion |
| `sparkle` | any | - | Sparkle effect |
| `glow` | any | - | Glow effect |
| `rainbow` | any | - | Rainbow text/bg |
| `typewriter` | any | - | Typewriter text effect |
| `parallax` | any | - | Parallax scroll effect |
| `reveal` | any | - | Scroll reveal effect |

#### Live Examples

**`confetti`**

<div x-demo>
<div x-confetti
  count="100"
  label="Celebrate!">
</div>
</div>

`animate`, `fadein`, `slidein`, `zoomin`, `bounce`, `shake`, `pulse`, `flip`,
`sparkle`, `glow`, `rainbow`, `typewriter`, `parallax`, and `reveal` don't yet have a
dedicated component doc with a live example to pull from — tracked as remaining work,
not guessed here.

## Events

Wiring up a control (`x-toast`, `x-search`, `<nav x-tabs>`, …) is only half the story — most
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
| `wb:switch:change` | `semantics/switch.js` (`<div x-switch>`) | the switch is flipped | `{ checked }` |
| `wb:rating:change` | `semantics/rating.js` (`<div x-rating>`) | a star/icon is clicked | `{ value }` |
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
| `wb:tabs:change` | `tabs.js` (`<nav x-tabs>`) | a tab is clicked | `{ index, title }` |
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
your form: the `<form ajax>` component (`form.js`: `{ formData }` / `{ data }` /
`{ error }`) and native `<form>` auto-enhancement (`semantics/form.js` /
`enhancements.js`: `{ response }` / `{ error }`). See
[components/semantics/form.md](behaviors/form.md) for the authoritative,
per-implementation breakdown.

**Cards**

| Event | Fires from | Fires when | `detail` |
|-------|-----------|------------|----------|
| `wb:cardbutton:primary` | `card.js` | a card's primary footer button is clicked | `{ label }` |
| `wb:cardbutton:secondary` | `card.js` | a card's secondary footer button is clicked | `{ label }` |
| `wb:cardproduct:addtocart` | `card.js` (`<div x-cardproduct>`) | "Add to Cart" is clicked | `{ title, ... }` |
| `wb:cardnotification:dismiss` | `card.js` (`<div x-cardnotification>`) | a notification card is dismissed | `{ variant, title }` |
| `wb:cardexpandable:toggle` | `card.js` (`<div x-cardexpandable>`) | the card expands/collapses | `{ expanded }` |
| `wb:cardminimizable:toggle` | `card.js` (`<div x-cardminimizable>`) | the card minimizes/restores | `{ minimized }` |
| `wb:carddraggable:dragstart/drag/dragend` | `card.js` (`<div x-carddraggable>`) | a draggable card starts/moves/finishes dragging | `{ x, y }` |
| `wb:cardstats:hydrated` | `card.js` (`<div x-cardstats>`) | stats card finishes initializing (test hook) | `—` |

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
| `wb:theme:change` | `themecontrol.js` (`<div x-themecontrol>`) | a theme is selected | `{ theme, name }` |
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

**Tabs** — `<nav x-tabs>` fires on every tab change, including the initial selection:

```javascript
document.querySelector('x-tabs').addEventListener('wb:tabs:change', (e) => {
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
document.querySelectorAll('x-card, x-cardproduct, x-cardnotification').forEach((card) => {
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
[components/semantics/details.md](behaviors/details.md),
[components/cards/cardproduct.md](behaviors/cardproduct.md),
[components/tabs.md](behaviors/tabs.md), and [search.md](search.md). This section exists
so you don't have to open a dozen files to see what's available across the whole library.

---

### Quick Reference: Auto-Injection Mappings

| Element | Behavior | Type |
|---------|----------|------|
| `<img>` | [`image`](behaviors/img.md) | Decorate |
| `<audio>` | [`audio`](behaviors/audio.md) | Decorate |
| `<video>` | [`video`](behaviors/video.md) | Decorate |
| `<figure>` | [`figure`](behaviors/figure.md) | Decorate |
| `<table>` | [`table`](behaviors/table.md) | Decorate |
| `<code>` | [`code`](behaviors/code.md) | Decorate |
| `<pre>` | [`pre`](behaviors/pre.md) | Decorate |
| `<input>` | [`input`](behaviors/input.md) | Decorate |
| `<textarea>` | [`textarea`](behaviors/textarea.md) | Decorate |
| `<select>` | [`select`](behaviors/select.md) | Decorate |
| `<button>` | [`button`](behaviors/button.md) | Decorate |
| `<form>` | [`form`](behaviors/form.md) | Decorate |
| `<details>` | [`details`](behaviors/details.md) | Decorate |
| `<dialog>` | [`dialog`](behaviors/dialog.md) | Decorate |

---

*Document Version: 3.2.0*
