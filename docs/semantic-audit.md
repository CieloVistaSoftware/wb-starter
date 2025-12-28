# Semantic HTML Audit Report

## Summary

**Status: 🟡 IN PROGRESS - Core Cards Fixed**

---

## Completed Fixes ✅

### card.js - ALL 20 Variants Fixed
Every card variant now uses semantic HTML5 elements:

| Variant | Container | Children |
|---------|-----------|----------|
| `card` | validates ARTICLE | `<header>`, `<main>`, `<footer>` |
| `cardimage` | validates ARTICLE | `<figure>`, `<header>` |
| `cardvideo` | validates ARTICLE | `<figure>`, `<header>` |
| `cardbutton` | validates ARTICLE | `<header>`, `<main>`, `<footer>` |
| `cardhero` | validates ARTICLE | `<header>` (hero content) |
| `cardprofile` | validates ARTICLE | `<figure>`, `<header>`, `<main>` |
| `cardpricing` | validates ARTICLE | `<header>`, `<main>`, `<footer>` |
| `cardstats` | validates ARTICLE | `<header>`, `<main>` with `<data>` |
| `cardtestimonial` | validates ARTICLE | `<blockquote>`, `<footer>` with `<cite>` |
| `cardproduct` | validates ARTICLE | `<figure>`, `<header>`, `<main>` with `<data>`, `<footer>` |
| `cardnotification` | validates ASIDE | `<main>` with role="alert" |
| `cardfile` | validates ARTICLE | `<header>`, `<main>`, `<footer>` |
| `cardlink` | validates ARTICLE | `<header>`, `<main>`, `<footer>` |
| `cardhorizontal` | validates ARTICLE | `<figure>`, `<main>` |
| `cardoverlay` | validates ARTICLE | `<header>` |
| `carddraggable` | validates ARTICLE | `<header>`, `<main>` |
| `cardexpandable` | validates ARTICLE | `<header>`, `<main>`, `<footer>` |
| `cardminimizable` | validates ARTICLE | `<header>`, `<main>` |
| `cardportfolio` | validates ARTICLE | `<figure>`, `<header>`, `<main>`, `<footer>` with `<nav>`, `<address>` |

### modal.js - Fixed
- Now uses native `<dialog>` element
- Children: `<header>`, `<main>`, `<footer>`
- Native accessibility: focus trapping, ESC to close, aria-modal

### Schemas Updated
- ✅ card.schema.json - Added semantic section, containerTag requirements
- ✅ cardimage.schema.json - FIGURE for images, HEADER for title
- ✅ cardtestimonial.schema.json - BLOCKQUOTE, CITE, FOOTER
- ✅ cardproduct.schema.json - FIGURE, HEADER, MAIN with DATA, FOOTER
- ✅ cardstats.schema.json - HEADER, MAIN with DATA element
- ✅ modal.schema.json - DIALOG element requirements

---

## Remaining Work 🔴

### Behavior Files Still Need Fixing

| File | Issue | Fix Needed |
|------|-------|------------|
| `accordion.js` | Uses `<div>` for items | Use `<section>` or `<details>/<summary>` |
| `tabs.js` | Uses `<div>` for panels | Use `<nav>` for tabs, `<section>` for panels |
| `dropdown.js` | Uses `<div>` for menu | Use `<menu>` or `<ul>/<li>` |
| `feedback.js` | Toast uses `<div>` | Toast container could be `<aside>` |
| `inputs.js` | Tags uses `<span>` | Tags should be `<ul>/<li>` |

### Schemas Still Need Updating

| Schema | Status |
|--------|--------|
| accordion.schema.json | ❌ Needs semantic section |
| tabs.schema.json | ❌ Needs semantic section |
| cardbutton.schema.json | ❌ Needs semantic section |
| cardhero.schema.json | ❌ Needs semantic section |
| cardprofile.schema.json | ❌ Needs semantic section |
| cardpricing.schema.json | ❌ Needs semantic section |
| cardfile.schema.json | ❌ Needs semantic section |
| cardlink.schema.json | ❌ Needs semantic section |
| cardhorizontal.schema.json | ❌ Needs semantic section |
| cardoverlay.schema.json | ❌ Needs semantic section |
| carddraggable.schema.json | ❌ Needs semantic section |
| cardexpandable.schema.json | ❌ Needs semantic section |
| cardminimizable.schema.json | ❌ Needs semantic section |
| cardportfolio.schema.json | ❌ Needs semantic section |
| cardnotification.schema.json | ❌ Needs semantic section |
| cardvideo.schema.json | ❌ Needs semantic section |

---

## Validation Function Added

`card.js` now includes a `validateSemanticContainer()` function that:
- Errors if container is not in allowed list
- Warns if `<div>` is used instead of `<article>`

```javascript
function validateSemanticContainer(element, behaviorName) {
  const tag = element.tagName;
  if (!ALLOWED_TAGS.includes(tag)) {
    console.error(`[WB:${behaviorName}] Invalid container tag <${tag.toLowerCase()}>. Use <article> or <section>.`);
  } else if (tag === 'DIV') {
    console.warn(`[WB:${behaviorName}] Using <div> - consider using <article> for better semantics.`);
  }
}
```

---

## Next Steps

1. **Fix accordion.js** - Convert to `<details>/<summary>` or `<section>/<header>/<main>`
2. **Fix tabs.js** - Use `<nav>` for tab list, `<section>` for panels
3. **Fix dropdown.js** - Use `<menu>` for dropdown menu
4. **Update remaining schemas** - Add semantic section to all card variant schemas
5. **Update builder.js** - Ensure components are created with correct element tags

---

## Standard Reference

See `docs/semantic-standard.md` for the complete semantic HTML5 standard that all behaviors must follow.

---

*Last Updated: December 2024*
