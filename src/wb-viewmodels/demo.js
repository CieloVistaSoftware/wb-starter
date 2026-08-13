import { WB_DOC_MAP } from './demo-docmap.js';
import { getPageSource, extractTagBlock } from './page-source-cache.js';
/**
 * Demo Container Behavior
 * -----------------------------------------------------------------------------
 * <wb-demo> is a parent container. It:
 *   1. Renders its children normally (in a CSS grid)
 *   2. Shows the raw HTML as a colored code sample below
 *
 * Raw source is fetched from the page file to avoid post-render inflation.
 * Code block uses textContent to prevent the browser from parsing raw HTML
 * into real custom elements.
 *
 * Attributes:
 *   columns — grid columns (default 1)
 *
 * CSS: src/styles/behaviors/demo.css
 * Zero inline styles.
 * -----------------------------------------------------------------------------
 */

// Pretty-print a demo's source so every example is VERTICAL (Standard §5):
// each element on its own line, its children indented, and a multi-attribute
// element gets ONE ATTRIBUTE PER LINE — never a single long horizontal line.
// Parses via a <template> (robust for nested/void elements) and re-serializes.
export function formatHtml(raw) {
    const src = String(raw == null ? '' : raw).trim();
    if (!src) return '';
    const VOID = new Set(['br','hr','img','input','meta','link','area','base','col','embed','source','track','wbr']);
    const INDENT = '  ';
    let tpl;
    try {
        tpl = document.createElement('template');
        tpl.innerHTML = src;
    } catch (e) {
        return src; // never break the demo over a formatting failure
    }
    const attrStr = (a) => (a.value === '' ? a.name : `${a.name}="${a.value}"`);
    const out = [];
    const walk = (parent, depth) => {
        const pad = INDENT.repeat(depth);
        parent.childNodes.forEach((node) => {
            if (node.nodeType === 3) { // text
                const t = node.textContent.replace(/\s+/g, ' ').trim();
                if (t) out.push(pad + t);
                return;
            }
            if (node.nodeType !== 1) return; // elements only
            const tag = node.tagName.toLowerCase();
            const attrs = Array.from(node.attributes);
            const isVoid = VOID.has(tag);
            if (attrs.length > 1) {
                out.push(`${pad}<${tag}`);
                attrs.forEach((a, i) => {
                    const last = i === attrs.length - 1;
                    out.push(`${pad}${INDENT}${attrStr(a)}${last ? (isVoid ? ' />' : '>') : ''}`);
                });
            } else {
                const a = attrs.length ? ' ' + attrStr(attrs[0]) : '';
                out.push(`${pad}<${tag}${a}${isVoid ? ' />' : '>'}`);
            }
            if (isVoid) return;
            walk(node, depth + 1);
            out.push(`${pad}</${tag}>`);
        });
    };
    walk(tpl.content, 0);
    return out.join('\n');
}

// #385: parse a demo's `events` attribute into the list of custom event
// names it should teach readers to listen for, e.g.
// `events="wb:switch:change, wb:switch:other"` -> ['wb:switch:change',
// 'wb:switch:other']. Accepts comma AND/OR whitespace as separators so
// either `events="a, b"` or `events="a b"` works.
function parseEventNames(raw) {
    return String(raw == null ? '' : raw)
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

// #385: example addEventListener wiring shown in the demo's "Events"
// section. Generic `el` target -- matches how a reader would actually grab
// the element (via querySelector/getElementById in their own code), not
// tied to any one demo's specific tag/id, which would suggest the selector
// itself is meaningful when it isn't.
function buildEventListenerCode(eventNames) {
    return eventNames
        .map((name) => `el.addEventListener('${name}', (e) => {\n  console.log(e.detail);\n});`)
        .join('\n\n');
}

// Site root that works from '/', '/demos/x.html', '/pages/x.html',
// '/public/doc-viewer.html', '/tests/fixtures/x.html' — locally or under a
// GitHub Pages sub-path.
//
// #454: 'tests/fixtures' was missing from this list. Pages living there
// (e.g. cards-permutation-matrix.html) fell through to the fallback below,
// which only strips the trailing filename — leaving siteRoot() as
// '/tests/fixtures/' instead of '/'. Every doc-link feature keyed off this
// (the docs/manifest.json fetch AND every generated ?file= doc-viewer href)
// silently broke: the manifest fetch 404'd, so no doc ever resolved and no
// Docs: link/badge was ever built, even though the page's <wb-demo> wrapping
// was otherwise correct.
function siteRoot() {
    const stripped = location.pathname.replace(/(?:public|demos|pages|articles|tests\/fixtures)\/.*$/, '');
    // At the site root the path is a bare 'index.html' with no recognized
    // directory segment for the regex above to match, so it's a no-op there
    // — strip the trailing filename directly, which also covers the GitHub
    // Pages sub-path case ('/wb-starter/index.html').
    return stripped.replace(/[^/]*$/, '');
}

// docs/manifest.json, fetched once and shared by every wb-demo on the page.
let _docsManifestPromise = null;
function loadDocsManifest() {
    if (!_docsManifestPromise) {
        _docsManifestPromise = fetch(siteRoot() + 'docs/manifest.json')
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
    }
    return _docsManifestPromise;
}

// Find the doc file (relative to docs/) for a component name, by basename match:
// 'card' → …/card.md, 'column' → …/wb-column.md. Returns null when no doc exists.
function findDocFile(manifest, comp) {
    if (!manifest || !Array.isArray(manifest.categories)) return null;
    const names = [`${comp}.md`, `wb-${comp}.md`];
    for (const cat of manifest.categories) {
        for (const d of cat.docs || []) {
            const base = String(d.file || '').split('/').pop().toLowerCase();
            if (names.includes(base)) return d.file;
        }
    }
    return null;
}

function findWbComponents(html) {
    const regex = /<wb-([a-z0-9-]+)/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        matches.push(match[1]);
    }
    return [...new Set(matches)]; // unique
}

