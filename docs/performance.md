# Performance Improvement Plan

This document tracks the performance optimization strategy and the work completed to improve the Web Behaviors (WB) Starter kit.

## Strategy

### 1. Runtime Performance (JavaScript Execution)
- [x] **Optimize Lazy Loading Observer:** Replace individual `IntersectionObserver` instances per element with a single shared observer to reduce memory overhead.
- [x] **Optimize Mutation Observer:** Reduce the cost of DOM observation by adding checks before querying the DOM (e.g., `hasChildNodes`).
- [x] **Parallelize Page Transitions:** Start fetching page content immediately instead of waiting for UI/Spinner initialization.
- [x] **Remove Redundant Scans:** Eliminate unnecessary `WB.scan()` calls when `MutationObserver` is already handling injections.
- [x] **Event Optimization:** Debounce or throttle high-frequency events (scroll, resize) in behaviors.

### 2. Load Time (Critical Path)
- [x] **Preload Critical Behaviors:** Identify and preload essential behaviors (like `ripple`, `tooltip`, `themecontrol`) to prevent layout shifts or interaction delays.
- [x] **Resource Hints:** Add `rel="preload"` or `rel="preconnect"` for critical assets in `index.html`.

### 3. Network Performance
- [x] **Server Caching:** Enable caching for static assets in `server.js` (configurable via environment variable).
- [x] **Compression:** Enable Gzip/Brotli compression in `server.js`.

### 4. Rendering Performance
- [x] **CSS Containment:** Apply `contain` property to complex components (like Cards) to isolate layout recalculations.
- [x] **Content Visibility:** Use `content-visibility: auto` for off-screen content (e.g., long lists of cards).

---

## Work Log

### January 1, 2026

#### Core Engine Optimizations
**File:** `src/core/wb-lazy.js`
- **Shared IntersectionObserver:** Refactored `lazyInject` to use a single, shared `IntersectionObserver` instance (`lazyObserver`) instead of creating a new observer for every lazy-loaded element. This significantly reduces memory usage on pages with many interactive elements.
- **Efficient DOM Observation:** Updated the `MutationObserver` in `WB.observe` to check `node.hasChildNodes()` before running `querySelectorAll`. This prevents expensive DOM traversals on empty nodes or text nodes.
- **Cleanup:** Added proper disconnection logic for the shared observer in `WB.disconnect()`.

**File:** `src/core/site-engine.js`
- **Parallel Fetching:** Moved the `fetch()` call for page content to start *before* the spinner initialization completes, allowing network and UI work to happen in parallel.
- **Removed Redundant Scans:** Removed a `WB.scan(main)` call that occurred immediately after page injection. Since the `MutationObserver` is active, it automatically detects the new content and injects behaviors, making the manual scan redundant and wasteful.
- **Preloading:** Updated `WB.init` to include `preload: ['ripple', 'themecontrol', 'tooltip']`. These behaviors are used in the global header/nav and should be ready immediately to avoid "pop-in" or delayed interactivity.

**File:** `server.js`
- **Conditional Caching:** Updated static file serving middleware to check `process.env.NODE_ENV`. If set to `production`, it enables 1-day caching (`max-age=86400`). In development (default), caching remains disabled for instant feedback.
- **Compression:** Added `compression` middleware to enable Gzip/Brotli compression for all responses, significantly reducing payload sizes for text-based assets (HTML, CSS, JS, JSON).

**File:** `src/behaviors/js/card.js`
- **CSS Containment:** Added `contain: layout paint` to the base card styles. This informs the browser that the card's internal layout is independent of the rest of the page, allowing for optimized rendering and reduced layout thrashing.

#### Event & Resource Optimizations
**File:** `src/behaviors/js/effects.js`
- **Scroll Throttling:** Optimized the `parallax` behavior to use `requestAnimationFrame` for scroll updates. This prevents the browser from trying to calculate layout on every single scroll event, which can cause jank.

**File:** `src/behaviors/js/layouts.js`
- **Resize Throttling:** Optimized the `drawerLayout` resize handler to use `requestAnimationFrame`. This ensures smooth resizing performance by decoupling the mouse movement rate from the layout update rate.

**File:** `index.html`
- **Resource Hints:** Added `rel="preload"` and `rel="modulepreload"` for critical CSS (`themes.css`, `site.css`), JS modules (`wb.js`, `site-engine.js`), and configuration (`site.json`). This helps the browser discover and download these high-priority assets earlier in the waterfall.

**File:** `src/styles/site.css`
- **Content Visibility:** Added `.wb-content-auto` utility class with `content-visibility: auto` and `contain-intrinsic-size`. This can be applied to large lists or off-screen sections to skip rendering work until they approach the viewport.
