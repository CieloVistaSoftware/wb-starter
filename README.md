# WB Starter

A modern website starter kit powered by [WB Behaviors](https://github.com/CieloVistaSoftware/wb-behaviors). Config-driven, zero build step, 23 themes included.

## 🚀 Quick Start

1. Clone this repo
2. Open `index.html` in your browser
3. Edit `config/site.json` to customize

That's it! No npm, no build tools, no waiting.

## 📁 Project Structure

```
wb-starter/
├── public/             # Entry points (index.html, builder.html)
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

Themes: `dark`, `light`, `cyberpunk`, `ocean`, `sunset`, `forest`, `midnight`, `twilight`, `sakura`, `arctic`, `desert`, `neon-dreams`, `retro-wave`, `lavender`, `emerald`, `ruby`, `golden`, `slate`, `coffee`, `mint`, `noir`, `aurora`, `grape`

## 🧩 Using Components

Add behaviors with `data-wb` attributes:

```html
<button data-wb="ripple tooltip" data-tooltip="Hello!">
  Click me
</button>

<div data-wb="card" data-title="My Card" data-hoverable>
  Content here
</div>
```

See [WB Behaviors](https://github.com/CieloVistaSoftware/wb-behaviors) for all 235 behaviors.

## 📱 Responsive

- Collapsible sidebar navigation
- Mobile-friendly layout
- Touch-friendly components

## 📄 License

MIT License - Use freely in personal and commercial projects.
