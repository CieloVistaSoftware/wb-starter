# How to Move an Existing Page onto WB Starter

`site-migrate` reads one page of an existing site and proposes the same page written for WB Starter. It lists every change it made and why, so you can review the proposal before you use it.

It is **assisted, not autonomous**. It does the mechanical part: plain HTML5 elements instead of `div` soup, WB Starter's behaviors instead of a framework's classes, and the old CSS and scripts dropped. The judgement stays with you. It never writes content of its own, and what it cannot classify stays in the page under a `TODO` comment for you to decide.

> **v1 (#982, #1832):** one page at a time, read as the browser shows it. [What it does not do yet](#what-it-does-not-do-yet) is listed below.

## What you need

- A WB Starter checkout. `site-migrate` lives in `packages/site-migrate` and reads WB Starter's behavior registry, `src/core/tag-map.js`.
- Node.js 18 or later, and Playwright's Chromium: `npx playwright install chromium`.
- The page to move, saved as an `.html` file. Keep its images next to it if you want them checked.

## 1. Look at the proposal

```powershell
node packages/site-migrate/bin/site-migrate.js old-site/index.html
```

This writes nothing. It prints:

- the **changes**, one per element, each with what it was, what it becomes and why:

  ```text
  16. body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card
     - Was: <div class="card h-100 shadow-sm">
     - Now: <article title="Country sourdough" subtitle="48-hour ferment">
     - Why: A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0). ...
  ```

- the **unclassified regions**: the parts it would not guess about;
- the proposed **`config/site.json` entries**: the menu built from the old navigation, the company name, the footer copyright, and the page title and description;
- the proposed **theme tokens**: the old page's colours, type sizes and spacing as overrides of WB Starter's own tokens (`--primary`, `--text-base`, `--space-md`, ...), measured from the page as the browser draws it. No rule of theirs is copied;
- the **assets** the page uses;
- the **checks** the proposal passed, and a **compliance run**: the proposal loaded into the site shell and measured with the rules of `semantic-element-fidelity`, `demo-layout-standards`, `no-element-overlap` and `no-data-attributes`;
- the **proposed page** and the **proposed token stylesheet** themselves.

## 2. Write it

```powershell
node packages/site-migrate/bin/site-migrate.js old-site/index.html --out my-site --write
```

This writes three files, and copies the assets:

| File | What it is |
|---|---|
| `my-site/pages/home.html` | The proposed page (`index.html` becomes the home page; other pages keep their names) |
| `my-site/home.migration.md` | The review list from step 1 |
| `my-site/home.site.css` | The proposed theme tokens, to merge into `styles/site.css` |
| `my-site/images/...` and the rest | Every asset found next to the old page, at the same relative path. Nothing is written outside `--out`. |

Your input file is never changed. If `--write` would replace it, `site-migrate` stops and writes nothing.

## 3. Review it

Work through `home.migration.md`:

1. **Unclassified regions.** For each one, decide what it is. The Riverbend sample has a styled banner ("Free delivery on Fridays…") and a `div` that opened a map on click. Each is in the page, word for word, under `<!-- TODO: unclassified -->`. Make it a real element, give it a behavior, or delete it.
2. **Changes.** Read the *Why* of anything surprising. A card's heading becomes its `title` attribute, a testimonial's attribution becomes `author` and `role`, and an accordion becomes `<details>` elements.
3. **Site shell.** Merge the proposed entries into your site's `config/site.json` by hand: `navigationMenu`, `branding.companyName`, `footerSettings.footerCopyrightText` and `searchEngineOptimization`. The navigation and footer are not in the page because the WB Starter shell builds them from that file.
4. **Theme tokens.** Merge what you keep from `home.site.css` into `styles/site.css`. They override every theme; the file says which theme (light or dark) the old page was.
5. **Assets.** `--write` copied what it found. Find the ones marked *missing* or *external* yourself.
6. **Compliance run.** Anything marked FAIL in the Checks section names the spec whose rule the page breaks, and the elements.
7. **Look at it.** Run `npm start` in your site and open the page.

## What it maps

| In the old page | Becomes |
|---|---|
| a card (`div.card`, `.panel`, `.tile`) | `<article title="…">`. `<article>` is a card in WB Starter. |
| a hero or jumbotron | `<section x-hero>` |
| a testimonial or attributed quote | `<article x-cardtestimonial author="…" role="…">` with the quote between the tags |
| an accordion | `<details>` / `<summary>` |
| an image with a caption | `<figure>` / `<figcaption>` |
| a pricing card | `<article x-cardpricing plan="…" price="…" period="…" features="…" cta="…">`, when every word fits an attribute; otherwise an ordinary card |
| a YouTube or Vimeo player | `<div x-youtube url="…">` / `<div x-vimeo video-id="…">` |
| a tab set | `<div x-tabs>` with one `<div tab-title="…">` per panel |
| an inline SVG icon | `<span x-icon>` around the SVG; a bigger drawing stays under a `TODO` |
| a row of grid columns | `<div x-grid columns="N">` |
| layout wrappers (`.container`, `.col-*`) | removed; their content stays |
| navigation, header, footer | proposed `config/site.json` entries |
| `class`, `style`, `data-*`, `onclick` | dropped |

Every `x-*` attribute it writes is checked against WB Starter's registry first. It cannot propose a behavior that does not exist. The full rule table is in [packages/site-migrate/README.md](../../packages/site-migrate/README.md).

## What it does not do yet

- Migrate a whole site or follow links: one page at a time.
- Read hover and focus colours, fonts or shadows for theme tokens. Stylesheets from other sites (a CDN) do not load, so what they set is not measured.
- Map carousels.
