# WB Behaviors Cross-Reference

Complete reference of all 183 WB Behaviors organized by type.

---

## What is a Behavior?

A **behavior** is a JavaScript function that enhances an HTML element by adding:
- CSS classes (styling hooks)
- Inline styles (visual enhancement)
- Event listeners (interactivity)
- ARIA attributes (accessibility)
- Data attributes (state tracking)

Behaviors do **NOT** change what an element fundamentally is - they enhance it.

---

## Behavior Syntax

### x- Prefix (Recommended)
```html
<button x-ripple x-tooltip="Click me!">Button</button>
<div x-draggable x-fadein>Drag me</div>
```

### Custom Element Tags
```html
<wb-card title="Hello">Content</wb-card>
<wb-grid columns="3">...</wb-grid>
```

### data-wb Attribute (Legacy)
```html
<div data-wb="card" data-title="Hello">Content</div>
```

---

## Auto-Injection

With `autoInject: true` in `config/site.json`, semantic elements are automatically enhanced:

| Element | Auto-Applied Behavior |
|---------|----------------------|
| `<button>` | button |
| `<input type="checkbox">` | checkbox |
| `<input type="radio">` | radio |
| `<input type="range">` | range |
| `<select>` | select |
| `<textarea>` | textarea |
| `<form>` | form |
| `<fieldset>` | fieldset |
| `<label>` | label |
| `<img>` | image |
| `<video>` | video |
| `<audio>` | audio |
| `<code>` | code |
| `<pre>` | pre |
| `<kbd>` | kbd |
| `<table>` | table |
| `<details>` | details |
| `<dialog>` | dialog |
| `<progress>` | progress |
| `<header>` | header |
| `<footer>` | footer |

Use `x-ignore` to skip auto-injection on an element.

---

## Behavior Categories

### Element Behaviors (87)

Display components that render UI elements.

| Behavior | Custom Tag | Description |
|----------|------------|-------------|
| card | `<wb-card>` | Basic card component |
| cardimage | `<card-image>` | Card with image |
| cardvideo | `<card-video>` | Card with video |
| cardbutton | `<card-button>` | Clickable card |
| cardhero | `<wb-cardhero>` | Hero card |
| cardprofile | `<card-profile>` | Profile/user card |
| cardpricing | `<card-pricing>` | Pricing tier card |
| cardstats | `<card-stats>` | Statistics card |
| cardtestimonial | `<card-testimonial>` | Testimonial card |
| cardproduct | `<card-product>` | Product card |
| cardnotification | `<card-notification>` | Notification card |
| cardfile | `<card-file>` | File upload card |
| cardlink | - | Link card (article with data-href) |
| cardhorizontal | `<card-horizontal>` | Horizontal card |
| carddraggable | - | Draggable card |
| cardexpandable | - | Expandable card |
| cardminimizable | - | Minimizable card |
| cardoverlay | `<card-overlay>` | Overlay card |
| cardportfolio | - | Portfolio card |
| hero | - | Hero section |
| details | - | Collapsible details |
| collapse | - | Collapsible section |
| progressbar | `<wb-progress>` | Progress bar |
| progress | - | Native progress enhancement |
| badge | `<wb-badge>` | Badge/tag |
| avatar | `<wb-avatar>` | User avatar |
| chip | - | Chip/tag |
| alert | `<wb-alert>` | Alert message |
| skeleton | `<wb-skeleton>` | Loading skeleton |
| divider | `<wb-divider>` | Horizontal divider |
| spinner | `<wb-spinner>` | Loading spinner |
| breadcrumb | - | Breadcrumb navigation |
| navbar | - | Navigation bar |
| sidebar | - | Sidebar navigation |
| menu | - | Menu component |
| pagination | - | Pagination controls |
| steps | - | Step indicator |
| treeview | - | Tree view |
| link | - | Enhanced link |
| table | - | Enhanced table |
| list | - | Enhanced list |
| desclist | - | Description list |
| timeline | - | Timeline |
| stat | `<stats-card>` | Stat display |
| empty | - | Empty state |
| code | - | Inline code |
| json | - | JSON viewer |
| diff | - | Diff viewer |
| kbd | - | Keyboard key |
| image | - | Enhanced image |
| video | - | Enhanced video |
| audio | `<wb-audio>` | Audio player with EQ |
| youtube | - | YouTube embed |
| vimeo | - | Vimeo embed |
| embed | - | Generic embed |
| figure | - | Figure with caption |
| ratio | - | Aspect ratio container |
| icon | - | Icon |
| input | - | Enhanced input |
| textarea | - | Enhanced textarea |
| select | - | Enhanced select |
| checkbox | - | Enhanced checkbox |
| radio | - | Enhanced radio |
| switch | `<wb-switch>` | Toggle switch |
| range | - | Range slider |
| colorpicker | - | Color picker |
| datepicker | - | Date picker |
| timepicker | - | Time picker |
| file | - | File input |
| password | - | Password input |
| search | - | Search input |
| autocomplete | - | Autocomplete input |
| otp | - | OTP input |
| rating | `<wb-rating>` | Star rating |
| tags | - | Tag input |
| form | - | Enhanced form |
| fieldset | - | Enhanced fieldset |
| label | - | Enhanced label |
| help | - | Help text |
| error | - | Error message |
| stepper | - | Number stepper |
| clock | - | Clock display |
| countdown | - | Countdown timer |
| relativetime | - | Relative time (e.g., "2 hours ago") |
| mdhtml | `<wb-mdhtml>` | Markdown to HTML |
| notes | - | Notes component |

