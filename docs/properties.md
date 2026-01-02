# Web Behaviors (WB) - Property System Documentation

> **Version:** 1.0.0  
> **Updated:** December 20, 2024  
> **Config File:** `data/propertyconfig.json`

## Overview

The WB Behaviors Property System provides a unified configuration for all component properties in the Page Builder. This document describes each property, its UI control type, default values, and available options.

---

## Table of Contents

1. [UI Control Types](#ui-control-types)
2. [Property Categories](#property-categories)
3. [Properties Reference](#properties-reference)
   - [Content Properties](#content-properties)
   - [Media Properties](#media-properties)
   - [Link Properties](#link-properties)
   - [Appearance Properties](#appearance-properties)
   - [Layout Properties](#layout-properties)
   - [Style Properties](#style-properties)
   - [Behavior Properties](#behavior-properties)
   - [Button Properties](#button-properties)
   - [File Properties](#file-properties)
   - [Pricing Properties](#pricing-properties)
   - [Data Properties](#data-properties)
   - [Contact Properties](#contact-properties)
   - [Feedback Properties](#feedback-properties)
   - [Display Properties](#display-properties)
   - [Embed Properties](#embed-properties)
   - [Effects Properties](#effects-properties)
4. [Component Defaults](#component-defaults)

---

## UI Control Types

| Type | Component | Description |
|------|-----------|-------------|
| `text` | `<input type="text">` | Single-line text input |
| `number` | `<input type="number">` | Numeric input with arrows |
| `range` | `<input type="range">` | Slider control |
| `url` | `<input type="url">` | URL input with validation |
| `email` | `<input type="email">` | Email input with validation |
| `tel` | `<input type="tel">` | Phone number input |
| `color` | `<input type="color">` | Color picker |
| `date` | `<input type="date">` | Date picker |
| `time` | `<input type="time">` | Time picker |
| `datetime` | `<input type="datetime-local">` | Date & time picker |
| `checkbox` | Toggle Switch | Boolean toggle (On/Off) |
| `boolean` | Toggle Switch | Boolean toggle (On/Off) |
| `select` | `<select>` | Dropdown menu |
| `textarea` | `<textarea>` | Multi-line text |
| `file` | File picker | File upload with preview |
| `image` | File picker | Image upload with preview |
| `audio` | File picker | Audio file upload |
| `video` | File picker | Video file upload |
| `icon` | Icon picker | Emoji/icon selector |
| `json` | `<textarea>` | JSON editor (monospace) |
| `cssValue` | `<input type="text">` | CSS value (px, rem, %) |
| `canvasEditable` | None | Edited directly on canvas |

---

## Property Categories

| Category | Icon | Description |
|----------|------|-------------|
| Content | 📝 | Text content edited on canvas |
| Media | 🖼️ | Images, audio, video files |
| Link | 🔗 | URLs and navigation |
| Appearance | 🎨 | Visual style variants |
| Layout | 📐 | Positioning and sizing |
| Style | ✨ | Visual effects |
| Behavior | ⚙️ | Interactive settings |
| Buttons | 🔘 | Button labels and actions |
| File | 📁 | File-related properties |
| Pricing | 💰 | Pricing component fields |
| Data | 📊 | Data sources and formats |
| Contact | 📇 | Contact information |
| Feedback | 📈 | Ratings and statistics |
| Display | 👁️ | Display options |
| Embed | 🔌 | Embedded content |
| Effects | 🎆 | Animation effects |

---

## Recent Updates (v1.1.0)

### 1. Enhanced Boolean Controls
- All boolean properties (checkboxes) are now rendered as modern **Toggle Switches**.
- Labels clearly indicate "On" or "Off" state.
- Improved visual feedback for active states.

### 2. Property Visibility
- The property panel now displays **all available properties** for a component, not just those with set values.
- Default values are merged with current values to provide a complete view of configuration options.

### 3. Smart Placeholders
- Input fields now use **placeholders** to show default values.
- If a property value matches the default, the input field appears empty (showing the placeholder) to reduce visual clutter.
- This makes it easier to see which properties have been customized.

### 4. User-Centric Interface
- Removed technical "Type Badges" (e.g., "string", "boolean") to make the UI cleaner for non-developers.
- Property labels are automatically formatted to Title Case (e.g., "showBadge" -> "Show Badge").

### 5. Two-Way Synchronization
- **Canvas to Panel:** Editing text on the canvas updates the corresponding property panel input in real-time.
- **Panel to Canvas:** Changing a property in the panel immediately updates the component on the canvas.
- **Scroll Sync:** Clicking a component element on the canvas automatically scrolls the property panel to the relevant control.

### 6. Improved Inline Editing
- **Tab Navigation:** Pressing `Tab` while editing text on the canvas automatically saves changes and moves focus to the next editable element.
- **Smart Key Detection:** The system intelligently maps DOM elements to their property keys (e.g., `h3` -> `title`) for seamless editing.

---

## Properties Reference

### Content Properties

> **Note:** These are edited directly on the canvas by double-clicking. They don't appear in the property panel.

| Property | Default | Description |
|----------|---------|-------------|
| `title` | "Title" | Main heading text |
| `subtitle` | "Subtitle text" | Secondary heading |
| `footer` | "" | Footer text |
| `content` | "" | Main content body |
| `text` | "Text" | Generic text content |
| `message` | "Message" | Message/alert text |
| `quote` | "Quote text here..." | Blockquote content |
| `description` | "" | Description text |
| `name` | "Name" | Person/item name |
| `label` | "Label" | Input/element label |
| `placeholder` | "Enter text..." | Input placeholder |

---

### Media Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `src` | URL/File | "" | Media source URL or file |
| `image` | Image Picker | "https://picsum.photos/400/300" | Image file or URL |
| `avatar` | Image Picker | "https://i.pravatar.cc/80?img=1" | Profile image |
| `cover` | Image Picker | "" | Cover/banner image |
| `poster` | Image Picker | "" | Video thumbnail |
| `background` | Image Picker | "" | Background image |
| `cosmicBg` | Image Picker | "" | Cosmic theme background |
| `volume` | Range (0-1) | 0.8 | Audio volume |
| `bass` | Range (-10 to 10) | 0 | Bass adjustment |
| `treble` | Range (-10 to 10) | 0 | Treble adjustment |
| `autoplay` | Checkbox | false | Auto-start playback |
| `muted` | Checkbox | false | Start muted |
| `loop` | Checkbox | false | Loop playback |
| `controls` | Checkbox | true | Show media controls |
| `showEq` | Checkbox | false | Show 15-band equalizer |

**File Picker Behavior:**

When using `image`, `audio`, or `video` UI types:
1. Click "Choose File" to open file picker
2. Select file from local system
3. File is uploaded to `/uploads/[type]/`
4. URL is automatically populated
5. Preview appears in property panel

---

### Link Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `href` | URL | "#" | Link destination |
| `primaryHref` | URL | "#" | Primary button URL |
| `secondaryHref` | URL | "" | Secondary button URL |
| `ctaHref` | URL | "#" | CTA button URL |
| `target` | Select | "_self" | Link target window |
| `offset` | Number | 0 | Scroll offset (px) |

**Target Options:**
| Value | Label | Behavior |
|-------|-------|----------|
| `_self` | Same Window | Opens in current tab |
| `_blank` | New Tab | Opens in new tab |

---

### Appearance Properties

| Property | UI | Default | Options |
|----------|-----|---------|---------|
| `type` | Select | "info" | info, success, warning, error |
| `variant` | Select | "default" | (varies by component) |
| `size` | Select | "md" | xs, sm, md, lg, xl |
| `align` | Select | "center" | left, center, right |
| `valign` | Select | "center" | top, center, bottom |

**Type Options (Alert):**
| Value | Label | Color |
|-------|-------|-------|
| `info` | ℹ️ Info | #3b82f6 (blue) |
| `success` | ✅ Success | #22c55e (green) |
| `warning` | ⚠️ Warning | #eab308 (yellow) |
| `error` | ❌ Error | #ef4444 (red) |

**Type Options (Card File):**
| Value | Label |
|-------|-------|
| `pdf` | 📄 PDF |
| `doc` | 📝 Document |
| `image` | 🖼️ Image |
| `video` | 🎬 Video |
| `audio` | 🎵 Audio |
| `zip` | 📦 Archive |
| `code` | 💻 Code |
| `spreadsheet` | 📊 Spreadsheet |

**Variant Options (Hero):**
| Value | Label | Description |
|-------|-------|-------------|
| `default` | Default | Standard hero |
| `minimal` | Minimal | Clean, simple |
| `split` | Split | Image + content |
| `particles` | Particles | Animated particles |
| `diagonal` | Diagonal | Angled divider |
| `waves` | Waves | Wave animation |
| `grid` | Grid | Grid pattern |
| `spotlight` | Spotlight | Spotlight effect |
| `aurora` | Aurora | Aurora borealis |
| `mesh` | Mesh | Gradient mesh |
| `card` | Card | Card-style hero |
| `cosmic` | 🌌 Cosmic | Space theme |

---

### Layout Properties

| Property | UI | Default | Options/Format |
|----------|-----|---------|----------------|
| `direction` | Select | "column" | column, row |
| `justify` | Select | "start" | start, center, end, space-between, space-around, space-evenly |
| `columns` | Select | "3" | 1, 2, 3, 4, 5, 6 |
| `gap` | CSS Value | "1rem" | e.g., 1rem, 16px, 2em |
| `padding` | CSS Value | "1rem" | e.g., 1rem, 16px |
| `height` | CSS Value | "auto" | e.g., 400px, 50vh |
| `maxHeight` | CSS Value | "100px" | For expandable content |
| `aspect` | Select | "16/9" | 16/9, 4/3, 1/1, 3/2, 21/9, 9/16 |
| `fit` | Select | "cover" | cover, contain, fill, none, scale-down |
| `layout` | Select | "row" | row, column, space-between |
| `wrap` | Checkbox | true | Enable item wrapping |
| `position` | Select | "bottom" | top, bottom, left, right, center |

**Aspect Ratio Options:**
| Value | Label | Use Case |
|-------|-------|----------|
| `16/9` | 16:9 (Widescreen) | Videos, banners |
| `4/3` | 4:3 (Standard) | Classic photos |
| `1/1` | 1:1 (Square) | Profile images, thumbnails |
| `3/2` | 3:2 (Photo) | DSLR photos |
| `21/9` | 21:9 (Ultrawide) | Cinematic |
| `9/16` | 9:16 (Portrait) | Mobile, stories |

**Object Fit Options:**
| Value | Label | Behavior |
|-------|-------|----------|
| `cover` | Cover | Fill container, crop excess |
| `contain` | Contain | Fit inside, may letterbox |
| `fill` | Fill | Stretch to fill |
| `none` | None | Original size |
| `scale-down` | Scale Down | Smaller of contain/none |

---

### Style Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `elevated` | Checkbox | false | Add drop shadow |
| `clickable` | Checkbox | false | Make card clickable (needs href) |
| `gradient` | Checkbox | true | Add gradient overlay |
| `overlay` | Checkbox | true | Show overlay effect |
| `featured` | Checkbox | false | Highlight as featured |
| `color` | Color Picker | "#3b82f6" | Primary accent color |
| `badgeColor` | Color Picker | "" | Badge background color |

---

### Behavior Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `constrain` | Select | "none" | Drag constraint area |
| `axis` | Select | "both" | Drag direction limit |
| `snapToGrid` | Checkbox | false | Snap to grid when dragging |
| `expanded` | Checkbox | false | Start expanded |
| `multiple` | Checkbox | false | Allow multiple open |
| `dismissible` | Checkbox | true | Can be closed |
| `downloadable` | Checkbox | true | Allow file download |
| `showBadge` | Checkbox | false | Display badge |
| `showSeconds` | Checkbox | true | Show seconds in clock |

**Constrain Options:**
| Value | Label | Behavior |
|-------|-------|----------|
| `none` | No Constraint | Drag anywhere |
| `parent` | Parent Element | Stay within parent |
| `viewport` | Viewport | Stay on screen |

**Axis Options:**
| Value | Label | Behavior |
|-------|-------|----------|
| `both` | ↔↕ Both | Drag in any direction |
| `x` | ↔ Horizontal | Left/right only |
| `y` | ↕ Vertical | Up/down only |

---

### Button Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `primary` | Text | "Primary" | Primary button label |
| `secondary` | Text | "" | Secondary button label |
| `cta` | Text | "Get Started" | Call-to-action text |

---

### File Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `filename` | File Picker | "document.pdf" | File name or upload |
| `fileSize` | Text | "2.4 MB" | Display file size |
| `date` | Date | "" | File date |

**File Picker Features:**
- Upload button opens native file dialog
- Accepts all file types by default
- Uploads to `/uploads/files/`
- Shows filename after selection
- Optional URL input for external files

---

### Pricing Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `plan` | Text | "Pro" | Plan name |
| `price` | Text | "$29" | Price display |
| `originalPrice` | Text | "" | Strikethrough price |
| `period` | Select | "/month" | Billing period |
| `features` | Textarea | "Feature 1,Feature 2" | Comma-separated |

**Period Options:**
| Value | Label |
|-------|-------|
| `/month` | Monthly |
| `/year` | Yearly |
| `/week` | Weekly |
| `` | One-time |
| `/user/month` | Per User/Month |

---

### Data Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `items` | Textarea | "Item 1,Item 2,Item 3" | Comma-separated items |
| `separator` | Text | "/" | Breadcrumb separator |
| `source` | JSON | "[]" | Autocomplete data source |
| `headers` | Text | "Name,Email" | Table column headers |
| `rows` | JSON | "[]" | Table row data |
| `data` | JSON | "{}" | Generic JSON data |
| `code` | Textarea | "console.log('Hello');" | Code content |
| `language` | Select | "javascript" | Code language |
| `markdown` | Textarea | "# Heading" | Markdown content |
| `mask` | Text | "(XXX) XXX-XXXX" | Input mask pattern |
| `minLength` | Number | 1 | Min chars for autocomplete |

**Language Options:**
| Value | Label |
|-------|-------|
| `javascript` | JavaScript |
| `typescript` | TypeScript |
| `python` | Python |
| `html` | HTML |
| `css` | CSS |
| `json` | JSON |
| `sql` | SQL |
| `bash` | Bash |
| `powershell` | PowerShell |
| `csharp` | C# |
| `java` | Java |
| `php` | PHP |
| `ruby` | Ruby |
| `go` | Go |
| `rust` | Rust |

---

### Contact Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `company` | Text | "" | Company name |
| `location` | Text | "" | Address/location |
| `email` | Email | "" | Email address |
| `phone` | Tel | "" | Phone number |
| `website` | URL | "" | Website URL |
| `linkedin` | URL | "" | LinkedIn URL |
| `twitter` | URL | "" | Twitter/X URL |
| `github` | URL | "" | GitHub URL |
| `bio` | Textarea | "" | Biography |
| `role` | Text | "" | Job title |
| `author` | Text | "" | Author name |

---

### Feedback Properties

| Property | UI | Default | Range |
|----------|-----|---------|-------|
| `rating` | Range | 3 | 0-5 (step 0.5) |
| `reviews` | Number | 0 | Count of reviews |
| `value` | Text | "0" | Current value |
| `max` | Number | 100 | Maximum value |
| `min` | Number | 0 | Minimum value |
| `trend` | Select | "neutral" | up, down, neutral |
| `trendValue` | Text | "" | e.g., "+12%" |

**Trend Options:**
| Value | Label | Icon |
|-------|-------|------|
| `up` | Up | 📈 |
| `down` | Down | 📉 |
| `neutral` | Neutral | ➡️ |

---

### Display Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `icon` | Icon Picker | "📈" | Emoji or icon |
| `badge` | Text | "" | Badge text |
| `hoverText` | Text | "" | Tooltip on hover |
| `alt` | Text | "Image" | Image alt text |
| `status` | Select | "" | Online status |
| `format` | Select | "24" | Time format |

**Status Options:**
| Value | Label | Icon |
|-------|-------|------|
| `` | None | - |
| `online` | Online | 🟢 |
| `away` | Away | 🟡 |
| `busy` | Busy | 🔴 |
| `offline` | Offline | ⚫ |

---

### Embed Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `id` | Text | "" | YouTube/Vimeo video ID |
| `clipboardText` | Textarea | "Text to copy" | Clipboard content |
| `shareText` | Textarea | "" | Share message |
| `url` | URL | "" | Share URL |

---

### Effects Properties

| Property | UI | Default | Description |
|----------|-----|---------|-------------|
| `count` | Number | 50 | Particle count |
| `length` | Number | 6 | Character length (OTP) |
| `targetDate` | DateTime | "2025-12-31T23:59:59Z" | Countdown target |

---

## Component Defaults

Each component has predefined defaults loaded from `propertyconfig.json`. When a component is dropped onto the canvas, these values are automatically applied.

### Example: Card Pricing

```json
{
  "plan": "Pro",
  "price": "$29",
  "period": "/month",
  "features": "Unlimited projects,Priority support,Advanced analytics",
  "cta": "Get Started",
  "ctaHref": "#",
  "featured": false
}
```

### Example: Audio

```json
{
  "src": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "volume": "0.8",
  "bass": "0",
  "treble": "0",
  "showEq": false,
  "loop": false,
  "controls": true
}
```

### Example: Container

```json
{
  "direction": "column",
  "columns": 1,
  "gap": "1rem",
  "align": "stretch",
  "justify": "start",
  "wrap": true,
  "padding": "1rem"
}
```

---

## File Upload System

### Supported Upload Types

| UI Type | Accept Filter | Upload Path |
|---------|---------------|-------------|
| `file` | `*/*` | `/uploads/files/` |
| `image` | `image/*` | `/uploads/images/` |
| `audio` | `audio/*` | `/uploads/audio/` |
| `video` | `video/*` | `/uploads/video/` |

### Upload Flow

1. User clicks file input or drag-drops file
2. File is validated (type, size)
3. File is uploaded to server
4. Server saves to appropriate `/uploads/` subdirectory
5. Server returns the public URL
6. URL is set as property value
7. Preview is shown in property panel

### File Preview Features

- **Images:** Thumbnail preview (max 100px)
- **Audio:** Mini player with play/pause
- **Video:** Thumbnail with play button
- **Files:** Icon based on type + filename

---

## Extending the System

### Adding a New Property

1. Add definition to `data/propertyconfig.json`:

```json
"myProperty": {
  "label": "My Property",
  "ui": "text",
  "default": "default value",
  "description": "What this property does",
  "category": "appearance"
}
```

2. Add to relevant component in `componentDefaults`:

```json
"mycomponent": {
  "myProperty": "default value"
}
```

### Adding a New UI Type

1. Add to `uiTypes` section:

```json
"myType": {
  "component": "custom",
  "customComponent": "MyCustomEditor"
}
```

2. Implement renderer in `builder-properties.js`

---

## Related Files

| File | Purpose |
|------|---------|
| `data/propertyconfig.json` | Property definitions and defaults |
| `builder.js` | Property panel rendering |
| `builder-properties.js` | Enhanced property editors |
| `src/builder-editing.js` | Canvas editing handlers |
| `builder.css` | Property panel styles |

---

*Generated from propertyconfig.json v1.0.0*