// John, live: "when looking at the behaviors there are no links to the x-*
// docs. for the behaviors." -- findWbComponents above only matches literal
// <wb-*> TAGS, so a demo decorating a plain native element (e.g.
// `<button x-ripple>`, pages/behaviors.html's whole "Buttons"/"Inputs"/
// "Feedback" sections) never produced ANY doc link -- sharedComponents
// stayed empty and the whole "Docs:" line was skipped. Matches both
// documented behavior syntaxes from docs/behaviors-reference.md: decoration
// (`x-ripple`) and morphing (`x-as-card`) -- the (?:as-)? group strips the
// morph prefix so `x-as-card` still resolves to doc lookup name "card".
// Requires a preceding whitespace (not `<`) so it never matches a leading
// slice of an `<x-foo>` CUSTOM ELEMENT TAG name, same anchoring approach as
// no-redundant-x-attribute-on-native-tag.spec.ts's `(^|\s)x-${tag}` check.
function findXBehaviors(html) {
    const regex = /(?:^|\s)x-(?:as-)?([a-z][a-z0-9]*)(?=[\s=/>]|$)/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        matches.push(match[1].toLowerCase());
    }
    return [...new Set(matches)]; // unique
}

// Same basename-match strategy as findDocFile, plus a fallback: unlike
// wb-* components (one doc file per component), most x-* behaviors are
// documented as a table ROW inside docs/behaviors-reference.md rather than
// their own page (only a handful -- tooltip, autosize, x-collapse, etc. --
// get a dedicated file). Falling back to that shared reference page keeps
// "never a dead link" true for the majority (ripple, toast, masked,
// stepper, ...) instead of silently dropping them from the Docs: line.
function findBehaviorDocFile(manifest, name) {
    if (!manifest || !Array.isArray(manifest.categories)) return null;
    const names = [`${name}.md`, `x-${name}.md`, `wb-${name}.md`];
    for (const cat of manifest.categories) {
        for (const d of cat.docs || []) {
            const base = String(d.file || '').split('/').pop().toLowerCase();
            if (names.includes(base)) return d.file;
        }
    }
    for (const cat of manifest.categories) {
        for (const d of cat.docs || []) {
            if (String(d.file || '').toLowerCase().endsWith('behaviors-reference.md')) return d.file;
        }
    }
    return null;
}

