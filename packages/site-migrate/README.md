# site-migrate

Propose a [WB Starter](../../README.md) page for an existing HTML page. Every change is listed with its reason for a person to review.

**Assisted, not autonomous.** site-migrate does the mechanical part of moving a page onto WB Starter. It turns `div` soup into native HTML5 elements, maps cards, heroes, testimonials, accordions and grids onto WB Starter's behaviors, drops the old CSS and scripts, and lists the assets. A person reviews every change. It never writes content of its own. What it cannot classify stays in the page, word for word, under a `<!-- TODO: unclassified -->` comment.

This is **v0** (#982): one page, static after render. It is a prototype for seeing what such a tool outputs, not a finished migrator.

## Usage

```powershell
node packages/site-migrate/bin/site-migrate.js old-site/index.html
node packages/site-migrate/bin/site-migrate.js old-site/index.html --write
node packages/site-migrate/bin/site-migrate.js old-site/about.html --out my-site --write
```

| Option | Default | What it does |
|---|---|---|
| *(none)* | | Print the review list and the proposed page. Nothing is written. |
| `--write` | off | Write `pages/<name>.html` and `<name>.migration.md` into `--out` |
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
  - **Checks:** the proposed page passed these before anything was written (see below).

## The rules

Every rule maps onto markup WB Starter already has. That is either a native element that auto-injects its behavior (`nativeMap` in `src/core/tag-map.js`) or an `x-*` attribute in `extensionMap`. A rule that asks for an `x-*` attribute the registry does not list stops the run.

| In the old page | In the proposed page | Why |
|---|---|---|
| `div.card` / `.panel` / `.tile` | `<article title="…" subtitle="…">` | `<article>` IS a card (nativeMap `article` → card). The heading becomes `title`, and the rest stays between the tags (#968). |
| `.hero` / `.jumbotron` / `.masthead` / `.banner` | `<section x-hero>` | extensionMap `x-hero` |
| `.testimonial`, `blockquote` with an attribution | `<article x-cardtestimonial author="…" role="…">quote</article>` | extensionMap `x-cardtestimonial`. The quote stays between the tags. Author, role, avatar and ★ rating are copied from the attribution. |
| `.accordion` items | `<details><summary>…</summary>…</details>` | x-accordion is deprecated in favour of native `<details>` (nativeMap `details`) |
| an image with a caption | `<figure>` + `<figcaption>` | nativeMap `figure` |
| `.row` of `.col-*` columns | `<div x-grid columns="N">` (a `<form>` keeps its tag) | extensionMap `x-grid`. N comes from the column width. |
| `.container`, `.col-*`, `.card-body` and other layout wrappers | unwrapped | WB Starter's layout replaces them |
| `<nav>`, `<header>`, `<footer>` outside the content | `config/site.json` | The shell is built from site.json, not written into each page |
| `<main>` | unwrapped | The shell supplies `<main>` (Law 10) |
| `class`, `style`, `data-*`, `on*` | dropped | No inline styles, no `data-*`, and their CSS and scripts are not ported |
| icon-font glyphs (`<i class="fa …">`) | removed, and listed | Their icon font is not ported |
| a styled `div` with text, an element with a click handler, `<svg>`, `<iframe>` | kept under `<!-- TODO: unclassified -->`, or listed | A person decides |

## The checks

The proposed page is written only if all of these pass:

- every `x-*` attribute is in `extensionMap`;
- no `class`, `style`, `data-*` or `on*` attribute is left;
- no `script`, `style`, `link` or `meta` element is left, so the page is a fragment;
- **nothing is invented:** every piece of text in the page, and every `title`, `subtitle`, `author` and `role` value, appears in the source page word for word.

## The sample

`tests/fixtures/site-migrate/riverbend-bakery.html` is an ordinary Bootstrap brochure page: div soup, framework classes, `data-bs-*` hooks, inline styles, an icon font and jQuery. What site-migrate proposes for it is committed beside it in `tests/fixtures/site-migrate/expected/`, and `tests/regression/site-migrate-prototype.spec.ts` checks the following:

- the output still matches the committed proposal;
- the input is never changed, and nothing is written without `--write`;
- the proposed page uses only registered behaviors and invents nothing;
- the proposed page runs on WB Starter, with cards, testimonial, hero, grid and details.

To change a rule, change `lib/extract.js`, rerun the sample with `--out tests/fixtures/site-migrate/expected --write`, and review the diff of `expected/` as a person would.

## Not done by v0

- **Theme tokens.** It does not read the old CSS for a palette, type scale or spacing.
- **Compliance.** The proposed page is not run through the compliance suite (`semantic-element-fidelity`, `no-element-overlap`, ...).
- **More than one page.** It does not follow links or migrate a whole site, and it does not copy assets.
- **More patterns.** It does not handle pricing tables, carousels, tabs, video embeds or inline SVG; these are listed as unclassified.
