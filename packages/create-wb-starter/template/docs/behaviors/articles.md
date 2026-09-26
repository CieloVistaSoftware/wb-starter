# articles

Wraps a set of article-like children in a grid/list/masonry layout, with an
optional heading and static pagination controls. Implemented by `articles()` in
[src/wb-viewmodels/article.js](../../src/wb-viewmodels/article.js).

## Overview

| Property | Value |
|----------|-------|
| Attribute | `x-articles` |
| Attribute form | `<div x-as-articles>` |
| Behavior function | `articles()` — `src/wb-viewmodels/article.js` |
| Pairs with | `<article>` children, each of which is a [card](../behaviors/card.md) |
| Semantic element | `<section role="feed">` (schema default; the behavior itself doesn't add a role) |
| Root CSS Class | `<section x-articles>` |
| Category | Layout |
| Schema | [articles.schema.json](../../src/wb-models/articles.schema.json) — declares extra `limit`/`source` properties the JS never reads; only the attributes below actually do anything |

## Properties

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | string | `"grid"` | `grid`, `list`, or `masonry` — sets `.x-articles--{layout}` on the inner list wrapper |
| `columns` | number | `"3"` | Column count for `grid`/`masonry` layouts, applied as the `--x-articles-columns` CSS custom property |
| `title` | string | `""` | Optional heading rendered above the list in a `.x-articles__header` |
| `pagination` | boolean | `false` | Renders a static Previous/Page 1/Next control strip below the list — **no actual paging logic**, the buttons don't do anything and Previous is always `disabled` |

## Usage

Each child is a plain `<article>`. An `<article>` is a card, so every child gets
its title, byline and body from the [card](../behaviors/card.md) behavior with no
attribute needed.

### Grid layout

<div x-demo columns="1">
<div x-articles title="Grid layout" layout="grid" columns="2">
  <article title="TypeScript Mastery">TypeScript transforms JavaScript development with type safety: generics, unions, interfaces, and decorators.</article>
  <article title="React Hooks Deep Dive">Master modern React with Hooks — useState, useEffect, useContext, and custom hooks for cleaner behaviors.</article>
</div>
</div>

### List layout

<div x-demo columns="1">
<div x-articles title="List layout" layout="list">
  <article title="API Design Best Practices">Build RESTful APIs with proper versioning, pagination, error handling, and documentation.</article>
  <article title="Testing Strategies">Unit tests, integration tests, end-to-end tests, and performance testing for reliable software.</article>
</div>
</div>

### Masonry layout

<div x-demo columns="1">
<div x-articles title="Masonry layout" layout="masonry" columns="2">
  <article title="Microservices Architecture">Break monoliths into independently deployable services with service discovery and circuit breakers.</article>
  <article title="State Management">Redux, Zustand, Recoil, and context patterns — choosing the right fit for your app's complexity.</article>
  <article title="Performance Monitoring">Core Web Vitals, Lighthouse, and Real User Monitoring for finding and fixing bottlenecks.</article>
</div>
</div>

### With pagination controls

<div x-demo columns="1">
<div x-articles title="With pagination" pagination>
  <article title="Cloud Computing Basics">AWS, Azure, and Google Cloud services, pricing models, and when to use each.</article>
  <article title="Containerization with Docker">Images, containers, registries, and compose for microservices.</article>
</div>
</div>

## CSS Classes

| Class | Applied when | Description |
|-------|--------------|-------------|
| `<section x-articles>` | host isn't already a `<div x-as-articles>` tag | Base marker class |
| `.x-articles__header` | `title` set | Wraps the `<h2>` heading |
| `.x-articles__list` | Always | The container that actually holds the (moved) children |
| `.x-articles--{grid,list,masonry}` | Always, per `layout` | Sets the actual layout mode (CSS grid columns / flex column / CSS columns) |
| `.x-articles__pagination` | `pagination` | Wraps the Previous/label/Next controls |
| `.x-articles__page-label` | `pagination` | The static "Page 1" text |

## Events

`articles()` does not dispatch any custom events.

- [Demo](../../demos/site/content.html#articles-articles-list-behavior)
- [Schema](../../src/wb-models/articles.schema.json)