// #388/#390: attach a small top-right doc-link "badge" directly onto ONE
// component instance, instead of relying on the single shared
// '.wb-demo__links' line below the whole grid (which reads as detached from
// any individual instance once a demo holds more than one). Originally
// card-only (#388); generalized to every wb-* component (#390) after the
// same "Docs: wb-dialog" shared-line pattern read just as detached on
// non-card demos (dialog/drawer/dropdown, demos/site/overlays.html) --
// same problem, same fix, no reason to treat cards specially here.
//
// Why a self-healing MutationObserver instead of a single appendChild: a
// component's own behavior (card.js, overlay.js, dropdown.js, etc.) is
// applied lazily via WB's IntersectionObserver-driven injection (wb-lazy.js)
// on its own schedule, independent of this demo's build order -- and many
// behaviors rebuild via `element.innerHTML = ''` before laying out their
// own DOM. If that rebuild lands AFTER we've attached this link, it
// silently wipes it out. Every element is only ever rebuilt once by its own
// behavior, so watch for exactly that: if the link goes missing, put it
// back. Idempotent (checks for an existing link first), so it settles after
// at most one heal and stops mutating on its own re-insert.
function attachInstanceDocLink(hostEl, file, label, root) {
    const href = root + 'public/doc-viewer.html?file=' + encodeURIComponent('docs/' + file);
    const title = `${label} docs`;

    // #295: the badge is positioned top-right via `position: absolute`
    // (demo.css), which anchors to hostEl ONLY if hostEl itself is a
    // positioning context. wb-card already sets position:relative in its
    // own CSS, so this was invisible there -- but #390 generalized this
    // badge to EVERY wb-* grid child, and most (wb-spinner, wb-badge,
    // plain wb-alert, ...) are position:static. With no positioned
    // ancestor at all, the badge's containing block falls back to the
    // *viewport* (the initial containing block), so it renders pinned near
    // the top-right of the whole page instead of the small component it's
    // meant to label -- confirmed live: overflowed the page by 9px at
    // 375px on docs/V3-GUIDE.md's embedded <wb-demo>. Force a positioning
    // context only when one doesn't already exist, so this is a no-op for
    // every component (like wb-card) that already provides one.
    if (getComputedStyle(hostEl).position === 'static') {
        hostEl.style.position = 'relative';
    }

    const build = () => {
        if (hostEl.querySelector(':scope > .wb-demo__card-doc-link')) return;
        const link = document.createElement('a');
        link.className = 'wb-demo__card-doc-link';
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', title);
        link.title = title;
        link.textContent = '📖';
        hostEl.appendChild(link);
    };

    build();

    const observer = new MutationObserver(() => {
        if (!hostEl.isConnected) {
            observer.disconnect();
            return;
        }
        build();
    });
    observer.observe(hostEl, { childList: true });
    // Belt-and-suspenders: every lazy injection settles well within this —
    // never leave the observer running indefinitely.
    setTimeout(() => observer.disconnect(), 8000);
}

