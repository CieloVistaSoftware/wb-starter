# Web Behaviors (WB) Starter

A modern website starter kit powered by [WB Behaviors](https://github.com/CieloVistaSoftware/wb-behaviors). Config-driven, zero build step, 23 themes included.

## 🚀 Quick Start

1. Clone this repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser

> **Note**: While the site can run as a static file (`index.html`), the development server is required for the Visual Builder to save changes and for error logging to work.

## 📁 Project Structure

```
wb-starter/
├── index.html          # Main entry point
├── public/             # Tools (builder.html, schema-viewer.html)
├── config/
│   └── site.json       # Site configuration (nav, branding, footer)
├── pages/
│   ├── home.html       # Home page content
│   ├── features.html   # Features page
│   ├── components.html # Component demos
│   ├── docs.html       # Documentation
│   ├── about.html      # About page
│   └── contact.html    # Contact form
├── styles/
│   └── site.css        # Site layout styles
├── assets/
│   └── images/         # Your images
└── src/                # Source code
    ├── core/           # Core engine (wb.js, site-engine.js)
    ├── behaviors/      # Behavior modules
    └── builder/        # Visual builder logic
```

## ⚙️ Configuration

Edit `config/site.json` to customize your site:

```json
{
  "site": {
    "name": "My Site",
    "logo": "🚀",
    "theme": "dark"
  },
  "nav": [
    { "id": "home", "label": "Home", "icon": "🏠", "page": "home" },
    { "id": "about", "label": "About", "icon": "ℹ️", "page": "about" }
  ],
  "footer": {
    "copyright": "© 2025 Your Company"
  }
}
```

## 📄 Adding Pages

1. Create `pages/mypage.html` with your content
2. Add to `site.json`:
   ```json
   { "id": "mypage", "label": "My Page", "icon": "📄", "page": "mypage" }
   ```
3. Refresh browser - done!

## 🎨 Themes

23 themes available. Change in `site.json`:

```json
"site": {
  "theme": "cyberpunk"
}
```

Themes: `dark`, `light`, `cyberpunk`, `ocean`, `sunset`, `forest`, `midnight`, `sakura`, `arctic`, `desert`, `neon-dreams`, `retro-wave`, `lavender`, `emerald`, `ruby`, `golden`, `slate`, `coffee`, `mint`, `noir`, `aurora`, `twilight`, `grape`

## ✨ Auto Injection (Preview)

WB Behaviors automatically enhances standard HTML5 semantic elements. No `data-wb` attributes required!

| HTML Element | WB Behavior | Description |
|--------------|-------------|-------------|
| `<article>` | `card` | Card component with header/main/footer |
| `<nav>` | `navbar` | Responsive navigation bar |
| `<aside>` | `sidebar` | Collapsible sidebar/drawer |
| `<dialog>` | `dialog` | Modal with backdrop and animations |
| `<details>` | `details` | Animated expand/collapse |
| `<form>` | `form` | Validation and AJAX handling |
| `<input>` | `input` | Enhanced styling and states |
| `<select>` | `select` | Custom dropdown UI |
| `<button>` | `button` | Ripple effects and loading states |
| `<table>` | `table` | Responsive sorting and styling |
| `<img>` | `image` | Lazy loading and fade-in |
| `<video>` | `video` | Custom player controls |
| `<audio>` | `audio` | Custom audio player |
| `<pre>` | `pre` | Code block with copy button |

**Opt-out:** Add `data-wb=""` to any element to disable auto-injection.

## 📦 Available Behaviors

### Core UI & Layout
`card`, `collapse`, `dropdown`, `hero`, `layouts`, `navigation`, `overlay` (modal/toast), `tabs`, `toggle`, `tooltip`

### Interactive & Effects
`copy`, `darkmode`, `draggable`, `effects`, `feedback`, `globe`, `move`, `resizable`, `ripple`, `scroll-progress`, `themecontrol`

### Form & Input
`checkbox`, `form`, `input`, `radio`, `range`, `rating`, `select`, `slider`, `switch`, `textarea`, `validator`

### Media & Content
`audio`, `code`, `details`, `dialog`, `dl`, `figure`, `img`, `mdhtml`, `media`, `ol`, `pre`, `progress`, `progressbar`, `table`, `ul`, `video`

### Utilities
`builder`, `docs-viewer`, `enhancements`, `helpers`, `notes`

## 📱 Responsive

- Collapsible sidebar navigation
- Mobile-friendly layout
- Touch-friendly components

## 📄 License

MIT License - Use freely in personal and commercial projects.
