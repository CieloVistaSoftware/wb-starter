# site-migrate

Propose a [WB Starter](../../README.md) page for an existing HTML page. Every change is listed with its reason for a person to review.

**Assisted, not autonomous.** site-migrate does the mechanical part of moving a page onto WB Starter. It turns `div` soup into native HTML5 elements, maps cards, heroes, testimonials, accordions and grids onto WB Starter's behaviors, drops the old CSS and scripts, and lists the assets. A person reviews every change. It never writes content of its own. What it cannot classify stays in the page, word for word, under a `<!-- TODO: unclassified -->` comment.

This is **v1** (#982, #1832): one page, static after render. v1 added the compliance run, theme tokens, asset copying, and pricing tables, video embeds, tabs and SVG icons.

## Usage

```powershell
node packages/site-migrate/bin/site-migrate.js old-site/index.html
node packages/site-migrate/bin/site-migrate.js old-site/index.html --write
node packages/site-migrate/bin/site-migrate.js old-site/about.html --out my-site --write
```

| Option | Default | What it does |
|---|---|---|
| *(none)* | | Print the review list and the proposed page. Nothing is written. |
| `--write` | off | Write `pages/<name>.html`, `<name>.migration.md` and `<name>.site.css` into `--out`, and copy the assets found next to the source |
| `--out <dir>` | `./site-migrate-out` | Where `--write` writes |

`index.html` becomes `pages/home.html`, and any other page keeps its name. site-migrate never writes over its input. If `--write` would replace the input file, it stops and writes nothing.

It renders the page in headless Chromium through Playwright, so a page whose scripts build its content is read as the browser shows it. Only `file:` URLs load. Every network request is refused, so the result depends on the file alone. Chromium must be installed (`npx playwright install chromium`).

## What it writes

- **`pages/<name>.html`:** the proposed page, a fragment the way WB Starter pages are (Law 10). It has no `<html>`, `<head>`, navigation or footer, because the site shell supplies those.
- **`<name>.migration.md`:** the review list:
  - **Changes:** every element it changed, as *Was*, *Now* and *Why*, with the element's path in the source.
  - **Unclassified regions:** what it could not map, and what a person has to decide.
  - **Site shell:** the proposed `config/site.json` entries: the menu from the old navigation, the company name, the footer copyright and the page title and description. Merge them by hand.
  - **Assets:** every image, download and icon the page uses, and whether it was found next to the source.
  - **Theme tokens:** each proposed token, and what it was measured from.
  - **Checks:** the proposed page passed these before anything was written (see below), and the compliance run.
- **`<name>.site.css`:** the proposed theme tokens: overrides of tokens `src/styles/themes.css` defines, measured from the computed styles of the rendered source page. Only values the source's own CSS changed from the browser's default count. No rule is copied. Merge it into `styles/site.css` by hand.
- **assets:** every image, download and icon marked *found* is copied into `--out` at the same relative path (a page is loaded into the site's `index.html`, so its relative URLs resolve from there). A path that would leave `--out` is not copied, and is listed.

## The rules

Every rule maps onto markup WB Starter already has. That is either a native element that auto-injects its behavior (`nativeMap` in `src/core/tag-map.js`) or an `x-*` attribute in `extensionMap`. A rule that asks for an `x-*` attribute the registry does not list stops the run.

| In the old page | In the proposed page | Why |
|---|---|---|
| `div.card` / `.panel` / `.tile` | `<article title="…" subtitle="…">` | `<article>` IS a card (nativeMap `article` → card). The heading becomes `title`, and the rest stays between the tags (#968). |
| `.hero` / `.jumbotron` / `.masthead` / `.banner` | `<section x-hero>` | extensionMap `x-hero` |
| `.testimonial`, `blockquote` with an attribution | `<article x-cardtestimonial author="…" role="…">quote</article>` | extensionMap `x-cardtestimonial`. The quote stays between the tags. Author, role, avatar and ★ rating are copied from the attribution. |
| `.accordion` items | `<details><summary>…</summary>…</details>` | x-accordion is deprecated in favour of native `<details>` (nativeMap `details`) |
| an image with a caption | `<figure>` + `<figcaption>` | nativeMap `figure` |
| a card with a price (`.pricing-card`, `.price`, ...) | `<article x-cardpricing plan price period description features cta cta-href [featured]>` | extensionMap `x-cardpricing`. x-cardpricing replaces its content, so every word must fit an attribute: a missing period or call to action (it would show its own default), a feature with a comma, or text left over makes it an ordinary card instead. |
| a YouTube or Vimeo `<iframe>` | `<div x-youtube url>` / `<div x-vimeo video-id>` | extensionMap `x-youtube`, `x-vimeo`. autoplay, mute and loop in the URL carry over. |
| a tab list (`[role=tablist]`, `.nav-tabs`) and the element holding exactly its panels | `<div x-tabs active-tab>` with `<div tab-title>` panels | extensionMap `x-tabs`. The tab buttons are removed: x-tabs builds them. |
| an inline `<svg>` no bigger than 48x48px | `<span x-icon><svg>…</svg></span>` | extensionMap `x-icon`. Without x-icon in the registry the SVG is kept as it is. A bigger drawing is kept under a TODO. |
| `.row` of `.col-*` columns | `<div x-grid columns="N">` (a `<form>` keeps its tag) | extensionMap `x-grid`. N comes from the column width. |
| `.container`, `.col-*`, `.card-body` and other layout wrappers | unwrapped | WB Starter's layout replaces them |
| `<nav>`, `<header>`, `<footer>` outside the content | `config/site.json` | The shell is built from site.json, not written into each page |
| `<main>` | unwrapped | The shell supplies `<main>` (Law 10) |
| `class`, `style`, `data-*`, `on*` | dropped | No inline styles, no `data-*`, and their CSS and scripts are not ported |
| icon-font glyphs (`<i class="fa …">`) | removed, and listed | Their icon font is not ported |
| a styled `div` with text, an element with a click handler, another `<iframe>` | kept under `<!-- TODO: unclassified -->`, or listed | A person decides |

## The checks

The proposed page is written only if all of these pass:

- every `x-*` attribute is in `extensionMap`;
- no `class`, `style`, `data-*` or `on*` attribute is left;
- no `script`, `style`, `link` or `meta` element is left, so the page is a fragment;
- **nothing is invented:** every piece of text in the page, and every `title`, `subtitle`, `author`, `role`, `plan`, `price`, `period`, `description`, `features`, `cta` and `tab-title` value, appears in the source page word for word.

### The compliance run

Then the proposed page is loaded into the site shell (the theme and stylesheets a new site's `index.html` loads, from the create package's template, the proposed tokens as `styles/site.css`, and the runtime) in the same headless Chromium, and measured with the rule of each spec #982 named. It does not run the spec files: it runs the rule each spec imports, so the two cannot drift.

| Spec | Rule (shared with the spec) | In the run |
|---|---|---|
| `tests/compliance/no-data-attributes.spec.ts` | `scripts/lib/data-attributes.mjs` | the page's text, as the spec reads each file |
| `tests/regression/semantic-element-fidelity.spec.ts` | `scripts/lib/semantic-elements.mjs` | every element whose behavior's schema promises select, table, dialog, details or textarea delivers it |
| `tests/compliance/demo-layout-standards.spec.ts` | `scripts/lib/layout-checks.mjs` | the content-panel rule (no text within 1rem of a panel's edge); the x-demo rules have nothing to measure in a migrated page |
| `tests/compliance/no-element-overlap.spec.ts` | `scripts/lib/layout-checks.mjs` | no two painted elements overlap |

The results go in the report's Checks section. A failure there does not stop `--write`: it is for the reviewer.

## The sample

`tests/fixtures/site-migrate/riverbend-bakery.html` is an ordinary Bootstrap brochure page, and `tests/fixtures/site-migrate/lakeside/lakeside-yoga.html` (#1832) a studio page with its own stylesheet, images, a pricing table, two video players, tabs and SVG icons: div soup, framework classes, `data-bs-*` hooks, inline styles, an icon font and jQuery. What site-migrate proposes for it is committed beside it in `tests/fixtures/site-migrate/expected/`, and `tests/regression/site-migrate-prototype.spec.ts` checks the following:

- the output still matches the committed proposal;
- the input is never changed, and nothing is written without `--write`;
- the proposed page uses only registered behaviors and invents nothing;
- the proposed page runs on WB Starter, with cards, testimonial, hero, grid and details.

`tests/regression/site-migrate-v1.spec.ts` covers the v1 additions.

To change a rule, change `lib/extract.js`, rerun each sample with `--out <a scratch folder> --write`, copy `pages/<name>.html`, `<name>.migration.md` and `<name>.site.css` into `tests/fixtures/site-migrate/expected/` (not the copied assets), and review the diff as a person would.

## Not done yet

- **More than one page.** It does not follow links or migrate a whole site.
- **More tokens.** Hover and focus colours, fonts and shadows are not read, and stylesheets from other sites (a CDN) do not load, so what they set is not measured.
- **Carousels.**
