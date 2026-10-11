# site-migrate report: lakeside-yoga.html

Proposed page: `pages/lakeside-yoga.html`. It is a proposal: review every change below before you use it.
site-migrate maps one static page onto WB Starter markup. It does not port CSS or scripts, and it never writes
content of its own: what it cannot classify stays in the page, word for word, under a `TODO: unclassified` comment.

## Summary

- 45 changes, each with its reason
- 1 unclassified region for a person to decide
- 2 menu items and the page title proposed for `config/site.json`
- 18 theme tokens proposed in `lakeside-yoga.site.css`
- 5 assets, 4 found and copied by `--write`
- checks: all passed
- compliance run: 4 of 4 passed

## Changes

1. `head > link`
   - Was: `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">`
   - Now: `(removed)`
   - Why: Their CSS is not ported (only theme tokens carry over, #982).
2. `head > link`
   - Was: `<link href="css/studio.css">`
   - Now: `(removed)`
   - Why: Their CSS is not ported (only theme tokens carry over, #982).
3. `body > nav.navbar`
   - Was: `<nav class="navbar navbar-expand-lg" role="navigation">`
   - Now: `config/site.json navigationMenu`
   - Why: Site navigation is built from config/site.json, not written into each page (Law 10). 2 menu item(s) proposed below.
4. `body > div.hero`
   - Was: `<div class="hero">`
   - Now: `<section x-hero>`
   - Why: A page hero in their markup; x-hero styles a section as the page hero (extensionMap 'x-hero' → hero). Dropped class="hero", style="background-image: url(images/lake.svg)": their CSS is not ported (only theme tokens carry over, #982); no inline styles.
5. `body > div.hero > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
6. `body > div.hero > div.container > p.lead`
   - Was: `<p class="lead">`
   - Now: `<p>`
   - Why: Kept. Dropped class="lead": their CSS is not ported (only theme tokens carry over, #982).
7. `body > section#why`
   - Was: `<section id="why" class="section">`
   - Now: `<section id="why">`
   - Why: Kept. Dropped class="section": their CSS is not ported (only theme tokens carry over, #982).
8. `body > section#why > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
9. `body > section#why > div.container > ul.features`
   - Was: `<ul class="features">`
   - Now: `<ul>`
   - Why: Kept. Dropped class="features": their CSS is not ported (only theme tokens carry over, #982).
10. `body > section#why > div.container > ul.features > li:nth-of-type(1) > svg.icon`
   - Was: `<svg class="icon">`
   - Now: `<span x-icon> + <svg>`
   - Why: An inline SVG icon (20x20px); x-icon sizes it to the text beside it (extensionMap 'x-icon'). The drawing is kept as it is. Dropped class="icon".
11. `body > section#why > div.container > ul.features > li:nth-of-type(2) > svg.icon`
   - Was: `<svg class="icon">`
   - Now: `<span x-icon> + <svg>`
   - Why: An inline SVG icon (20x20px); x-icon sizes it to the text beside it (extensionMap 'x-icon'). The drawing is kept as it is. Dropped class="icon".
12. `body > section#why > div.container > svg.wave`
   - Was: `<svg class="wave" role="img">`
   - Now: `<!-- TODO: unclassified --> + <svg>`
   - Why: Not classified: an inline drawing (600x120px), too big to be an icon: keep it inline, or save it as an .svg file and use <img> with alt text. Kept as it is under a TODO comment for a person to decide. Dropped class="wave".
13. `body > section#pricing`
   - Was: `<section id="pricing" class="section bg-soft">`
   - Now: `<section id="pricing">`
   - Why: Kept. Dropped class="section bg-soft": their CSS is not ported (only theme tokens carry over, #982).
14. `body > section#pricing > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
15. `body > section#pricing > div.container > div.row`
   - Was: `<div class="row">`
   - Now: `<div x-grid columns="3">`
   - Why: 3 repeated siblings in a 4-of-12 column grid; x-grid lays them out responsively (extensionMap 'x-grid' → grid), columns="3". Dropped class="row": their CSS is not ported (only theme tokens carry over, #982).
16. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(1)`
   - Was: `<div class="col-md-4">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-md-4": their CSS is not ported (only theme tokens carry over, #982).
17. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card`
   - Was: `<div class="card pricing-card">`
   - Now: `<article x-cardpricing plan="Drop-in" price="$18" period="/class" features="Any one class, Mat included" cta="Book a class" cta-href="classes.html#book">`
   - Why: A pricing card; x-cardpricing is WB Starter's pricing card (extensionMap 'x-cardpricing'). Every piece of it is copied into an attribute, word for word: the plan name, the price and its period, 2 features and the call to action. Dropped class="card pricing-card": their CSS is not ported (only theme tokens carry over, #982).
18. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(2)`
   - Was: `<div class="col-md-4">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-md-4": their CSS is not ported (only theme tokens carry over, #982).
19. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card`
   - Was: `<div class="card pricing-card featured">`
   - Now: `<article x-cardpricing plan="Monthly" price="$120" period="/month" description="Our most flexible plan." features="Unlimited classes, One guest pass, Locker" cta="Join now" cta-href="join.html" featured>`
   - Why: A pricing card; x-cardpricing is WB Starter's pricing card (extensionMap 'x-cardpricing'). Every piece of it is copied into an attribute, word for word: the plan name, the price and its period, the description, 3 features and the call to action. It was marked as the featured plan (class="card pricing-card featured"), so featured. Dropped class="card pricing-card featured": their CSS is not ported (only theme tokens carry over, #982).
20. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3)`
   - Was: `<div class="col-md-4">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-md-4": their CSS is not ported (only theme tokens carry over, #982).
21. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card`
   - Was: `<div class="card pricing-card">`
   - Now: `<article title="Ten-class pass">`
   - Why: A pricing card, but not x-cardpricing: a feature has a comma in it, and x-cardpricing's features attribute is split on commas. A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0). The heading "Ten-class pass" becomes title (the card renders it in its header); the rest stays between the tags (#968). Dropped class="card pricing-card": their CSS is not ported (only theme tokens carry over, #982).
22. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-header:nth-of-type(1)`
   - Was: `<div class="card-header">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="card-header"); WB Starter's page layout replaces it, and its content stays.
23. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body:nth-of-type(2)`
   - Was: `<div class="card-body">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="card-body"); WB Starter's page layout replaces it, and its content stays.
24. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body:nth-of-type(2) > h3.pricing-card-title`
   - Was: `<h3 class="pricing-card-title">`
   - Now: `<h3>`
   - Why: Kept. Dropped class="pricing-card-title": their CSS is not ported (only theme tokens carry over, #982).
25. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body:nth-of-type(2) > ul.list-unstyled`
   - Was: `<ul class="list-unstyled">`
   - Now: `<ul>`
   - Why: Kept. Dropped class="list-unstyled": their CSS is not ported (only theme tokens carry over, #982).
26. `body > section#pricing > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body:nth-of-type(2) > a.btn`
   - Was: `<a class="btn btn-outline-primary">`
   - Now: `<a href="join.html#pass">`
   - Why: Kept. Dropped class="btn btn-outline-primary": their CSS is not ported (only theme tokens carry over, #982).
27. `body > section#schedule`
   - Was: `<section id="schedule" class="section">`
   - Now: `<section id="schedule">`
   - Why: Kept. Dropped class="section": their CSS is not ported (only theme tokens carry over, #982).
28. `body > section#schedule > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
29. `body > section#schedule > div.container > ul#scheduleTabs`
   - Was: `<ul id="scheduleTabs" class="nav nav-tabs" role="tablist">`
   - Now: `(removed)`
   - Why: The tab buttons of a tab set; x-tabs builds its own from each panel's tab-title ("Mornings", "Evenings").
30. `body > section#schedule > div.container > div#scheduleTabsContent`
   - Was: `<div id="scheduleTabsContent" class="tab-content">`
   - Now: `<div x-tabs active-tab="1">`
   - Why: A tab set; x-tabs builds the tab buttons from its panels (extensionMap 'x-tabs'). Each panel's tab label becomes its tab-title, and tab 2 ("Evenings") started open, so active-tab="1". Dropped class="tab-content": their CSS is not ported (only theme tokens carry over, #982).
31. `body > section#schedule > div.container > div#scheduleTabsContent > div#morning`
   - Was: `<div id="morning" class="tab-pane fade" role="tabpanel">`
   - Now: `<div tab-title="Mornings">`
   - Why: Tab panel 1, labelled "Mornings" by its tab. Its id and aria-labelledby go: x-tabs gives each panel its own id and label. Dropped class="tab-pane fade", role="tabpanel": their CSS is not ported (only theme tokens carry over, #982); the tag itself says what the element is.
32. `body > section#schedule > div.container > div#scheduleTabsContent > div#evening`
   - Was: `<div id="evening" class="tab-pane fade show active" role="tabpanel">`
   - Now: `<div tab-title="Evenings">`
   - Why: Tab panel 2, labelled "Evenings" by its tab. Its id and aria-labelledby go: x-tabs gives each panel its own id and label. Dropped class="tab-pane fade show active", role="tabpanel": their CSS is not ported (only theme tokens carry over, #982); the tag itself says what the element is.
33. `body > section#videos`
   - Was: `<section id="videos" class="section bg-soft">`
   - Now: `<section id="videos">`
   - Why: Kept. Dropped class="section bg-soft": their CSS is not ported (only theme tokens carry over, #982).
34. `body > section#videos > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
35. `body > section#videos > div.container > div.ratio:nth-of-type(1)`
   - Was: `<div class="ratio ratio-16x9">`
   - Now: `(unwrapped)`
   - Why: A <div> that only carried their styling; its content stays. Dropped class="ratio ratio-16x9": their CSS is not ported (only theme tokens carry over, #982).
36. `body > section#videos > div.container > div.ratio:nth-of-type(1) > iframe`
   - Was: `<iframe>`
   - Now: `<div x-youtube url="https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0">`
   - Why: A YouTube player; x-youtube embeds it (extensionMap 'x-youtube'), reading the video id from the same URL. Their title="Ten-minute morning flow" is not carried over: the behavior builds its own <iframe>.
37. `body > section#videos > div.container > div.ratio:nth-of-type(2)`
   - Was: `<div class="ratio ratio-16x9">`
   - Now: `(unwrapped)`
   - Why: A <div> that only carried their styling; its content stays. Dropped class="ratio ratio-16x9": their CSS is not ported (only theme tokens carry over, #982).
38. `body > section#videos > div.container > div.ratio:nth-of-type(2) > iframe`
   - Was: `<iframe>`
   - Now: `<div x-vimeo video-id="76979871" muted>`
   - Why: A Vimeo player; x-vimeo embeds it (extensionMap 'x-vimeo') from the video id in its URL. The URL asked for muted, so that attribute is set. Their title="Breathing basics" is not carried over: the behavior builds its own <iframe>.
39. `body > section#teachers`
   - Was: `<section id="teachers" class="section">`
   - Now: `<section id="teachers">`
   - Why: Kept. Dropped class="section": their CSS is not ported (only theme tokens carry over, #982).
40. `body > section#teachers > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
41. `body > section#teachers > div.container > div.photo`
   - Was: `<div class="photo">`
   - Now: `<figure>`
   - Why: An image with its caption; <figure> + <figcaption> say so natively, and <figure> auto-injects "figure" (nativeMap 'figure'). Dropped class="photo": their CSS is not ported (only theme tokens carry over, #982).
42. `body > section#teachers > div.container > div.photo > img`
   - Was: `<img>`
   - Now: `<img src="images/teachers/maya.svg" alt="Maya on the dock">`
   - Why: Unchanged. <img> auto-injects "img" (nativeMap 'img').
43. `body > section#teachers > div.container > p > img`
   - Was: `<img>`
   - Now: `<img src="images/mat-rack.jpg" alt="The mat rack">`
   - Why: Unchanged. <img> auto-injects "img" (nativeMap 'img').
44. `body > footer.site-footer`
   - Was: `<footer class="site-footer">`
   - Now: `config/site.json footerSettings`
   - Why: The site footer is part of the shell WB Starter builds from config/site.json, not of a page (Law 10: pages are fragments).
45. `body > script`
   - Was: `<script>`
   - Now: `(removed)`
   - Why: Their scripts are not ported; WB Starter behaviors replace them.

## Unclassified regions

| Where | Was | Text | What to decide |
|---|---|---|---|
| `body > section#why > div.container > svg.wave` | `<svg class="wave" role="img">` | A drawing of the lake | an inline drawing (600x120px), too big to be an icon: keep it inline, or save it as an .svg file and use <img> with alt text |

## Site shell: proposed `config/site.json` entries

Merge these into the site's `config/site.json` by hand; site-migrate does not edit it.

```json
{
  "branding": {
    "companyName": "Lakeside Yoga"
  },
  "navigationMenu": [
    {
      "menuItemId": "home",
      "menuItemText": "Home",
      "pageToLoad": "home"
    },
    {
      "menuItemId": "classes",
      "menuItemText": "Classes",
      "pageToLoad": "classes"
    }
  ],
  "footerSettings": {
    "footerCopyrightText": "© 2026 Lakeside Yoga"
  },
  "searchEngineOptimization": {
    "pageTitle": "Lakeside Yoga | Classes by the water",
    "pageDescription": "Lakeside Yoga runs small classes for every level, morning and evening."
  }
}
```

## Theme tokens: proposed `styles/site.css` overrides

Measured from the computed styles of the rendered source page and mapped onto tokens that `src/styles/themes.css` defines.
No rule of theirs is copied. `--write` writes them to `lakeside-yoga.site.css`; merge what you keep into `styles/site.css` by hand.

| Token | Proposed | Measured from |
|---|---|---|
| `--bg-color` | `#fbfaf7` | the page background (body) |
| `--text-primary` | `#1f2d3d` | most of the text (7 elements, e.g. h2, li, p) |
| `--text-muted` | `#6b7a89` | the quieter text (2 elements, e.g. p.caption, p) |
| `--primary` | `#2a7d6f` | the filled buttons (1 element, e.g. a.btn) |
| `--bg-secondary` | `#eef4f2` | the largest tinted area (2 elements, e.g. section#pricing, section#videos) |
| `--border-color` | `#d5dfdc` | the bordered boxes (3 elements, e.g. div.card) |
| `--text-base` | `1.0625rem` | 17px, the size of most of the text (e.g. li, p) |
| `--text-sm` | `0.875rem` | 14px (e.g. small, p.caption) |
| `--text-lg` | `1.25rem` | 20px (e.g. p.lead, h4) |
| `--text-xl` | `1.5rem` | 24px (e.g. h3.pricing-card-title) |
| `--text-2xl` | `1.875rem` | 30px (e.g. h2) |
| `--text-3xl` | `2.75rem` | 44px (e.g. h1) |
| `--space-xs` | `0.5rem` | 8px, 16 uses (e.g. li, div.card-header, h3.pricing-card-title) |
| `--space-sm` | `0.875rem` | 14px, 2 uses (e.g. p.caption) |
| `--space-md` | `1rem` | 16px, 50 uses (e.g. div.container, h1, h2) |
| `--space-lg` | `1.25rem` | 20px, 2 uses (e.g. p.lead) |
| `--space-xl` | `1.5rem` | 24px, 18 uses (e.g. div.row, div.card, div.ratio) |
| `--space-2xl` | `3rem` | 48px, 10 uses (e.g. section#why, section#pricing, section#schedule) |

Measured, but not proposed:

- 64px spacing (2 uses, e.g. div.hero): used less than the 6 spacing steps kept

## Assets

`--write` copies every asset marked found into `--out`, at the same relative path: a page is loaded into the site's `index.html`, so its relative URLs resolve from there.

| Kind | URL | Used by | Status |
|---|---|---|---|
| icon | `images/favicon.svg` | `head > link:nth-of-type(1)` | found |
| image (from inline style) | `images/lake.svg` | `body > div.hero` | found |
| download | `files/timetable.csv` | `body > section#schedule > div.container > div#scheduleTabsContent > div#evening > p:nth-of-type(2) > a` | found |
| image | `images/teachers/maya.svg` | `body > section#teachers > div.container > div.photo > img` | found |
| image | `images/mat-rack.jpg` | `body > section#teachers > div.container > p > img` | missing next to the source |

## Checks

The proposed page must pass these before anything is written:

- PASS: every x-* attribute is in extensionMap: x-cardpricing, x-grid, x-hero, x-icon, x-tabs, x-vimeo, x-youtube
- PASS: native elements that auto-inject a behavior (nativeMap): article → card, figure → figure, img → img
- PASS: no class, style, data-* or on* attributes
- PASS: no script, style, link or meta elements: the page is a fragment (Law 10)
- PASS: every piece of text in the page is in the source page, word for word: nothing invented

### Compliance run

The proposed page, loaded into the site shell (the theme and stylesheets a new site's `index.html` loads, with the proposed tokens as `styles/site.css`, and the runtime) in headless Chromium at 1280x720, measured with the same rule as each spec. The rule comes from the module the spec imports.

- PASS: no-data-attributes (`tests/compliance/no-data-attributes.spec.ts`): no data-* attributes (the spec allows only data-theme, data-code-width, data-x-expected-errors, which a page does not use)
- PASS: semantic-element-fidelity (`tests/regression/semantic-element-fidelity.spec.ts`): no element's behavior promises one of select, table, dialog, details, textarea, so there is nothing to check
- PASS: demo-layout-standards (`tests/compliance/demo-layout-standards.spec.ts`): no text within 1rem of a content-panel edge. Its x-demo rules (§2, §7, §13 spacing) have nothing to measure: the page has no x-demo blocks, which the spec skips too
- PASS: no-element-overlap (`tests/compliance/no-element-overlap.spec.ts`): no two painted elements overlap

Not reproduced here: the specs run against every page in `pages/` and `demos/` on the dev server, inside the full site with its header, menu and footer; this run draws only `<main>`.

## Not done yet

- One page at a time; links between pages are not followed.
- Hover and focus colours, fonts and shadows are not read for theme tokens, and stylesheets from other sites (a CDN)
  do not load, so what they set is not measured.