export async function demo(element, options = {}) {
    // Guard against double initialization
    if (element._demoInitialized) return () => {};
    element._demoInitialized = true;

    // Opt out of Standard §7's single-item shrink-to-fit (demo.css) for demos
    // whose one child is deliberately full-bleed (e.g. a page hero) rather
    // than a small widget that should collapse to its own content width.
    if (element.hasAttribute('full-width')) {
        element.classList.add('wb-demo--full-width');
    }

    let rawBlock = '';
    // Source priority: _rawSource FIRST. It's captured at connectedCallback,
    // before children upgrade — the pristine authored markup, correct on every
    // surface. Page-source extraction is only a fallback: its regex also matches
    // literal "<wb-demo>…</wb-demo>" TEXT in the host page's comments/scripts —
    // on the doc-viewer (whose own code mentions wb-demo) it captured a chunk of
    // the viewer's CSS/JS as the "source" (the garbage panels; #242/#262 CI).
    if (element._rawSource && element._rawSource.trim()) {
        rawBlock = element._rawSource;
    } else {
        try {
            const pageSource = await getPageSource();
            const allDemos = document.querySelectorAll('wb-demo');
            const idx = Array.from(allDemos).indexOf(element);
            rawBlock = extractTagBlock(pageSource, 'wb-demo', idx);
        } catch (e) {
            // ignore fetch errors
        }
        if (!rawBlock || !rawBlock.trim()) {
            rawBlock = (element.innerHTML && element.innerHTML.trim()) ? element.innerHTML : '';
        }
    }

    const configuredCols = parseInt(options.columns || element.getAttribute('columns') || '1', 10);
    // Standard §7: a demo is only as wide as what it renders — a single
    // narrow card wrapped in the default 3-column grid still stretched the
    // whole wb-demo to fill 3 columns' worth of width even though only 1
    // was ever occupied. Clamp to however many children actually exist;
    // demo.css's cols-1 rule then sizes the whole demo (grid + code panel,
    // as one unit) to fit that content on desktop. Standard §26: below
    // 700px only, demo.css splits this apart instead — the grid still
    // hugs its content, but `wb-demo` and its code panel stay full width,
    // so scrolling past many single-item demos on mobile doesn't jitter
    // the page's horizontal footprint.
    const childCount = element.children.length;
    const cols = childCount > 0 ? Math.min(configuredCols, childCount) : configuredCols;

    // Wrap children in a grid FIRST, so the doc links added below stay outside
    // the grid instead of being swept in as a grid item and floating inline (#211).
    const grid = document.createElement('div');
    grid.className = 'wb-demo__grid wb-demo__grid--cols-' + cols;
    while (element.firstChild) {
        grid.appendChild(element.firstChild);
    }
    element.appendChild(grid);

    // Lazily-built blocks (scrolled into view long after the page's one-time
    // eager WB.scan(document.body) already ran) never had their moved-in
    // children scanned by anything -- the global scan finished before this
    // grid existed. Eager blocks (built synchronously during initial parse,
    // before the deferred module script runs) are still covered by that
    // global scan, so scanning `grid` here too would race it and reintroduce
    // the double-injection listener loss described below on `pre`. Only scan
    // for the lazy path, where the global scan is long finished -- no race.
    if (options.isLazy && window.WB) {
        window.WB.scan(grid);
    }

    // #486: measure the GRID's own rendered width and hand it to demo.css as
    // --wb-demo-shrink-width, for single-item demos only (desktop rule in
    // demo.css falls back to plain `fit-content` otherwise). A pure-CSS
    // `width: fit-content` on wb-demo sizes to its WIDEST in-flow child —
    // including the `.wb-demo__code` panel below the grid, which pre.css
    // sets to `width: 100%` (circular under intrinsic sizing, so it
    // resolves to the full available width, not its own content width).
    // That made every single-item demo measure fit-content against the
    // code panel instead of the actual control, even a tiny button sitting
    // above a wide, unwrapped code sample. CSS has no way to say "shrink to
    // child A, ignore child B" between two normal in-flow siblings, so the
    // grid's width is measured here instead — same per-instance-measurement
    // pattern this codebase already uses for cross-sibling sizing (e.g.
    // pre.js's control right-offsets). rAF: wait for the current script's
    // layout/style pass (including a deferred eager WB.scan(document.body))
    // to settle before measuring, so button/card classes are already
    // applied and the measured width is the real final one, not a
    // pre-upgrade placeholder.
    if (cols === 1 && childCount === 1 && !element.classList.contains('wb-demo--full-width')) {
        // A single rAF measures whatever width the child happens to have at
        // that exact instant -- correct once its content is already fully
        // loaded, but a single-item child with its OWN async content still
        // loading (an image, an audio player building its equalizer UI,
        // etc.) hasn't reached its real final width yet: it measures small
        // (sometimes near-zero) and the whole demo -- including its code
        // panel -- gets stuck collapsed to that tiny width forever, since
        // nothing ever re-measures after. Confirmed live 3 separate times
        // (cardhero, 9 more card-family async-image demos, and now every
        // auto-live-rendered wb-audio example on doc-viewer.html pages) --
        // each fixed one-by-one with the `full-width` escape hatch, but
        // that only helps instances someone remembers to annotate by hand.
        // Same poll-until-stable shape as site-engine.js's anchor-scroll
        // fix: keep re-measuring until the width stops changing for two
        // consecutive checks, capped at 5s so a genuinely-static child
        // (the common case) still only costs one or two cheap re-checks.
        const only = grid.children[0];
        if (only) {
            // #549: an <img>/<video> with an inline `width: 100%` (the
            // figure/lightbox-image demos below, plus the direct-<img> and
            // <video> demos elsewhere on this page) breaks the poll below in
            // a way the async-content case above doesn't. That media
            // element's OWN rendered width is a direct function of whatever
            // width THIS code writes to --wb-demo-shrink-width on the very
            // next layout pass -- and measure() writes the variable on
            // EVERY tick, not just once at the end, so the "two consecutive
            // equal readings" stability check can lock onto an arbitrary
            // self-consistent fixed point instead of the media's real
            // content size. Confirmed live: reloading the exact same
            // <figure><img style="width:100%"></figure> demo repeatedly
            // settled on wildly different "stable" widths from one load to
            // the next (a collapsed ~60px sliver on one load, a plausible
            // ~430px on another) -- pure timing noise in which transient
            // layout the first rAF happened to catch, not a real
            // measurement of anything. A plain getBoundingClientRect() can
            // never break that loop because it's reading the very quantity
            // this code is also writing.
            //
            // Route these through the media's natural/intrinsic size
            // instead (img.naturalWidth / video.videoWidth) -- a fixed
            // quantity the container's width can't feed back into. wb-demo's
            // existing `max-width: 100%` (demo.css) still caps this down to
            // the available page width for an image wider than the
            // viewport, exactly like the plain shrink-to-fit path below.
            const media = only.matches('img,video') ? only : only.querySelector('img,video');
            const isFluidMedia = !!(media && /^\s*\d+(\.\d+)?%\s*$/.test(media.style.width || ''));

            if (isFluidMedia) {
                const applyNaturalWidth = () => {
                    const naturalWidth = media.tagName === 'VIDEO' ? media.videoWidth : media.naturalWidth;
                    if (!naturalWidth) return false;
                    // media may be wrapped (e.g. <figure><img></figure>) --
                    // the wrapper's own margin/border/padding is FIXED px
                    // box model (not a percentage of the container), so
                    // reading it via getComputedStyle can't feed back into
                    // itself the way the media's own width:100% does.
                    // Confirmed live: <figure> gets a UA-stylesheet default
                    // `margin: 1em 40px` -- without adding that back in, the
                    // shrink width came out 80px narrower than the image
                    // actually needed, clipping it against the demo's own
                    // max-width:100% edge.
                    let extra = 0;
                    for (let node = media; node && node !== only; node = node.parentElement) {
                        const parentNode = node.parentElement;
                        if (!parentNode) break;
                        const pcs = getComputedStyle(parentNode);
                        extra += (parseFloat(pcs.marginLeft) || 0) + (parseFloat(pcs.marginRight) || 0)
                               + (parseFloat(pcs.borderLeftWidth) || 0) + (parseFloat(pcs.borderRightWidth) || 0)
                               + (parseFloat(pcs.paddingLeft) || 0) + (parseFloat(pcs.paddingRight) || 0);
                    }
                    const demoCs = getComputedStyle(element);
                    const hPad = (parseFloat(demoCs.paddingLeft) || 0) + (parseFloat(demoCs.paddingRight) || 0);
                    // #563 follow-up: same "widest of control or code"
                    // reasoning as the non-media measure() path below --
                    // a media demo's code sample can need more width than
                    // the media's own natural size (e.g. a long src URL).
                    const codeEls = element.querySelectorAll('.wb-demo__code');
                    const codeWidth = codeEls.length
                        ? Math.max(...Array.from(codeEls, el => el.scrollWidth)) + hPad
                        : 0;
                    element.style.setProperty('--wb-demo-shrink-width', Math.max(naturalWidth + extra + hPad, codeWidth) + 'px');
                    return true;
                };
                if (applyNaturalWidth()) {
                    // #563 follow-up: the very first call above can land
                    // before this demo's own <pre class="wb-demo__code">
                    // exists yet (it's created later in the same synchronous
                    // render pass) even when the media is already
                    // cached/decoded -- codeWidth reads as 0 that one time.
                    // Re-run once on the next tick, after the code panel is
                    // guaranteed to be in the DOM, so its width still gets
                    // picked up for the cached-media case.
                    setTimeout(applyNaturalWidth, 0);
                } else {
                    // Not decoded/metadata-loaded yet -- resolve once it is,
                    // with a capped fallback so a broken/never-firing media
                    // source can't leave the demo permanently collapsed
                    // (same MAX_MS budget as the poll path below).
                    const readyEvent = media.tagName === 'VIDEO' ? 'loadedmetadata' : 'load';
                    media.addEventListener(readyEvent, applyNaturalWidth, { once: true });
                    setTimeout(applyNaturalWidth, 5000);
                }
            } else {
                let lastControlWidth = null;
                let lastCodeWidth = null;
                let stableCount = 0;
                const POLL_MS = 200;
                const MAX_MS = 5000;
                const startedAt = Date.now();
                const measure = () => {
                    const demoCs = getComputedStyle(element);
                    const hPad = (parseFloat(demoCs.paddingLeft) || 0) + (parseFloat(demoCs.paddingRight) || 0);
                    const controlWidth = only.getBoundingClientRect().width + hPad;
                    // #563 follow-up, John: "show all the code on single
                    // elements per row" -- measuring only the control left
                    // the code panel (width:100% of wb-demo, see demo.css)
                    // capped to the control's own width, cutting long
                    // attribute lines off with a scrollbar even though the
                    // demo box was meant to hug its content, not the
                    // control specifically. `.wb-demo__code` is a `<pre>`
                    // with `white-space: pre` (pre.css) -- it never wraps,
                    // so its scrollWidth is the fixed width needed to show
                    // every line in full, independent of whatever width the
                    // container currently happens to have (no circularity,
                    // unlike a would-be `width:fit-content` read directly on
                    // a 100%-width child). Take the max of the two so the
                    // demo is exactly as wide as its widest requirement --
                    // control or code -- and never wider.
                    // querySelectorAll, not querySelector: a demo can carry
                    // MORE than one code panel (e.g. an HTML markup sample
                    // plus a separate JS interaction-listener sample) --
                    // querySelector only ever found the FIRST one, so a
                    // longer second panel's width was silently ignored.
                    // Confirmed live: cards.html's wb-cardproduct demos
                    // (HTML + `el.addEventListener(...)` JS sample) still
                    // cut the JS panel off because only the HTML panel's
                    // width was ever measured.
                    const codeEls = element.querySelectorAll('.wb-demo__code');
                    const codeWidth = codeEls.length
                        ? Math.max(...Array.from(codeEls, el => el.scrollWidth)) + hPad
                        : 0;
                    const shrinkWidth = Math.max(controlWidth, codeWidth);
                    if (shrinkWidth > 0) {
                        element.style.setProperty('--wb-demo-shrink-width', shrinkWidth + 'px');
                    }
                    // Track controlWidth and codeWidth for stability
                    // SEPARATELY, not just the derived max(). pre.js's
                    // syntax highlighting / line-number gutter populates
                    // asynchronously after the bare <pre> first exists, so
                    // codeWidth keeps climbing for a few ticks after
                    // creation. Whenever controlWidth is the larger of the
                    // two, the max() stays flat across those ticks purely
                    // because controlWidth (already settled) dominates it --
                    // "2 consecutive equal max() readings" then falsely
                    // reads as stable and stops polling before codeWidth
                    // ever reaches its real final size. Confirmed live:
                    // cards.html's plain-text card demos locked their code
                    // panel width in at the control's ~355px although the
                    // code's own content needed 413px, cutting the last
                    // line off. Requiring BOTH inputs to hold steady (not
                    // just their max) catches this.
                    if (controlWidth === lastControlWidth && codeWidth === lastCodeWidth) {
                        stableCount++;
                    } else {
                        stableCount = 0;
                        lastControlWidth = controlWidth;
                        lastCodeWidth = codeWidth;
                    }
                    if (stableCount >= 2 || Date.now() - startedAt > MAX_MS) return;
                    setTimeout(measure, POLL_MS);
                };
                requestAnimationFrame(measure);
            }
        }
    }

    // Add doc links. (#262: the old '?page=docs#wb-…' hrefs were
    // dead on EVERY surface — page-relative, so inside the doc-viewer they hit
    // doc-viewer.html?page=docs, and pages/docs.html has no #wb-* anchors anyway.)
    // Link each component to its REAL doc opened in the doc-viewer, resolved from
    // docs/manifest.json. Components with no doc get NO link — never a dead link.
    //
    // #388/#390: any wb-* child of the grid gets its OWN top-right link
    // (attachInstanceDocLink above) instead of being folded into the
    // generic shared line — a multi-instance demo used to read as one
    // detached caption under the whole group, not tied to any individual
    // element. Originally card-only (#388); generalized to every wb-*
    // component (#390) so a page like demos/site/overlays.html
    // (dialog/drawer/dropdown, no cards at all) gets the same per-instance
    // placement instead of falling back to the shared line. Only things
    // that never resolve to a real wb-* element in the grid (a plain
    // <button x-tooltip> decorated element, for instance) still use the
    // shared-line fallback below.
    const allComponents = findWbComponents(rawBlock);
    // wb-cardlink used to be excluded here: its own behavior (card.js
    // cardlink()) already stretches a real <a href> over the ENTIRE card
    // (deliberately, for native right-click/middle-click support -- see
    // that function's own comment), and a doc-link badge added on top
    // looked like it would fight the stretched anchor for clicks. Turned
    // out not to matter: the badge's own z-index (demo.css
    // .wb-demo__card-doc-link, z-index:5 vs the stretched anchor's default
    // auto) keeps it independently clickable in its own small corner --
    // confirmed live, both anchors reachable. Re-included per explicit
    // request: "put all links on the card itself, upper right hand
    // corner" -- no carve-outs, every card including cardlink gets one.
    // #434: querySelectorAll('*'), not grid.children -- a wb-* component
    // wrapped inside a plain <div> (e.g. bundled alongside a stylesheet
    // link/script as a self-contained "view source" example) is a real,
    // documented component just as much as a direct grid child, but
    // grid.children only sees the wrapping <div>, silently falling through
    // to the deprecated shared "Docs: wb-x" line below the grid instead of
    // its own per-instance corner badge (confirmed live: pages/home.html's
    // hero cardhero, nested one <div> deep).
    const perInstanceChildren = Array.from(grid.querySelectorAll('*')).filter(
        (child) => child.tagName && child.tagName.startsWith('WB-')
    );
    const perInstanceComps = new Set(perInstanceChildren.map((el) => el.tagName.slice(3).toLowerCase()));
    const sharedComponents = allComponents.filter((comp) => !perInstanceComps.has(comp));
    const xBehaviors = findXBehaviors(rawBlock);
    if (perInstanceChildren.length > 0 || sharedComponents.length > 0 || xBehaviors.length > 0) {
        // Deterministic: await the (cached) manifest and build the links inline —
        // a floating .then() left empty divs when init raced page load.
        const manifest = await loadDocsManifest().catch(() => null);
        const root = siteRoot();

        perInstanceChildren.forEach((hostEl) => {
            const comp = hostEl.tagName.slice(3).toLowerCase(); // WB-CARDHERO -> cardhero
            const file = findDocFile(manifest, comp);
            if (!file) return; // never a dead link
            attachInstanceDocLink(hostEl, file, `wb-${comp}`, root);
        });

        // John (reported repeatedly): pages/behaviors.html's demos are
        // native elements decorated with an x-* ATTRIBUTE (<button
        // x-ripple>, <button x-toast>), never a <wb-*> TAG -- the
        // per-instance corner badge above only ever matched perInstanceChildren
        // (WB-* tags), so every x-* behavior fell through to the shared
        // "Docs: x-toast" text line below the whole grid instead. Give each
        // ELEMENT THAT ACTUALLY CARRIES the attribute its own corner badge,
        // the same as a wb-* component gets, instead of a second, different
        // treatment for behaviors vs. components. `x-as-{name}` (morphing
        // syntax) needs its own selector -- `[x-${name}]` alone won't match it.
        const resolvedXBehaviorNames = new Set();
        xBehaviors.forEach((name) => {
            const file = findBehaviorDocFile(manifest, name);
            if (!file) return; // never a dead link
            const hosts = grid.querySelectorAll(`[x-${name}], [x-as-${name}]`);
            if (!hosts.length) return; // name matched in source text but no live element carries it
            resolvedXBehaviorNames.add(name);
            hosts.forEach((hostEl) => attachInstanceDocLink(hostEl, file, `x-${name}`, root));
        });

        const linkedComponents = sharedComponents
            .map((comp) => ({ label: `wb-${comp}`, file: findDocFile(manifest, comp) }))
            .filter((x) => x.file);
        const linkedBehaviors = xBehaviors
            .filter((name) => !resolvedXBehaviorNames.has(name))
            .map((name) => ({ label: `x-${name}`, file: findBehaviorDocFile(manifest, name) }))
            .filter((x) => x.file);
        const linked = [...linkedComponents, ...linkedBehaviors];
        if (linked.length) {
            const linksDiv = document.createElement('div');
            linksDiv.className = 'wb-demo__links';
            linksDiv.textContent = 'Docs: ';
            linked.forEach(({ label, file }, i) => {
                const link = document.createElement('a');
                link.href = root + 'public/doc-viewer.html?file=' + encodeURIComponent('docs/' + file);
                link.textContent = label;
                link.target = '_blank';
                link.rel = 'noopener';
                linksDiv.appendChild(link);
                if (i < linked.length - 1) {
                    linksDiv.appendChild(document.createTextNode(', '));
                }
            });
            element.appendChild(linksDiv);
        }
    }

    // Create code block directly — textContent prevents browser from
    // parsing raw HTML into real custom elements that get inflated
    const pre = document.createElement('pre');
    pre.className = 'wb-demo__code';
    pre.setAttribute('x-behavior', 'pre');
    pre.dataset.language = 'html';
    pre.dataset.showCopy = 'true';
    // #390: John's explicit override for wb-demo code panels specifically --
    // horizontal scroll instead of wrapping. No `wrap` attribute means
    // pre.css's default applies (overflow-x: auto, white-space: pre; see
    // pre.css "Default (no wrap modifier): editor style -- long lines
    // scroll, never break"). Standard §6 (never a horizontal scrollbar)
    // still governs plain <pre x-behavior="pre"> elsewhere; this carve-out
    // is scoped to wb-demo-generated code panels only.

    const code = document.createElement('code');
    code.className = 'language-html';
    code.setAttribute('x-behavior', 'code');
    code.dataset.language = 'html';
    // Standard §5: source is pretty-printed VERTICAL (one attribute per line).
    code.textContent = formatHtml(rawBlock);
    pre.appendChild(code);
    element.appendChild(pre);

    // Syntax highlight the "view source" panel just created above — scoped to
    // `pre` specifically, NOT `element` (the whole wb-demo, including its
    // grid of MOVED, pre-existing children like wb-alert/wb-card/etc.).
    // Scanning the whole element used to be harmless because every demo()
    // call came from the global WB.scan(main) pass itself, so there was
    // only ever one scan in flight. Building eagerly now (#312 follow-up)
    // means demo() can run synchronously in connectedCallback, OUTSIDE
    // that global scan — scanning `element` here then raced the separate,
    // concurrent WB.scan(main) call over the SAME grid children, both
    // independently discovering e.g. <wb-alert> and injecting its behavior.
    // WB.inject()'s own guards prevented the behavior from running twice,
    // but not reliably enough: confirmed live, the alert's dismiss button
    // ended up listener-less ~90% of the time. The grid's children are
    // already covered by the global scan; only the new pre/code panel
    // needs one here.
    // eager:true -- WB.scan()'s default lazy path defers [x-behavior]
    // elements to an IntersectionObserver instead of applying them
    // synchronously, so the code panel could sit unstyled/unscanned for
    // an indeterminate delay (confirmed live on public/doc-viewer.html:
    // the nested <code x-behavior="code"> got hljs highlighting while
    // the wrapping <pre x-behavior="pre"> sat with no x-pre class at
    // the same snapshot). The panel is built and appended synchronously
    // right above -- there's no perf reason to defer scanning it lazily.
    //
    // window.WB can still be undefined at this exact instant even though
    // it's always assigned during page load: <wb-demo>'s connectedCallback
    // can fire (and this whole function run synchronously from it) before
    // the deferred module script that sets window.WB has executed --
    // timing that depends on network/parse speed, so it's rare on a fast
    // local dev reload but real on a cold production load (confirmed:
    // reproduced live on the deployed GitHub Pages build, code panels
    // rendered with zero syntax highlighting -- `if (window.WB)` was
    // simply false at connect time, and nothing ever retried). A handful
    // of rAF retries covers this without needing a real "WB ready" event
    // this codebase doesn't otherwise have; WB is a synchronous top-level
    // module assignment, so it's available within a frame or two of any
    // element's connectedCallback, never indefinitely delayed. (#535)
    const scanWhenReady = (attemptsLeft = 20) => {
        if (window.WB) {
            window.WB.scan(pre, { eager: true });
        } else if (attemptsLeft > 0) {
            requestAnimationFrame(() => scanWhenReady(attemptsLeft - 1));
        }
    };
    scanWhenReady();

    // #385: wb-demo showed HOW to wire up a control's markup but never HOW
    // to listen for the custom events it fires afterward. Optional `events`
    // attribute (e.g. `events="wb:switch:change"`) adds two things when
    // present: an example addEventListener code sample (same
    // syntax-highlighted/copyable treatment as the source panel above), and
    // a REAL listener on `grid` that logs each firing to a small panel live
    // -- so a reader interacting with the rendered control above SEES the
    // event happen instead of only reading about it.
    const eventNames = parseEventNames(options.events || element.getAttribute('events'));
    if (eventNames.length) {
        const eventsHeading = document.createElement('div');
        eventsHeading.className = 'wb-demo__events-heading';
        eventsHeading.textContent = 'Listening for events';
        element.appendChild(eventsHeading);

        const eventsPre = document.createElement('pre');
        eventsPre.className = 'wb-demo__code wb-demo__events-code';
        eventsPre.setAttribute('x-behavior', 'pre');
        eventsPre.dataset.language = 'javascript';
        eventsPre.dataset.showCopy = 'true';

        const eventsCode = document.createElement('code');
        eventsCode.className = 'language-javascript';
        eventsCode.setAttribute('x-behavior', 'code');
        eventsCode.dataset.language = 'javascript';
        eventsCode.textContent = buildEventListenerCode(eventNames);
        eventsPre.appendChild(eventsCode);
        element.appendChild(eventsPre);

        if (window.WB) {
            window.WB.scan(eventsPre, { eager: true });
        }

        // Live log panel. Listens on `grid` specifically -- not `element`
        // (the whole wb-demo, which by this point also contains the source
        // and events code panels themselves) -- so it only ever hears
        // events from the rendered control(s), never accidentally from a
        // click/copy interaction with the code panels above. Events bubble,
        // so one listener per name here catches every descendant of grid.
        const log = document.createElement('div');
        log.className = 'wb-demo__events-log';
        const logEmpty = document.createElement('div');
        logEmpty.className = 'wb-demo__events-log-empty';
        logEmpty.textContent = 'Interact with the demo above to see these events fire, live:';
        log.appendChild(logEmpty);
        element.appendChild(log);

        // Cap the log so a chatty/repeating event (e.g. drag move) can't
        // grow the panel unbounded -- newest entry on top, oldest falls off.
        const MAX_ENTRIES = 5;
        eventNames.forEach((name) => {
            grid.addEventListener(name, (e) => {
                if (logEmpty.isConnected) logEmpty.remove();
                let detailStr = '';
                if (e.detail !== undefined) {
                    try {
                        detailStr = JSON.stringify(e.detail);
                    } catch (err) {
                        detailStr = String(e.detail);
                    }
                }
                const entry = document.createElement('div');
                entry.className = 'wb-demo__events-log-entry';
                const time = new Date().toLocaleTimeString();
                entry.textContent = `[${time}] ${name}` + (detailStr ? ' ' + detailStr : '');
                log.insertBefore(entry, log.firstChild);
                while (log.children.length > MAX_ENTRIES) {
                    log.removeChild(log.lastChild);
                }
            });
        });
    }

    return () => {};
}

export default demo;
