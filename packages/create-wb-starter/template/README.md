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

### On GitHub Pages

`.github/workflows/deploy.yml` publishes the site on every push to `main`: it runs `npm run build` and publishes `dist/`.

If you said yes when the site was created, it is already on GitHub. Otherwise, once:

1. Create a public GitHub repo and push this folder to its `main` branch:

   ```powershell
   git init
   git add -A
   git commit -m "First commit"
   gh repo create __PROJECT_NAME__ --public --source . --push
   ```

2. On GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.

The site is then at `https://YOUR-USER.github.io/__PROJECT_NAME__/`. GitHub Pages is free for public repos; on a private repo it needs a paid GitHub plan.

### Your own domain

To serve the site from your own domain (say `www.example.com`):

1. Create a file named `CNAME` in this folder holding just the domain:

   ```text
   www.example.com
   ```

   `npm run build` copies it into `dist/`, so every deploy keeps it.

2. At your domain's DNS provider, add a `CNAME` record from `www` to `YOUR-USER.github.io`.
3. On GitHub: **Settings > Pages > Custom domain**, enter the domain, and tick **Enforce HTTPS** once it is offered.

GitHub's guide: <https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site>

### Anywhere else

```powershell
npm run build
```

Upload the `dist/` folder to any static host (Netlify, S3, your own server, ...).

## Update wb-starter

```powershell
npm update wb-starter
```
