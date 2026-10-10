# site-migrate report: riverbend-bakery.html

Proposed page: `pages/riverbend-bakery.html`. It is a proposal: review every change below before you use it.
site-migrate v0 maps one static page onto WB Starter markup. It does not port CSS or scripts, and it never writes
content of its own: what it cannot classify stays in the page, word for word, under a `TODO: unclassified` comment.

## Summary

- 65 changes, each with its reason
- 3 unclassified regions for a person to decide
- 3 menu items and the page title proposed for `config/site.json`
- 8 assets to copy
- checks: all passed

## Changes

1. `head > link`
   - Was: `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">`
   - Now: `(removed)`
   - Why: Their CSS is not ported (only theme tokens carry over, #982).
2. `head > link`
   - Was: `<link href="css/theme.css">`
   - Now: `(removed)`
   - Why: Their CSS is not ported (only theme tokens carry over, #982).
3. `head > style`
   - Was: `<style>`
   - Now: `(removed)`
   - Why: Their CSS is not ported (only theme tokens carry over, #982).
4. `body > nav.navbar`
   - Was: `<nav class="navbar navbar-expand-lg navbar-light bg-light" role="navigation">`
   - Now: `config/site.json navigationMenu`
   - Why: Site navigation is built from config/site.json, not written into each page (Law 10). 3 menu item(s) proposed below.
5. `body > div.jumbotron:nth-of-type(1)`
   - Was: `<div class="jumbotron hero text-center py-5">`
   - Now: `<section x-hero>`
   - Why: A page hero in their markup; x-hero styles a section as the page hero (extensionMap 'x-hero' → hero). Dropped class="jumbotron hero text-center py-5", style="background-image: url(images/loaves.jpg)": their CSS is not ported (only theme tokens carry over, #982); no inline styles.
6. `body > div.jumbotron:nth-of-type(1) > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
7. `body > div.jumbotron:nth-of-type(1) > div.container > h1.display-4`
   - Was: `<h1 class="display-4">`
   - Now: `<h1>`
   - Why: Kept. Dropped class="display-4": their CSS is not ported (only theme tokens carry over, #982).
8. `body > div.jumbotron:nth-of-type(1) > div.container > p.lead`
   - Was: `<p class="lead">`
   - Now: `<p>`
   - Why: Kept. Dropped class="lead": their CSS is not ported (only theme tokens carry over, #982).
9. `body > div.jumbotron:nth-of-type(1) > div.container > a.btn`
   - Was: `<a class="btn btn-primary btn-lg" role="button">`
   - Now: `<a href="menu.html">`
   - Why: Kept. Dropped class="btn btn-primary btn-lg", role="button": their CSS is not ported (only theme tokens carry over, #982); the tag itself says what the element is.
10. `body > div.promo-strip:nth-of-type(2)`
   - Was: `<div class="promo-strip">`
   - Now: `<!-- TODO: unclassified --> + <div>`
   - Why: Not classified: a styled block whose meaning its markup does not say. Kept word for word under a TODO comment for a person to decide. Dropped class="promo-strip", style="background:#f60;padding:8px": their CSS is not ported (only theme tokens carry over, #982); no inline styles.
11. `body > section#bread`
   - Was: `<section id="bread" class="py-5">`
   - Now: `<section id="bread">`
   - Why: Kept. Dropped class="py-5": their CSS is not ported (only theme tokens carry over, #982).
12. `body > section#bread > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
13. `body > section#bread > div.container > h2.text-center`
   - Was: `<h2 class="text-center mb-4">`
   - Now: `<h2>`
   - Why: Kept. Dropped class="text-center mb-4": their CSS is not ported (only theme tokens carry over, #982).
14. `body > section#bread > div.container > div.row`
   - Was: `<div class="row">`
   - Now: `<div x-grid columns="3">`
   - Why: 3 repeated siblings in a 4-of-12 column grid; x-grid lays them out responsively (extensionMap 'x-grid' → grid), columns="3". Dropped class="row": their CSS is not ported (only theme tokens carry over, #982).
15. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1)`
   - Was: `<div class="col-md-4">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-md-4": their CSS is not ported (only theme tokens carry over, #982).
16. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card`
   - Was: `<div class="card h-100 shadow-sm">`
   - Now: `<article title="Country sourdough" subtitle="48-hour ferment">`
   - Why: A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0). The heading "Country sourdough" becomes title, "48-hour ferment" becomes subtitle (the card renders it in its header); the rest stays between the tags (#968). Dropped class="card h-100 shadow-sm": their CSS is not ported (only theme tokens carry over, #982).
17. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card > img.card-img-top`
   - Was: `<img class="card-img-top">`
   - Now: `<img src="images/sourdough.jpg" alt="A round sourdough loaf">`
   - Why: Kept. <img> auto-injects "img" (nativeMap 'img'). Dropped class="card-img-top": their CSS is not ported (only theme tokens carry over, #982).
18. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card > div.card-body`
   - Was: `<div class="card-body">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="card-body"); WB Starter's page layout replaces it, and its content stays.
19. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card > div.card-body > p.card-text`
   - Was: `<p class="card-text">`
   - Now: `<p>`
   - Why: Kept. Dropped class="card-text": their CSS is not ported (only theme tokens carry over, #982).
20. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card > div.card-body > a.btn`
   - Was: `<a class="btn btn-outline-primary">`
   - Now: `<a href="menu.html#sourdough">`
   - Why: Kept. Dropped class="btn btn-outline-primary": their CSS is not ported (only theme tokens carry over, #982).
21. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2)`
   - Was: `<div class="col-md-4">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-md-4": their CSS is not ported (only theme tokens carry over, #982).
22. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card`
   - Was: `<div class="card h-100 shadow-sm">`
   - Now: `<article title="Dark rye">`
   - Why: A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0). The heading "Dark rye" becomes title (the card renders it in its header); the rest stays between the tags (#968). Dropped class="card h-100 shadow-sm": their CSS is not ported (only theme tokens carry over, #982).
23. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card > img.card-img-top`
   - Was: `<img class="card-img-top">`
   - Now: `<img src="images/rye.jpg" alt="Sliced dark rye bread">`
   - Why: Kept. <img> auto-injects "img" (nativeMap 'img'). Dropped class="card-img-top": their CSS is not ported (only theme tokens carry over, #982).
24. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card > div.card-body`
   - Was: `<div class="card-body">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="card-body"); WB Starter's page layout replaces it, and its content stays.
25. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card > div.card-body > p.card-text`
   - Was: `<p class="card-text">`
   - Now: `<p>`
   - Why: Kept. Dropped class="card-text": their CSS is not ported (only theme tokens carry over, #982).
26. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card > div.card-body > a.btn`
   - Was: `<a class="btn btn-outline-primary">`
   - Now: `<a href="menu.html#rye">`
   - Why: Kept. Dropped class="btn btn-outline-primary": their CSS is not ported (only theme tokens carry over, #982).
27. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3)`
   - Was: `<div class="col-md-4">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-md-4": their CSS is not ported (only theme tokens carry over, #982).
28. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card`
   - Was: `<div class="card h-100 shadow-sm">`
   - Now: `<article title="Butter croissants">`
   - Why: A card in their markup; <article> IS a card in WB Starter (nativeMap 'article' → card, Law 0). The heading "Butter croissants" becomes title (the card renders it in its header); the rest stays between the tags (#968). Dropped class="card h-100 shadow-sm": their CSS is not ported (only theme tokens carry over, #982).
29. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > img.card-img-top`
   - Was: `<img class="card-img-top">`
   - Now: `<img src="images/croissant.jpg" alt="Three butter croissants">`
   - Why: Kept. <img> auto-injects "img" (nativeMap 'img'). Dropped class="card-img-top": their CSS is not ported (only theme tokens carry over, #982).
30. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body`
   - Was: `<div class="card-body">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="card-body"); WB Starter's page layout replaces it, and its content stays.
31. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body > p.card-text`
   - Was: `<p class="card-text">`
   - Now: `<p>`
   - Why: Kept. Dropped class="card-text": their CSS is not ported (only theme tokens carry over, #982).
32. `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > div.card-body > a.btn`
   - Was: `<a class="btn btn-outline-primary">`
   - Now: `<a href="menu.html#pastry">`
   - Why: Kept. Dropped class="btn btn-outline-primary": their CSS is not ported (only theme tokens carry over, #982).
33. `body > section#story`
   - Was: `<section id="story" class="bg-light py-5">`
   - Now: `<section id="story">`
   - Why: Kept. Dropped class="bg-light py-5": their CSS is not ported (only theme tokens carry over, #982).
34. `body > section#story > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
35. `body > section#story > div.container > div.photo`
   - Was: `<div class="photo">`
   - Now: `<figure>`
   - Why: An image with its caption; <figure> + <figcaption> say so natively, and <figure> auto-injects "figure" (nativeMap 'figure'). Dropped class="photo": their CSS is not ported (only theme tokens carry over, #982).
36. `body > section#story > div.container > div.photo > img`
   - Was: `<img>`
   - Now: `<img src="images/oven.jpg" alt="The wood-fired oven">`
   - Why: Unchanged. <img> auto-injects "img" (nativeMap 'img').
37. `body > section#story > div.container > p:nth-of-type(1) > i.fa`
   - Was: `<i class="fa fa-heart">`
   - Now: `(removed)`
   - Why: An icon-font glyph (class="fa fa-heart"); their icon font is not ported. Add an x-icon by hand if the icon matters.
38. `body > section#reviews`
   - Was: `<section id="reviews" class="py-5">`
   - Now: `<section id="reviews">`
   - Why: Kept. Dropped class="py-5": their CSS is not ported (only theme tokens carry over, #982).
39. `body > section#reviews > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
40. `body > section#reviews > div.container > div.testimonial`
   - Was: `<div class="testimonial">`
   - Now: `<article x-cardtestimonial author="Ana Ruiz" role="Regular since 2019" avatar="images/customer-ana.jpg" rating="5">`
   - Why: A quotation with its attribution; x-cardtestimonial is WB Starter's testimonial card (extensionMap 'x-cardtestimonial'). The quote stays between the tags, word for word (#968); author="Ana Ruiz", role="Regular since 2019", the photo becomes avatar, 5 ★ become rating="5" (copied from the attribution, not written). Dropped class="testimonial": their CSS is not ported (only theme tokens carry over, #982).
41. `body > section#faq`
   - Was: `<section id="faq" class="py-5">`
   - Now: `<section id="faq">`
   - Why: Kept. Dropped class="py-5": their CSS is not ported (only theme tokens carry over, #982).
42. `body > section#faq > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
43. `body > section#faq > div.container > div#faqAccordion`
   - Was: `<div id="faqAccordion" class="accordion">`
   - Now: `(unwrapped: one <details> per item)`
   - Why: An accordion; WB Starter's x-accordion is deprecated in favour of native <details>/<summary>, which needs no script (nativeMap 'details' → details). Dropped class="accordion": their CSS is not ported (only theme tokens carry over, #982).
44. `body > section#faq > div.container > div#faqAccordion > div.accordion-item:nth-of-type(1)`
   - Was: `<div class="accordion-item">`
   - Now: `<details open>`
   - Why: An accordion item: its header "When do you open?" becomes the <summary>, its panel the body (one run of text, so a <p>); it started expanded, so open. Dropped class="accordion-item": their CSS is not ported (only theme tokens carry over, #982).
45. `body > section#faq > div.container > div#faqAccordion > div.accordion-item:nth-of-type(2)`
   - Was: `<div class="accordion-item">`
   - Now: `<details>`
   - Why: An accordion item: its header "Do you bake gluten-free bread?" becomes the <summary>, its panel the body (one run of text, so a <p>). Dropped class="accordion-item": their CSS is not ported (only theme tokens carry over, #982).
46. `body > section#visit`
   - Was: `<section id="visit" class="py-5 bg-light">`
   - Now: `<section id="visit">`
   - Why: Kept. Dropped class="py-5 bg-light": their CSS is not ported (only theme tokens carry over, #982).
47. `body > section#visit > div.container`
   - Was: `<div class="container">`
   - Now: `(unwrapped)`
   - Why: A layout wrapper (class="container"); WB Starter's page layout replaces it, and its content stays.
48. `body > section#visit > div.container > table.table`
   - Was: `<table class="table table-striped">`
   - Now: `<table>`
   - Why: Kept. <table> auto-injects "table" (nativeMap 'table'). Dropped class="table table-striped": their CSS is not ported (only theme tokens carry over, #982).
49. `body > section#visit > div.container > form.row`
   - Was: `<form class="row g-3">`
   - Now: `<form x-grid columns="2" action="/contact" method="post">`
   - Why: 4 repeated siblings in a 6-of-12 column grid; x-grid lays them out responsively (extensionMap 'x-grid' → grid), columns="2". Dropped class="row g-3": their CSS is not ported (only theme tokens carry over, #982).
50. `body > section#visit > div.container > form.row > div.col-md-6:nth-of-type(1)`
   - Was: `<div class="col-md-6">`
   - Now: `<div>`
   - Why: A grid column; x-grid lays out its children itself, and a <div> keeps this column's pieces together in one cell. Dropped class="col-md-6": their CSS is not ported (only theme tokens carry over, #982).
51. `body > section#visit > div.container > form.row > div.col-md-6:nth-of-type(1) > label.form-label`
   - Was: `<label class="form-label">`
   - Now: `<label for="name">`
   - Why: Kept. <label> auto-injects "label" (nativeMap 'label'). Dropped class="form-label": their CSS is not ported (only theme tokens carry over, #982).
52. `body > section#visit > div.container > form.row > div.col-md-6:nth-of-type(1) > input#name`
   - Was: `<input id="name" class="form-control">`
   - Now: `<input type="text" id="name" name="name" required>`
   - Why: Kept. <input> auto-injects "input" (nativeMap 'input'). Dropped class="form-control": their CSS is not ported (only theme tokens carry over, #982).
53. `body > section#visit > div.container > form.row > div.col-md-6:nth-of-type(2)`
   - Was: `<div class="col-md-6">`
   - Now: `<div>`
   - Why: A grid column; x-grid lays out its children itself, and a <div> keeps this column's pieces together in one cell. Dropped class="col-md-6": their CSS is not ported (only theme tokens carry over, #982).
54. `body > section#visit > div.container > form.row > div.col-md-6:nth-of-type(2) > label.form-label`
   - Was: `<label class="form-label">`
   - Now: `<label for="email">`
   - Why: Kept. <label> auto-injects "label" (nativeMap 'label'). Dropped class="form-label": their CSS is not ported (only theme tokens carry over, #982).
55. `body > section#visit > div.container > form.row > div.col-md-6:nth-of-type(2) > input#email`
   - Was: `<input id="email" class="form-control">`
   - Now: `<input type="email" id="email" name="email" required>`
   - Why: Kept. <input> auto-injects "input" (nativeMap 'input'). Dropped class="form-control": their CSS is not ported (only theme tokens carry over, #982).
56. `body > section#visit > div.container > form.row > div.col-12:nth-of-type(3)`
   - Was: `<div class="col-12">`
   - Now: `<div>`
   - Why: A grid column; x-grid lays out its children itself, and a <div> keeps this column's pieces together in one cell. Dropped class="col-12": their CSS is not ported (only theme tokens carry over, #982).
57. `body > section#visit > div.container > form.row > div.col-12:nth-of-type(3) > label.form-label`
   - Was: `<label class="form-label">`
   - Now: `<label for="message">`
   - Why: Kept. <label> auto-injects "label" (nativeMap 'label'). Dropped class="form-label": their CSS is not ported (only theme tokens carry over, #982).
58. `body > section#visit > div.container > form.row > div.col-12:nth-of-type(3) > textarea#message`
   - Was: `<textarea id="message" class="form-control">`
   - Now: `<textarea id="message" name="message" rows="3">`
   - Why: Kept. <textarea> auto-injects "textarea" (nativeMap 'textarea'). Dropped class="form-control": their CSS is not ported (only theme tokens carry over, #982).
59. `body > section#visit > div.container > form.row > div.col-12:nth-of-type(4)`
   - Was: `<div class="col-12">`
   - Now: `(unwrapped: its content is the grid cell)`
   - Why: A grid column; x-grid lays out its children itself. Dropped class="col-12": their CSS is not ported (only theme tokens carry over, #982).
60. `body > section#visit > div.container > form.row > div.col-12:nth-of-type(4) > button.btn`
   - Was: `<button class="btn btn-primary">`
   - Now: `<button type="submit">`
   - Why: Kept. <button> auto-injects "button" (nativeMap 'button'). Dropped class="btn btn-primary", onclick: their CSS is not ported (only theme tokens carry over, #982); their scripts are not ported.
61. `body > section#visit > div.container > div.map-embed`
   - Was: `<div class="map-embed">`
   - Now: `<!-- TODO: unclassified --> + <div>`
   - Why: Not classified: it had onclick, which WB Starter cannot carry over; decide what it should do. Kept word for word under a TODO comment for a person to decide. Dropped class="map-embed", onclick: their CSS is not ported (only theme tokens carry over, #982); their scripts are not ported.
62. `body > footer.footer`
   - Was: `<footer class="footer mt-auto py-3 bg-dark text-white">`
   - Now: `config/site.json footerSettings`
   - Why: The site footer is part of the shell WB Starter builds from config/site.json, not of a page (Law 10: pages are fragments).
63. `body > script:nth-of-type(1)`
   - Was: `<script>`
   - Now: `(removed)`
   - Why: Their scripts are not ported; WB Starter behaviors replace them.
64. `body > script:nth-of-type(2)`
   - Was: `<script>`
   - Now: `(removed)`
   - Why: Their scripts are not ported; WB Starter behaviors replace them.
65. `body > script:nth-of-type(3)`
   - Was: `<script>`
   - Now: `(removed)`
   - Why: Their scripts are not ported; WB Starter behaviors replace them.

## Unclassified regions

| Where | Was | Text | What to decide |
|---|---|---|---|
| `body > div.promo-strip:nth-of-type(2)` | `<div class="promo-strip">` | Free delivery on Fridays within five miles. | a styled block whose meaning its markup does not say |
| `body > section#visit > div.container > div.map-embed` | `<div class="map-embed">` | Open the map to 12 Mill Lane | it had onclick, which WB Starter cannot carry over; decide what it should do |
| `body > footer.footer > div.container > p:nth-of-type(1)` | `<p>` | 12 Mill Lane, Riverbend | site footer content: config/site.json has no place for it. Put it on a page (a Contact page?) by hand. |

## Site shell: proposed `config/site.json` entries

Merge these into the site's `config/site.json` by hand; site-migrate does not edit it.

```json
{
  "branding": {
    "companyName": "Riverbend Bakery"
  },
  "navigationMenu": [
    {
      "menuItemId": "home",
      "menuItemText": "Home",
      "pageToLoad": "home"
    },
    {
      "menuItemId": "menu",
      "menuItemText": "Our Bread",
      "pageToLoad": "menu"
    },
    {
      "menuItemId": "about",
      "menuItemText": "About Us",
      "pageToLoad": "about"
    }
  ],
  "footerSettings": {
    "footerCopyrightText": "© 2026 Riverbend Bakery. All rights reserved."
  },
  "searchEngineOptimization": {
    "pageTitle": "Riverbend Bakery | Fresh bread every morning",
    "pageDescription": "Riverbend Bakery bakes sourdough, rye and pastries by hand every morning."
  }
}
```

Links in the navigation that are not pages, so they are not in the menu:

- Visit (`#visit`): an anchor on this page, not a page
- Instagram (`https://www.instagram.com/`): a link to another site, not a page of this one

## Assets

| Kind | URL | Used by | Status |
|---|---|---|---|
| icon | `images/favicon.png` | `head > link:nth-of-type(1)` | missing next to the source |
| image (from inline style) | `images/loaves.jpg` | `body > div.jumbotron:nth-of-type(1)` | missing next to the source |
| image | `images/sourdough.jpg` | `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(1) > div.card > img.card-img-top` | missing next to the source |
| image | `images/rye.jpg` | `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(2) > div.card > img.card-img-top` | missing next to the source |
| image | `images/croissant.jpg` | `body > section#bread > div.container > div.row > div.col-md-4:nth-of-type(3) > div.card > img.card-img-top` | missing next to the source |
| image | `images/oven.jpg` | `body > section#story > div.container > div.photo > img` | missing next to the source |
| download | `files/price-list.pdf` | `body > section#story > div.container > p:nth-of-type(2) > a` | missing next to the source |
| image | `images/customer-ana.jpg` | `body > section#reviews > div.container > div.testimonial > img.rounded-circle` | missing next to the source |

## Checks

- PASS: every x-* attribute is in extensionMap: x-cardtestimonial, x-grid, x-hero
- PASS: native elements that auto-inject a behavior (nativeMap): article → card, button → button, details → details, figure → figure, form → form, img → img, input → input, label → label, table → table, textarea → textarea
- PASS: no class, style, data-* or on* attributes
- PASS: no script, style, link or meta elements: the page is a fragment (Law 10)
- PASS: every piece of text in the page is in the source page, word for word: nothing invented

## Not done by v0

- Theme tokens (palette, type scale, spacing) are not extracted from their CSS.
- The proposed page is not yet run through the compliance suite.
- One page at a time; links between pages are not followed.
