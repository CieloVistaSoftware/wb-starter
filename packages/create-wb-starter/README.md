# create-wb-starter

Create a website that uses [wb-starter](https://github.com/CieloVistaSoftware/wb-starter): plain HTML, `x-*` behaviors, no build step.

## Usage

```powershell
npm create wb-starter my-site
cd my-site
npm install
npm start
```

Options:

| Option | Default | What it does |
|---|---|---|
| `--name "My Site"` | from the folder name | The site name in the header, title and footer |
| `--wb-starter <version or path>` | `^1.0.0` | Which wb-starter to depend on (a local path installs a checkout) |

## What you get

```text
my-site/
  index.html          page shell
  config/site.json    name, menu, header, footer, page title
  pages/home.html     one file per menu item
  pages/about.html
  styles/site.css     your own styles
  package.json        private; depends on wb-starter
```

wb-starter itself is an npm dependency, not a copy. `npm start` (`wb-starter serve`) serves your folder with the wb-starter runtime underneath it, and your files always win. `npm run build` (`wb-starter build`) writes `dist/` for any static host. `npm update wb-starter` picks up new releases.

## Developing this package

`template/` is hand-written; edit it directly. `tests/regression/create-wb-starter-new-site.spec.ts` scaffolds a site from it, installs wb-starter from the checkout, serves it, builds it, and checks the result in a browser.
