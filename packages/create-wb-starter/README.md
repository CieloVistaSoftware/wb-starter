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
| `--yes`, `-y` | off | Create the GitHub repo and publish on GitHub Pages without asking |
| `--no-github` | off | Do not offer GitHub at all |
| `--private` | off (public) | Make the GitHub repo private. GitHub Pages is free only for public repos; a private one needs a paid plan |

## Publishing on GitHub Pages

Every new site carries `.github/workflows/deploy.yml`. It does nothing until the site is on GitHub; from then on every push to `main` runs `npm run build` and publishes `dist/` with GitHub's own Pages actions.

After the files are written, creation asks one question, default No:

```text
Create a public GitHub repo "my-site" and publish it on GitHub Pages now? (y/N)
```

It is asked only when the [GitHub CLI](https://cli.github.com/) (`gh`) is installed and signed in, and only in a terminal. On yes it runs `git init` and a first commit, `gh repo create my-site --public --source . --remote origin`, turns Pages on with "GitHub Actions" as the source, pushes, and prints `https://<your-user>.github.io/my-site/`. On no, or when any of that cannot be done, it prints the steps to do it later. Creating the site never fails because of GitHub.

The repo is public by default because GitHub Pages is free only for public repos. There is no custom-domain question: the new site's README explains how to add a `CNAME`.

The full walkthrough -- editing pages, adding a page, settings, publishing and updating -- is in [How to Create a Website with wb-starter](https://github.com/CieloVistaSoftware/wb-starter/blob/main/docs/guides/create-a-website.md).

## What you get

```text
my-site/
  index.html          page shell
  config/site.json    name, menu, header, footer, page title
  pages/home.html     one file per menu item
  pages/about.html
  styles/site.css     your own styles
  .github/workflows/deploy.yml   publishes it on GitHub Pages
  package.json        private; depends on wb-starter
```

wb-starter itself is an npm dependency, not a copy. `npm start` (`wb-starter serve`) serves your folder with the wb-starter runtime underneath it, and your files always win. `npm run build` (`wb-starter build`) writes `dist/` for any static host. `npm update wb-starter` picks up new releases.

## Developing this package

`template/` is hand-written; edit it directly. npm drops dotfiles from a published package, so `.gitignore` ships as `template/_gitignore` and `.github/` as `template/_github/`; creation renames both. `tests/regression/create-wb-starter-new-site.spec.ts` scaffolds a site from it, installs wb-starter from the checkout, serves it, builds it, and checks the result in a browser, at the root and under a `/<name>/` sub-path as GitHub Pages serves it. `tests/regression/create-wb-starter-github-pages.spec.ts` covers the GitHub step with `gh` stubbed: it never calls GitHub.