---

### Container Behaviors (21)

Layout components that contain other elements.

| Behavior | Custom Tag | Description |
|----------|------------|-------------|
| inputgroup | - | Input group wrapper |
| formrow | - | Form row layout |
| container | - | Centered container |
| grid | `<wb-grid>` | CSS Grid layout |
| flex | `<wb-flex>` | Flexbox layout |
| stack | `<wb-stack>` | Vertical stack |
| cluster | `<wb-cluster>` | Clustered items |
| center | - | Center content |
| sidebarlayout | - | Sidebar + main layout |
| drawerLayout | - | Drawer layout |
| switcher | - | Responsive switcher |
| masonry | - | Masonry layout |
| scrollable | - | Scrollable container |
| cover | - | Cover layout |
| frame | - | Frame/aspect ratio |
| reel | - | Horizontal scroll reel |
| imposter | - | Overlay positioning |
| accordion | - | Accordion panels |
| tabs | - | Tab panels |
| gallery | - | Image gallery |
| carousel | - | Carousel/slider |

---

### Modifier Behaviors (52)

Behaviors that modify existing elements with effects, animations, or functionality.

#### Animations

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| animate | `x-animate` | Generic animation |
| fadein | `x-fadein` | Fade in effect |
| fadeout | `x-fadeout` | Fade out effect |
| slidein | `x-slidein` | Slide in effect |
| slideout | `x-slideout` | Slide out effect |
| zoomin | `x-zoomin` | Zoom in effect |
| zoomout | `x-zoomout` | Zoom out effect |
| bounce | `x-bounce` | Bounce effect |
| shake | `x-shake` | Shake effect |
| pulse | `x-pulse` | Pulse effect |
| flip | `x-flip` | Flip effect |
| rotate | `x-rotate` | Rotate effect |
| swing | `x-swing` | Swing effect |
| tada | `x-tada` | Tada effect |
| wobble | `x-wobble` | Wobble effect |
| jello | `x-jello` | Jello effect |
| heartbeat | `x-heartbeat` | Heartbeat effect |
| flash | `x-flash` | Flash effect |
| rubberband | `x-rubberband` | Rubber band effect |

#### Text Effects

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| typewriter | `x-typewriter` | Typewriter effect |
| countup | `x-countup` | Count up animation |
| marquee | `x-marquee` | Scrolling text |

#### Visual Effects

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| parallax | `x-parallax` | Parallax scroll |
| reveal | `x-reveal` | Reveal on scroll |
| sparkle | `x-sparkle` | Sparkle effect |
| glow | `x-glow` | Glow effect |
| rainbow | `x-rainbow` | Rainbow text |
| ripple | `x-ripple` | Click ripple |
| snow | `x-snow` | Snow particles |
| particle | `x-particle` | Particle effects |

