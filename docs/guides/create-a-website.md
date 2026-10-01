# How to Create a Website with wb-starter

This guide takes you from nothing to a published website in about five minutes. You write plain HTML, and wb-starter supplies the behaviors (`x-*` attributes), the theme, the navigation and the page loading. There is no build step while you work.

## What you need

- **Node.js 18 or later.** Check it with `node --version`.
- A terminal: PowerShell, Windows Terminal, or the one built into VS Code.

## 1. Create the site

```powershell
npm create wb-starter my-site
```

`my-site` is the folder it creates. To give the site a display name that differs from the folder name, add `--name`:

```powershell
npm create wb-starter my-site -- --name "Cielo Vista Software"
```

> `pnpm create wb-starter my-site` works the same way.

### What `npm create wb-starter` actually does

npm sees `create wb-starter`, downloads the small package **`create-wb-starter`** (about 5 kB), and runs it. It:

1. makes the `my-site` folder with a starter site in it;
2. writes your site's name into the header, title and footer;
3. writes a `package.json` whose only dependency is **`wb-starter`**, the framework itself.

`create-wb-starter` only runs once. Your site never depends on it.

## 2. Install and run it

```powershell
Set-Location my-site
npm install
npm start
```

Open **http://localhost:3000**. If something else already has port 3000, `npm start` does not stop: it takes the next free port (3001, 3002, ...) and prints the address to open. Use the address it prints. You get a Home page and an About page, a menu, a theme switcher, and a working behavior: the button on the home page ripples when you click it.

`npm start` runs `wb-starter serve`. It serves your folder, with the wb-starter runtime underneath. Your own files always win: if you create a file with the same path as one of wb-starter's, yours is the one served.

## 3. What is in the folder

```text
my-site/
  index.html          the page shell (you rarely edit this)
  config/site.json    site name, menu, header, footer, page title, theme
  pages/home.html     one HTML file per page
  pages/about.html
  styles/site.css     your own styles
  package.json        private; depends on wb-starter
  README.md
  .gitignore
```

wb-starter itself lives in `node_modules/wb-starter`. It is a dependency, not a copy, so your folder holds only your site.

## 4. Edit a page

Open `pages/home.html` and change the text, then refresh the browser. There is nothing to rebuild.

Pages are plain HTML. To give an element a behavior, add an `x-*` attribute:

```html
<button x-ripple>Click me</button>
<section x-cardhero title="Welcome" subtitle="Built with wb-starter"></section>
```

The full list of behaviors, with a live example of each, is on the wb-starter site's **Behaviors** page.

## 5. Add a page

1. Create `pages/contact.html`:

   ```html
   <section id="contact-hero" class="page__hero">
     <h1>Contact</h1>
     <p>How to reach us.</p>
   </section>
   ```

2. Add it to `navigationMenu` in `config/site.json`:

   ```json
   { "menuItemId": "contact", "menuItemText": "Contact", "menuItemEmoji": "✉️", "pageToLoad": "contact" }
   ```

3. Refresh the browser. **Contact** is now in the menu.

`pageToLoad` is the file name in `pages/` without `.html`.

## 6. Change the look and the settings

Everything site-wide is in `config/site.json`:

| Setting | What it does |
|---|---|
| `branding.companyName` | The name in the header |
| `branding.colorTheme` | The starting theme, such as `"dark"` or `"light"` |
| `headerSettings.displayThemeSwitcher` | Show or hide the theme switcher |
| `footerSettings.footerCopyrightText` | The footer text |
| `searchEngineOptimization.pageTitle` | The browser tab title |

Put your own CSS in `styles/site.css`.

## 7. Publish it

```powershell
npm run build
```

This runs `wb-starter build`, which writes a complete static copy of the site to **`dist\`**: your pages plus the parts of the wb-starter runtime they use. Upload `dist\` to any static host:

- **GitHub Pages:** push `dist\` to a `gh-pages` branch, or publish it with a GitHub Pages action. The build already includes the `.nojekyll` file GitHub Pages needs.
- **Netlify, Cloudflare Pages, Azure Static Web Apps, any web server:** upload the contents of `dist\`.

`dist\` does not need Node.js or wb-starter to run. It is only files.

## 8. Get new wb-starter releases

```powershell
npm update wb-starter
```

Your pages are untouched. Only the runtime underneath them changes. What each release added and fixed is on the wb-starter site's **Releases** page.

## Commands at a glance

| Command | What it does |
|---|---|
| `npm create wb-starter my-site` | Create a new site in `my-site\` |
| `npm install` | Install wb-starter into the site |
| `npm start` | Serve the site at http://localhost:3000, or the next free port if 3000 is taken |
| `npm start -- --port 8080` | Start from another port (8080, or the next free one after it) |
| `npm run build` | Write the static site to `dist\` |
| `npm update wb-starter` | Move to the newest wb-starter release |

## Troubleshooting

- **"already exists and is not empty":** the folder is taken. Pick a new name, or empty the folder first.
- **Port 3000 is in use:** nothing to do. You do not need to kill the other server: `npm start` moves to the next free port and prints the address. If you want a particular range, run `npm start -- --port 8080`.
- **A page shows "not found":** check that `pageToLoad` in `config/site.json` matches the file name in `pages\` exactly (without `.html`).
- **An `x-*` attribute does nothing:** check its spelling against the Behaviors page. Behaviors load as they come into view, so scroll to the element.
