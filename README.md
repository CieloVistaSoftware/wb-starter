# Web Behaviors (WB) Starter

A modern website starter kit powered by [WB Behaviors](https://github.com/CieloVistaSoftware/wb-behaviors). Config-driven, zero build step, 23 themes included.

## Try it out
Try it out here https://cielovistasoftware.github.io/wb-starter/

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

## Testing & CI

- Quick dev run: `npm test` (fast-by-default). Use `npm test -- --full` or `CI=true npm test` to run the full ordered pipeline (compliance → fast → base → behaviors → regression). See `docs/testing-runbook.md` for the full runbook, Playwright trace examples, and CI guidance.
- Quick copy-paste commands and PowerShell troubleshooting: see `NPXCOMMANDS.md` (recommended for contributors).
- MCP: the project includes a local MCP helper used by tools/agents — see `docs/mcp.md` for MCP usage and `docs/testing-runbook.md` for how MCP integrates with tests and CI.

## 📁 Project Structure

```
wb-starter/
├── index.html          # Main entry point
├── public/             # Tools (schema-viewer.html, fix-viewer.html)
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
    └── behaviors/      # Behavior modules
```