#### Interaction

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| draggable | `x-draggable` | Make draggable |
| resizable | `x-resizable` | Make resizable |
| sticky | `x-sticky` | Sticky positioning |
| fixed | `x-fixed` | Fixed positioning |
| lazy | `x-lazy` | Lazy loading |
| truncate | `x-truncate` | Text truncation |
| highlight | `x-highlight` | Highlight text |
| visible | `x-visible` | Visibility toggle |
| autosize | `x-autosize` | Auto-size textarea |
| lightbox | `x-lightbox` | Image lightbox |

#### Form Helpers

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| validator | `x-validator` | Form validation |
| masked | `x-masked` | Input masking |
| counter | `x-counter` | Character counter |
| floatinglabel | `x-floatinglabel` | Floating label |
| tooltip | `x-tooltip` | Tooltip |

#### Utilities

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| hotkey | `x-hotkey` | Keyboard shortcut |
| offline | `x-offline` | Offline indicator |
| debug | `x-debug` | Debug mode |

#### Builder Only

| Behavior | Description |
|----------|-------------|
| moveup | Move element up |
| movedown | Move element down |
| moveleft | Move element left |
| moveright | Move element right |
| moveall | Move in any direction |

---

### Action Behaviors (23)

Behaviors that trigger actions or show overlays.

| Behavior | x- Attribute | Description |
|----------|--------------|-------------|
| share | `x-share` | Share dialog |
| darkmode | `x-darkmode` | Dark mode toggle |
| themecontrol | `x-themecontrol` | Theme control |
| backtotop | `x-backtotop` | Back to top button |
| copy | `x-copy` | Copy to clipboard |
| clipboard | `x-clipboard` | Clipboard access |
| print | `x-print` | Print page |
| fullscreen | `x-fullscreen` | Fullscreen toggle |
| scroll | `x-scroll` | Smooth scroll |
| toggle | `x-toggle` | Toggle element |
| external | `x-external` | External link |
| modal | `x-modal` | Modal dialog |
| popover | `x-popover` | Popover |
| dropdown | `x-dropdown` | Dropdown menu |
| drawer | `x-drawer` | Slide-out drawer |
| offcanvas | `x-offcanvas` | Off-canvas panel |
| sheet | `x-sheet` | Bottom sheet |
| confirm | `x-confirm` | Confirm dialog |
| prompt | `x-prompt` | Prompt dialog |
| notify | `x-notify` | Push notification |
| toast | `x-toast` | Toast notification |
| confetti | `x-confetti` | Confetti effect |
| fireworks | `x-fireworks` | Fireworks effect |

---

## Usage Examples

### Cards

```html
<!-- Basic card -->
<wb-card title="Hello" subtitle="World">
  Card content here.
</wb-card>

<!-- Hero card -->
<wb-cardhero 
  variant="cosmic" 
  title="Build stunning UIs" 
  subtitle="just HTML — no build step"
  cta="Get Started"
  cta-href="#start">
</wb-cardhero>

<!-- Notification card -->
<card-notification 
  type="success" 
  title="Complete" 
  message="Operation finished.">
</card-notification>

<!-- Stats card -->
<stats-card 
  data-value="1,234" 
  data-label="Users">
</stats-card>
```

### Layout

```html
<!-- Grid layout -->
<wb-grid columns="3" gap="1rem">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</wb-grid>

<!-- Stack layout -->
<wb-stack gap="1rem">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</wb-stack>

<!-- Cluster layout -->
<wb-cluster gap="0.5rem">
  <span>Tag 1</span>
  <span>Tag 2</span>
  <span>Tag 3</span>
</wb-cluster>
```

### Animations & Effects

```html
<!-- Click effects -->
<button x-ripple>Ripple Effect</button>
<button x-confetti>Celebrate! 🎉</button>

<!-- Hover effects -->
<div x-tooltip="Hello!">Hover me</div>

<!-- Scroll effects -->
<div x-fadein>Fades in on scroll</div>
<div x-slidein>Slides in on scroll</div>

<!-- Attention seekers -->
<button x-bounce>Bounce</button>
<button x-shake>Shake</button>
<button x-pulse>Pulse</button>
```

