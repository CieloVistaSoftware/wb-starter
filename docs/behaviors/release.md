# Release - wb-starter v3.0

Displays the site's build/release number — the one canonical place any element
renders the version. Reads a single source of truth
([`src/core/version.js`](../../src/core/version.js)'s `VERSION` export, stamped by
`scripts/stamp-version.js` on every commit) instead of a hardcoded literal.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `release` |
| Attribute | `x-release` |
| Custom Tag | `<div x-release>` |
| Applies to | any element (typically a `<span>` or `<a>`) |
| Category | Content |
| Source | `src/wb-viewmodels/release.js` |

Both forms run the same behavior: `<span x-release>` and `<div x-release>` are
equivalent — the tag form is registered in the tag map
([`src/core/tag-map.js`](../../src/core/tag-map.js)) and dispatches to the identical
`release()` function. `autoInject` is on by default site-wide
([`src/core/config.js`](../../src/core/config.js)), so `x-release` activates
without any manual `WB.scan()` call.

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `format` | `format` | string (template) | `"v{version}"` | Template string; `{version}`, `{commit}`, and `{built}` tokens are replaced with the live build values |
| `reload` | `reload` | boolean | `true` | When true, clicking the element clears the Cache Storage/service-worker cache and reloads with a cache-busted URL. Set `reload="false"` to render as plain, non-interactive text |

## Usage

### Default

<wb-demo>
<span x-release></span>
</wb-demo>

### Custom format showing the commit and build time

<wb-demo>
<span x-release format="{version} ({commit}) — built {built}"></span>
</wb-demo>

### Non-interactive (no click-to-reload)

<wb-demo>
<span x-release reload="false"></span>
</wb-demo>

### Custom Tag

<wb-demo>
<div x-release></div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.wb-release` | Always | Small, muted text styling (`font-size: 0.7em`, `color: var(--text-muted)`) |
| `.wb-release--clickable` | `reload` is not `"false"` | Pointer cursor and a hover underline/color change to signal it's clickable |

## Accessibility

The element's `title` attribute is set to the full build string (commit + build
time), so hovering or using a screen reader's title-inspection surfaces the exact
build even when `format` only shows a short version string. When `reload` is
enabled, the title also states "tap to clear cache and reload" so the click
behavior isn't a silent surprise. There's no dedicated `aria-label` beyond the
`title`/rendered text, and the reload interaction is a real page navigation
(`location.href` reassignment), not an in-place update — screen readers will
announce the resulting page load like any other navigation.

## Source

[src/wb-viewmodels/release.js](../../src/wb-viewmodels/release.js)
