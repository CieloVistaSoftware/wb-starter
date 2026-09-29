# __SITE_NAME__

A website built with [wb-starter](https://github.com/CieloVistaSoftware/wb-starter): plain HTML, `x-*` behaviors, no build step.

## Run it

```powershell
npm install
npm start
```

Then open <http://localhost:3000/>.

## Where things are

| File | What it is |
|---|---|
| `config/site.json` | Site name, menu, header, footer, page title |
| `pages/*.html` | One file per menu item (`pages/about.html` is `?page=about`) |
| `styles/site.css` | Your own styles, loaded after wb-starter's |
| `index.html` | The page shell; you rarely need to touch it |

wb-starter itself lives in `node_modules/wb-starter`. `npm start` serves it underneath this folder, and your files always win.

## Publish it

```powershell
npm run build
```

Upload the `dist/` folder to any static host (GitHub Pages, Netlify, S3, ...).

## Update wb-starter

```powershell
npm update wb-starter
```
