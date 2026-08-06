# Sidebar Layout - wb-starter v3.0

A two-column layout: a fixed-ish sidebar next to a main content area that
grows to fill the remaining space. Built on flexbox with the
[Every Layout "sidebar" pattern](https://every-layout.dev/layouts/sidebar/) —
`flex-grow: 999` on the main area means it takes all the room the sidebar
doesn't need, and the whole row wraps to a single column once the main area
would drop below `contentMin`.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `sidebarlayout` (alias: `sidebar-layout`) |
| Attribute | `x-sidebarlayout` or `x-sidebar-layout` |
| Applies to | a container with exactly 2 direct children |
| Category | Layout |
| Source | `src/wb-viewmodels/layouts.js` |

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `side` | `side` | string | `"left"` | Which child is the sidebar: `left` (1st child) or anything else (2nd child) |
| `sideWidth` | `side-width` | string | `"300px"` | `flex-basis` of the sidebar child |
| `contentMin` | `content-min` | string | `"50%"` | `min-width` of the main content child — forces a wrap to a single column below this width |
| `gap` | `gap` | string | `"1rem"` | Gap between the sidebar and the main content |

The container must have **at least 2 direct children** — the first two
children are treated as the sidebar and main content pair (which one is the
sidebar depends on `side`).

## Usage

### Sidebar on the left (default)

<wb-demo>
<div x-sidebarlayout side="left" side-width="200px">
  <nav>Sidebar navigation</nav>
  <main>Main content grows to fill the remaining space.</main>
</div>
</wb-demo>

### Sidebar on the right

<wb-demo>
<div x-sidebarlayout side="right" side-width="200px">
  <main>Main content comes first in the DOM, sidebar renders after it.</main>
  <nav>Sidebar navigation</nav>
</div>
</wb-demo>

### Custom gap and content minimum

<wb-demo>
<div x-sidebarlayout side-width="150px" gap="2rem" content-min="60%">
  <nav>Sidebar</nav>
  <main>Wider gap, and the main column won't shrink below 60% before wrapping.</main>
</div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-sidebar-layout` | Always | Marker class for targeting/testing; the flex layout itself is applied inline |

## Accessibility

Because DOM order determines which child is treated as sidebar vs. main
content (not visual position), keep the DOM order matching reading order —
e.g. put primary content before secondary navigation when `side="right"`, so
keyboard and screen-reader users reach the main content first. Use real
landmark elements (`<nav>`, `<main>`, `<aside>`) for the two children rather
than plain `<div>`s, so assistive tech can jump between them directly.

## Source

[src/wb-viewmodels/layouts.js](../../../src/wb-viewmodels/layouts.js)