### Form Enhancements

```html
<!-- Input with counter -->
<input type="text" x-counter data-max="100" placeholder="Type here...">

<!-- Masked input -->
<input type="text" x-masked data-mask="(999) 999-9999" placeholder="Phone">

<!-- Validated input -->
<input type="email" x-validator placeholder="Email">

<!-- Password with toggle -->
<input type="password" x-password placeholder="Password">
```

### Overlays & Dialogs

```html
<!-- Modal trigger -->
<button x-modal="#myModal">Open Modal</button>
<div id="myModal" class="wb-modal">
  <h2>Modal Title</h2>
  <p>Modal content</p>
</div>

<!-- Toast notification -->
<button x-toast="Saved successfully!" data-variant="success">Save</button>

<!-- Confirm dialog -->
<button x-confirm="Are you sure?" data-onconfirm="deleteItem()">Delete</button>

<!-- Drawer -->
<button x-drawer="#sideDrawer">Open Drawer</button>
```

### Media

```html
<!-- Audio player with EQ -->
<wb-audio 
  data-src="song.mp3" 
  data-show-eq="true" 
  data-volume="0.5">
</wb-audio>

<!-- Lazy loaded image -->
<img x-lazy data-src="large-image.jpg" alt="Description">

<!-- Lightbox -->
<img x-lightbox src="photo.jpg" alt="Click to enlarge">
```

### Utilities

```html
<!-- Draggable element -->
<div x-draggable>Drag me around</div>

<!-- Sticky header -->
<header x-sticky>Always visible</header>

<!-- Copy to clipboard -->
<button x-copy data-text="Hello World!">Copy</button>

<!-- Keyboard shortcut -->
<button x-hotkey="ctrl+s" onclick="save()">Save</button>
```

---

## Custom Element Tags Reference

| Tag | Behavior | Category |
|-----|----------|----------|
| `<wb-card>` | card | element |
| `<wb-cardhero>` | cardhero | element |
| `<wb-grid>` | grid | container |
| `<wb-flex>` | flex | container |
| `<wb-stack>` | stack | container |
| `<wb-cluster>` | cluster | container |
| `<wb-row>` | flex | container |
| `<wb-column>` | stack | container |
| `<wb-badge>` | badge | element |
| `<wb-alert>` | alert | element |
| `<wb-avatar>` | avatar | element |
| `<wb-divider>` | divider | element |
| `<wb-spinner>` | spinner | element |
| `<wb-skeleton>` | skeleton | element |
| `<wb-progress>` | progressbar | element |
| `<wb-switch>` | switch | element |
| `<wb-rating>` | rating | element |
| `<wb-audio>` | audio | element |
| `<wb-mdhtml>` | mdhtml | element |
| `<stats-card>` | stat | element |
| `<card-image>` | cardimage | element |
| `<card-profile>` | cardprofile | element |
| `<card-pricing>` | cardpricing | element |
| `<card-testimonial>` | cardtestimonial | element |
| `<card-horizontal>` | cardhorizontal | element |
| `<card-overlay>` | cardoverlay | element |
| `<card-notification>` | cardnotification | element |
| `<image-card>` | cardimage | element |
| `<price-card>` | cardpricing | element |
| `<profile-card>` | cardprofile | element |
| `<testimonial-card>` | cardtestimonial | element |

---

## Notes

### Custom Tags vs Web Components

WB custom tags are **NOT** Web Components:
- ❌ No `customElements.define()`
- ❌ No Shadow DOM
- ❌ No class extending HTMLElement
- ✅ Regular HTML elements with custom tag names
- ✅ Behaviors applied via selector matching
- ✅ Works because browsers allow unknown tag names

### Behavior Priority

1. Explicit `x-*` attributes
2. Explicit `data-wb` attribute
3. Custom element tag matching
4. Auto-injection (if enabled)

### Opting Out

Use `x-ignore` to prevent auto-injection:
```html
<button x-ignore>Plain button</button>
```

---

*Generated from behavior-inventory.json (183 behaviors)*
*Last updated: February 2026*
