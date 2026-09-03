import { WB_DOC_MAP } from './demo-docmap.js';
import { getPageSource, extractTagBlock } from './page-source-cache.js';
/**
 * Demo Container Behavior
 * -----------------------------------------------------------------------------
 * <div x-demo> is a parent container. It:
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

// John, live on docs/components/semantics/table.md's row-click example:
// x-table's `wb:table:select` event carries `{ row: <tr>, index }` --
// `JSON.stringify(e.detail)` on that serializes the real DOM element to
// `{}` (Element has no own enumerable properties), so the events-log entry
// showed "wb:table:select {row:{},index:0}" -- technically real JSON, but
// useless for seeing what row a reader actually clicked. Any future event
// whose detail carries an Element (row/target references are a common
// event-detail shape in this codebase) would hit the same problem. Replace
// an Element value with something a reader can actually read: a table row
// becomes its cell text (the same "what data was in it" a reader wants),
// anything else becomes a plain `<tagname>` marker -- never a bare `{}`.
function serializeEventDetailForLog(detail) {
    if (detail == null || typeof detail !== 'object') return detail;
    const out = {};
    for (const key of Object.keys(detail)) {
        const value = detail[key];
        if (value instanceof Element) {
            if (value.tagName === 'TR') {
                out[key] = Array.from(value.children).map((cell) => cell.textContent.trim());
            } else {
                out[key] = `<${value.tagName.toLowerCase()}>`;
            }
        } else {
            out[key] = value;
        }
    }
    return out;
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
// Docs: link/badge was ever built, even though the page's <div x-demo> wrapping
// was otherwise correct.
function siteRoot() {
    const stripped = location.pathname.replace(/(?:public|demos|pages|articles|tests\/fixtures)\/.*$/, '');
    // At the site root the path is a bare 'index.html' with no recognized
    // directory segment for the regex above to match, so it's a no-op there
    // — strip the trailing filename directly, which also covers the GitHub
    // Pages sub-path case ('/wb-starter/index.html').
    return stripped.replace(/[^/]*$/, '');
}

/**
 * Serialises every per-`<pre>` scan this module performs (#970, race #2).
 *
 * Each x-demo block independently rAF-polls for `window.WB` and then calls
 * `WB.scan(pre, { eager: true })`. On a page with 293 demo blocks that is 293
 * scans beginning at 293 unpredictable moments, interleaving with the main
 * scan's ongoing injection differently on every load.
 *
 * Measured on demos/site/cards.html: two loads produced traces of 9,032 and
 * 9,010 entry points that first diverged at line 2,203 — one run building a
 * card's internals (`inject(<header>, header)`) exactly where the other had
 * begun a code block (`scan(<pre>, eager=true)`). Same page, same code. Tests
 * asserting layout see whichever intermediate state they land on, which is
 * #961's run-to-run instability.
 *
 * A queue makes the ORDER deterministic without costing anything real: these
 * scans were never parallel work, merely unsequenced work. Each block still
 * awaits its own scan, so the width measurement that depends on a fully
 * highlighted `<pre>` is unaffected.
 */
let _scanQueue = Promise.resolve();

// docs/manifest.json, fetched once and shared by every x-demo on the page.
let _docsManifestPromise = null;
function loadDocsManifest() {
    if (!_docsManifestPromise) {
        _docsManifestPromise = fetch(siteRoot() + 'docs/manifest.json')
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
    }
    return _docsManifestPromise;
}

// #842: data/docs-manifest.json -- the GENERATED index of docs/, produced by a
// straight filesystem walk (scripts/update-docs-manifest.js, re-run by
// `npm start` before the server boots). docs/manifest.json above is the
// HAND-CURATED "docs landing page" list and covers only a subset: after it was
// pruned of 109 dead entries it holds 20 of the 177 files in docs/behaviors/,
// so the lookup for e.g. 'button' MISSED and the demo silently fell back to the
// generic behaviors-reference.md -- on EVERY demo on the site. Resolve against
// the generated index first: it is by construction exactly what is on disk, so
// "does this doc exist" is a Map hit rather than a guess, and no dead link can
// come out of it.
let _docsIndexPromise = null;
function loadDocsIndex() {
    if (!_docsIndexPromise) {
        _docsIndexPromise = fetch(siteRoot() + 'data/docs-manifest.json')
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                // key: docs-relative path lowercased (for lookup) -> value: the
                // real path as it exists on disk (what we actually link to).
                const index = new Map();
                for (const f of (json && json.files) || []) {
                    const p = String(f.path || '');
                    if (!p.toLowerCase().startsWith('docs/')) continue;
                    const rel = p.slice('docs/'.length);
                    index.set(rel.toLowerCase(), rel);
                }
                return index;
            })
            .catch(() => null);
    }
    return _docsIndexPromise;
}

// #842: the per-behavior doc for `x-<name>` / `<wb-name>` is
// docs/behaviors/<name>.md -- the schema-generated page that opens by stating
// which of the two behavior types it is (decorates a semantic element vs. new
// capability) and how to write it. A few hand-written pages keep the `x-`
// prefix in the filename, so try both. Returns the docs-relative path, or null
// when no such file exists.
function findGeneratedBehaviorDoc(index, name) {
    if (!index || !index.size) return null;
    for (const candidate of [`behaviors/${name}.md`, `behaviors/x-${name}.md`]) {
        const hit = index.get(candidate.toLowerCase());
        if (hit) return hit;
    }
    return null;
}

// Find the doc file (relative to docs/) for a component name: the generated
// per-behavior page first (docs/behaviors/<comp>.md), then a basename match in
// the curated manifest. Returns null when no doc exists.
//
// #842: the `wb-${comp}.md` candidate here was stale -- the docs tree holds no
// wb-*.md file at all any more, the filenames are `<name>.md` / `x-<name>.md`.
function findDocFile(manifest, comp, index) {
    const generated = findGeneratedBehaviorDoc(index, comp);
    if (generated) return generated;
    if (!manifest || !Array.isArray(manifest.categories)) return null;
    const names = [`${comp}.md`, `x-${comp}.md`];
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
// (`x-ripple`). Morphing (`x-as-card`) was removed in #783, so there is no
// longer a prefix to strip -- the attribute name IS the behavior name.
// Requires a preceding whitespace (not `<`) so it never matches a leading
// slice of an `<x-foo>` CUSTOM ELEMENT TAG name, same anchoring approach as
// no-redundant-x-attribute-on-native-tag.spec.ts's `(^|\s)x-${tag}` check.
function findXBehaviors(html) {
    const regex = /(?:^|\s)x-([a-z][a-z0-9]*)(?=[\s=/>]|$)/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        matches.push(match[1].toLowerCase());
    }
    return [...new Set(matches)]; // unique
}

// Resolve `x-<name>` to ITS OWN doc page.
//
// #842 (John, live): every 📖 badge on the site -- on a <button x-button>
// demo, an x-ripple demo, all of them -- pointed at
// docs/behaviors-reference.md. The label said "x-button docs" while the href
// was the same generic reference every time. Root cause: this function only
// looked in the CURATED docs/manifest.json, which lists 20 of the 177 files in
// docs/behaviors/. `button.md` is not one of the 20, so the basename match
// missed and control fell straight through to the behaviors-reference.md
// catch-all below -- for practically every behavior on the site. (Before the
// manifest was pruned of 109 dead entries the same miss was masked on some
// names by matching a STALE entry, which is worse, not better: a link to a
// file that no longer existed.)
//
// Order now: the generated per-behavior page (docs/behaviors/<name>.md, which
// is what the reader actually wants and is regenerated from the schemas), then
// a basename match anywhere in the curated manifest, and only then the shared
// reference -- so the fallback is the exception it was always meant to be
// rather than the universal answer. `wb-${name}.md` was dropped from the
// candidate list: no such file exists in the tree any more.
function findBehaviorDocFile(manifest, name, index) {
    const generated = findGeneratedBehaviorDoc(index, name);
    if (generated) return generated;
    if (!manifest || !Array.isArray(manifest.categories)) return null;
    const names = [`${name}.md`, `x-${name}.md`];
    for (const cat of manifest.categories) {
        for (const d of cat.docs || []) {
            const base = String(d.file || '').split('/').pop().toLowerCase();
            if (names.includes(base)) return d.file;
        }
    }
    // Last resort only: a behavior with no page of its own is still documented
    // as a table row in the shared reference, so this keeps "never a dead
    // link" true instead of silently dropping it from the Docs: line.
    for (const cat of manifest.categories) {
        for (const d of cat.docs || []) {
            if (String(d.file || '').toLowerCase().endsWith('behaviors-reference.md')) return d.file;
        }
    }
    return null;
}

// #388/#390: attach a small top-right doc-link "badge" directly onto ONE
// component instance, instead of relying on the single shared
// '.x-demo__links' line below the whole grid (which reads as detached from
// any individual instance once a demo holds more than one). Originally
// card-only (#388); generalized to every wb-* component (#390) after the
// same "Docs: x-dialog" shared-line pattern read just as detached on
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
function attachInstanceDocLink(hostEl, file, label, root, anchorEl) {
    const href = root + 'public/doc-viewer.html?file=' + encodeURIComponent('docs/' + file);
    const title = `${label} docs`;

    // #630/#641: was anchored to hostEl itself for multi-item grids, only
    // falling back to the outer <div x-demo> for a single-child demo -- but
    // "5rem off the element" (John) is impossible to guarantee against a
    // tiny host like a single x-badge pill without either colliding with
    // the next badge over or getting clipped by x-demo's own
    // overflow:hidden the moment the icon is pushed outside hostEl's box.
    // Always anchoring to the outer <div x-demo> instead sidesteps both: the
    // reserved padding-top:5rem this earns it (demo.css, `x-demo:has(>
    // .x-demo__card-doc-link)`) lives INSIDE x-demo's own box (never
    // clipped) and is shared page-wide instead of squeezed into every
    // individual pill (never collides with a neighbor). Multiple same-file
    // instances in one grid (e.g. six x-badge variants) now collapse to
    // ONE link per demo block instead of one per instance -- see the
    // same-href guard in build() below.
    const anchor = anchorEl;

    // #295: the badge is positioned top-right via `position: absolute`
    // (demo.css), which anchors to `anchor` ONLY if it's itself a
    // positioning context. x-card already sets position:relative in its
    // own CSS, so this was invisible there -- but #390 generalized this
    // badge to EVERY wb-* grid child, and most (x-spinner, x-badge,
    // plain x-alert, ...) are position:static. With no positioned
    // ancestor at all, the badge's containing block falls back to the
    // *viewport* (the initial containing block), so it renders pinned near
    // the top-right of the whole page instead of the small component it's
    // meant to label -- confirmed live: overflowed the page by 9px at
    // 375px on docs/V3-GUIDE.md's embedded <div x-demo>. Force a positioning
    // context only when one doesn't already exist, so this is a no-op for
    // every component (like x-card) that already provides one.
    if (getComputedStyle(anchor).position === 'static') {
        anchor.style.position = 'relative';
    }

    const build = () => {
        // #641: dedup by href, not "any link at all" -- anchor is always the
        // outer <div x-demo> now (see above), shared by every instance in the
        // grid, so a same-file dedup is what collapses e.g. six x-badge
        // variants pointing at the same badge.md down to ONE icon. A grid
        // mixing genuinely different components (rare) still gets one icon
        // per distinct file -- see demo.css's `~` sibling offset for how a
        // second, different-file icon avoids stacking on top of the first.
        const existing = Array.from(anchor.querySelectorAll(':scope > a.x-demo__card-doc-link'));
        if (existing.some((a) => a.getAttribute('href') === href)) return;
        const link = document.createElement('a');
        link.className = 'x-demo__card-doc-link';
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', title);
        link.title = title;
        link.textContent = '📖';
        // #593: for an x-behavior (popover/confirm/prompt/lightbox/drawer/...)
        // hostEl IS the same element carrying the behavior's own raw
        // `element.onclick = (e) => { e.preventDefault(); ... }` handler --
        // this badge is appended as anchor's DOM CHILD (never a sibling), so
        // a click on it bubbles straight into that handler same as any other
        // click on the button, WHEN anchor === hostEl. Several of those
        // handlers (overlay.js's confirm()/prompt()/lightbox()) don't check
        // e.target before calling e.preventDefault() unconditionally, which
        // silently kills the anchor's own navigation -- confirmed live:
        // clicking the "Confirm Dialog" demo's 📖 badge opened the confirm
        // overlay instead of the doc, no new tab, ever. Stopping propagation
        // here (target phase, before it bubbles to hostEl) keeps the badge a
        // fully independent control -- its own default action (navigate,
        // target=_blank) still fires normally; it just never reaches
        // hostEl's click handling. Harmless no-op when anchor !== hostEl
        // (nothing to stop it from reaching).
        link.addEventListener('click', (e) => e.stopPropagation());
        anchor.appendChild(link);
    };

    build();

    const observer = new MutationObserver(() => {
        if (!anchor.isConnected) {
            observer.disconnect();
            return;
        }
        build();
    });
    observer.observe(anchor, { childList: true });
    // Belt-and-suspenders: every lazy injection settles well within this —
    // never leave the observer running indefinitely.
    setTimeout(() => observer.disconnect(), 8000);
}

export async function demo(element, options = {}) {
    // Guard against double initialization
    if (element._demoInitialized) return () => {};
    element._demoInitialized = true;

    // demo.css styles both the <x-demo> tag and the .x-demo class, but only
    // the tag form was ever covered: on <div x-demo> the tag is "div", so
    // compliance.baseClass matched nothing and the readiness wait never saw
    // this behavior attach. Guarded so a literal <x-demo> tag stays clean.
    element.classList.add('x-demo');

    // Opt out of Standard §7's single-item shrink-to-fit (demo.css) for demos
    // whose one child is deliberately full-bleed (e.g. a page hero) rather
    // than a small widget that should collapse to its own content width.
    if (element.hasAttribute('full-width')) {
        element.classList.add('x-demo--full-width');
    }

    let rawBlock = '';
    // Source priority: _rawSource FIRST. It's captured at connectedCallback,
    // before children upgrade — the pristine authored markup, correct on every
    // surface. Page-source extraction is only a fallback: its regex also matches
    // literal "<div x-demo>…</div>" TEXT in the host page's comments/scripts —
    // on the doc-viewer (whose own code mentions x-demo) it captured a chunk of
    // the viewer's CSS/JS as the "source" (the garbage panels; #242/#262 CI).
    if (element._rawSource && element._rawSource.trim()) {
        rawBlock = element._rawSource;
    } else {
        try {
            const pageSource = await getPageSource();
            // #934: `[x-demo]`, not `x-demo`. This searched for a TAG that
            // cannot exist since 4.0.0 removed custom elements, so BOTH the
            // live count and the source count came out 0 -- #580's mismatch
            // guard then compared 0 === 0, passed vacuously, and extraction
            // returned ''. The panel fell through to element.innerHTML, i.e.
            // the fully expanded runtime DOM, and taught readers they must
            // hand-write the <figure>/<header>/inline styles a behavior builds
            // for them.
            const allDemos = document.querySelectorAll('[x-demo]');
            const idx = Array.from(allDemos).indexOf(element);
            rawBlock = extractTagBlock(pageSource, 'x-demo', idx, allDemos.length);
        } catch (e) {
            // ignore fetch errors
        }
        if (!rawBlock || !rawBlock.trim()) {
            rawBlock = (element.innerHTML && element.innerHTML.trim()) ? element.innerHTML : '';
        }
    }

    // #617: the '1' default below was written for §7's single-item
    // shrink-to-fit case, but Math.min(configuredCols, childCount) below
    // applies it UNCONDITIONALLY -- an auto-promoted fenced block with
    // several small top-level elements (e.g. badge.md's "Color Variants":
    // 6 <span x-badge> tags, plain markdown, no <div x-demo columns="..."> to set)
    // has no way to ever declare columns at all, so it always got forced to
    // 1 -- 6 badges stacked one per row, each row full container width even
    // though a badge is tiny, reading as a broken vertical column with a
    // huge empty gap. Only default to the strict '1' when there's genuinely
    // one child (or the caller explicitly asked for it); an undeclared
    // multi-child block gets a real default so it can flow more than one
    // per row.
    const declaredCols = options.columns || element.getAttribute('columns');
    const configuredCols = declaredCols
        ? parseInt(declaredCols, 10)
        : (element.children.length > 1 ? 3 : 1);
    // Standard §7: a demo is only as wide as what it renders — a single
    // narrow card wrapped in the default 3-column grid still stretched the
    // whole x-demo to fill 3 columns' worth of width even though only 1
    // was ever occupied. Clamp to however many children actually exist;
    // demo.css's cols-1 rule then sizes the whole demo (grid + code panel,
    // as one unit) to fit that content on desktop. Standard §26: below
    // 700px only, demo.css splits this apart instead — the grid still
    // hugs its content, but `x-demo` and its code panel stay full width,
    // so scrolling past many single-item demos on mobile doesn't jitter
    // the page's horizontal footprint.
    const childCount = element.children.length;
    const cols = childCount > 0 ? Math.min(configuredCols, childCount) : configuredCols;

    // Wrap children in a grid FIRST, so the doc links added below stay outside
    // the grid instead of being swept in as a grid item and floating inline (#211).
    const grid = document.createElement('div');
    grid.className = 'x-demo__grid x-demo__grid--cols-' + cols;
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

    // #486/#563/#586: the single-item shrink-to-fit width measurement
    // (originally lived here, right after the grid) now runs further down,
    // AFTER the `<pre class="x-demo__code">` panel is actually created --
    // see the comment above that block for why (#586: it used to run before
    // `<pre>` existed, which could lock in a too-narrow width on cards.html).

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
    // x-cardlink used to be excluded here: its own behavior (card.js
    // cardlink()) already stretches a real <a href> over the ENTIRE card
    // (deliberately, for native right-click/middle-click support -- see
    // that function's own comment), and a doc-link badge added on top
    // looked like it would fight the stretched anchor for clicks. Turned
    // out not to matter: the badge's own z-index (demo.css
    // .x-demo__card-doc-link, z-index:5 vs the stretched anchor's default
    // auto) keeps it independently clickable in its own small corner --
    // confirmed live, both anchors reachable. Re-included per explicit
    // request: "put all links on the card itself, upper right hand
    // corner" -- no carve-outs, every card including cardlink gets one.
    // #434: querySelectorAll('*'), not grid.children -- a wb-* component
    // wrapped inside a plain <div> (e.g. bundled alongside a stylesheet
    // link/script as a self-contained "view source" example) is a real,
    // documented component just as much as a direct grid child, but
    // grid.children only sees the wrapping <div>, silently falling through
    // to the deprecated shared "Docs: x-x" line below the grid instead of
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
        // #842: the generated docs index rides along in the same await — both
        // promises are module-level singletons, so this is one fetch per page
        // each no matter how many x-demo blocks the page holds.
        const [manifest, docsIndex] = await Promise.all([
            loadDocsManifest().catch(() => null),
            loadDocsIndex().catch(() => null),
        ]);
        const root = siteRoot();

        perInstanceChildren.forEach((hostEl) => {
            const comp = hostEl.tagName.slice(3).toLowerCase(); // WB-CARDHERO -> cardhero
            const file = findDocFile(manifest, comp, docsIndex);
            if (!file) return; // never a dead link
            attachInstanceDocLink(hostEl, file, `wb-${comp}`, root, element);
        });

        // John (reported repeatedly): pages/behaviors.html's demos are
        // native elements decorated with an x-* ATTRIBUTE (<button
        // x-ripple>, <button x-toast>), never a <wb-*> TAG -- the
        // per-instance corner badge above only ever matched perInstanceChildren
        // (WB-* tags), so every x-* behavior fell through to the shared
        // "Docs: x-toast" text line below the whole grid instead. Give each
        // ELEMENT THAT ACTUALLY CARRIES the attribute its own corner badge,
        // the same as a wb-* component gets, instead of a second, different
        // treatment for behaviors vs. components. (Morphing removed, #783.)
        // syntax) needs its own selector -- `[x-${name}]` alone won't match it.
        const resolvedXBehaviorNames = new Set();
        xBehaviors.forEach((name) => {
            const file = findBehaviorDocFile(manifest, name, docsIndex);
            if (!file) return; // never a dead link
            const hosts = grid.querySelectorAll(`[x-${name}]`);
            if (!hosts.length) return; // name matched in source text but no live element carries it
            resolvedXBehaviorNames.add(name);
            hosts.forEach((hostEl) => attachInstanceDocLink(hostEl, file, `x-${name}`, root, element));
        });

        const linkedComponents = sharedComponents
            .map((comp) => ({ label: `wb-${comp}`, file: findDocFile(manifest, comp, docsIndex) }))
            .filter((x) => x.file);
        const linkedBehaviors = xBehaviors
            .filter((name) => !resolvedXBehaviorNames.has(name))
            .map((name) => ({ label: `x-${name}`, file: findBehaviorDocFile(manifest, name, docsIndex) }))
            .filter((x) => x.file);
        const linked = [...linkedComponents, ...linkedBehaviors];
        if (linked.length) {
            const linksDiv = document.createElement('div');
            linksDiv.className = 'x-demo__links';
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
    pre.className = 'x-demo__code';
    pre.setAttribute('x-behavior', 'pre');
    pre.dataset.language = 'html';
    pre.dataset.showCopy = 'true';
    // #390: John's explicit override for x-demo code panels specifically --
    // horizontal scroll instead of wrapping. No `wrap` attribute means
    // pre.css's default applies (overflow-x: auto, white-space: pre; see
    // pre.css "Default (no wrap modifier): editor style -- long lines
    // scroll, never break"). Standard §6 (never a horizontal scrollbar)
    // still governs plain <pre x-behavior="pre"> elsewhere; this carve-out
    // is scoped to x-demo-generated code panels only.

    const code = document.createElement('code');
    code.className = 'language-html';
    code.setAttribute('x-behavior', 'code');
    code.dataset.language = 'html';
    // Standard §5: source is pretty-printed VERTICAL (one attribute per line).
    code.textContent = formatHtml(rawBlock);
    pre.appendChild(code);
    // #986: hide the panel until it has been scanned (which applies the `code`
    // behavior, and with it hljs highlighting) so the FIRST painted frame is
    // already coloured and already the right width.
    //
    // Measured before this: code painted as plain text at 234ms, .hljs-* spans
    // arrived at 741ms — 507ms of unstyled monospace — and the first width step
    // followed 27ms later at 768ms, because injecting the spans changed the
    // content width the shrink-to-fit poll was measuring. 983 resize events, ~2px
    // apiece, across 44 panels (#985). One ordering bug, both symptoms.
    //
    // visibility (not display) so the box still lays out and can be measured;
    // revealed unconditionally below, including when WB never arrives.
    pre.style.visibility = 'hidden';
    element.appendChild(pre);

    // Syntax highlight the "view source" panel just created above — scoped to
    // `pre` specifically, NOT `element` (the whole x-demo, including its
    // grid of MOVED, pre-existing children like x-alert/x-card/etc.).
    // Scanning the whole element used to be harmless because every demo()
    // call came from the global WB.scan(main) pass itself, so there was
    // only ever one scan in flight. Building eagerly now (#312 follow-up)
    // means demo() can run synchronously in connectedCallback, OUTSIDE
    // that global scan — scanning `element` here then raced the separate,
    // concurrent WB.scan(main) call over the SAME grid children, both
    // independently discovering e.g. <div x-alert> and injecting its behavior.
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
    // it's always assigned during page load: <div x-demo>'s connectedCallback
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
    //
    // #586: returns a Promise now (resolving once WB.scan(pre) itself has
    // resolved, or once retries are exhausted) instead of firing and
    // forgetting -- the width-measurement block right below AWAITS this,
    // so its very first poll runs against an already fully-styled,
    // already-highlighted `<pre>` (real monospace font, real padding, real
    // syntax-highlighting markup) instead of racing it. See that block's
    // own comment for why this matters.
    // #970 race #2: the scan is QUEUED, not fired the moment this block's own
    // rAF poll happens to succeed. Unsequenced, 293 of these interleave with
    // the main scan's injection differently on every load. Chained, they run in
    // a fixed order and the workflow becomes reproducible.
    //
    // The rAF retry stays: it answers "has WB loaded yet", which the queue does
    // not. Only the scan itself is sequenced.
    const scanWhenReady = (attemptsLeft = 20) => new Promise((resolve) => {
        const attempt = (left) => {
            if (window.WB) {
                _scanQueue = _scanQueue
                    .then(() => window.WB.scan(pre, { eager: true }))
                    // One block's failure must not stall every later block's
                    // scan -- a rejected link would poison the whole chain.
                    .catch(() => {});
                _scanQueue.then(resolve, resolve);
            } else if (left > 0) {
                requestAnimationFrame(() => attempt(left - 1));
            } else {
                resolve();
            }
        };
        attempt(attemptsLeft);
    });
    try {
        await scanWhenReady();
    } finally {
        // #986: reveal exactly once, whatever happened above. scanWhenReady()
        // resolves even when WB never loads (rAF retries exhausted), but a
        // throw must never leave a permanently invisible code panel.
        pre.style.visibility = '';
    }

    // #486: measure the GRID's own rendered width and hand it to demo.css as
    // --x-demo-shrink-width, for single-item demos only (desktop rule in
    // demo.css falls back to plain `fit-content` otherwise). A pure-CSS
    // `width: fit-content` on x-demo sizes to its WIDEST in-flow child —
    // including the `.x-demo__code` panel below the grid, which pre.css
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
    //
    // #586: this block used to run immediately after the grid was built,
    // BEFORE `<pre class="x-demo__code">` above even existed (pre creation
    // was gated behind `await loadDocsManifest()`) -- and even after moving
    // it below `<pre>`'s creation, a SECOND, deeper race remained: `<pre>`
    // existing in the DOM is not the same as `<pre>` being STYLED.
    // `WB.scan(pre, { eager: true })` (see `scanWhenReady` above) is itself
    // async -- it applies the real `.x-pre` class (monospace font, real
    // padding -- see pre.css) and syntax-highlighting markup on a LATER
    // microtask/frame, not synchronously inside the call. measure()'s
    // stability check (below) only requires codeWidth to read the SAME
    // value twice in a row before locking in `--x-demo-shrink-width` -- so
    // if `<pre>`'s first poll or two land BEFORE that async styling lands,
    // `scrollWidth` reads the bare/unstyled element's (smaller, wrong)
    // width, and if that happens to read stable for 2 ticks before the real
    // styled width ever appears, the box locks in too narrow. Confirmed
    // live on demos/site/cards.html (#586): with 267 stacked <div x-demo>
    // blocks on one page -- 5 of them (EAGER_BUILD_COUNT) built
    // synchronously, concurrently, right at page load -- main-thread
    // contention made this race easy to lose, intermittently, for whichever
    // demos happened to poll first; reproduced on both the eager-built
    // "Card Gallery" demos and the lazily-built x-cardexpandable/
    // x-cardvideo sections further down the page. Now fixed at the actual
    // source: this whole measurement block AWAITS `scanWhenReady()`
    // (above) before its first poll ever runs, so `<pre>` is guaranteed
    // fully styled and highlighted -- not just present -- by the time
    // codeWidth is first read.
    if (cols === 1 && childCount === 1 && !element.classList.contains('x-demo--full-width')) {
        // A single rAF measures whatever width the child happens to have at
        // that exact instant -- correct once its content is already fully
        // loaded, but a single-item child with its OWN async content still
        // loading (an image, an audio player building its equalizer UI,
        // etc.) hasn't reached its real final width yet: it measures small
        // (sometimes near-zero) and the whole demo -- including its code
        // panel -- gets stuck collapsed to that tiny width forever, since
        // nothing ever re-measures after. Confirmed live 3 separate times
        // (cardhero, 9 more card-family async-image demos, and now every
        // auto-live-rendered x-audio example on doc-viewer.html pages) --
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
            // width THIS code writes to --x-demo-shrink-width on the very
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
            // quantity the container's width can't feed back into. x-demo's
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
                    const codeEls = element.querySelectorAll('.x-demo__code');
                    // +4px safety margin -- see measure()'s CODE_WIDTH_SAFETY_PX
                    // comment below for why (a header/copy-button code panel's
                    // wrapper chrome isn't visible to a scrollWidth read).
                    const codeWidth = codeEls.length
                        ? Math.max(...Array.from(codeEls, el => el.scrollWidth)) + hPad + 4
                        : 0;
                    element.style.setProperty('--x-demo-shrink-width', Math.max(naturalWidth + extra + hPad, codeWidth) + 'px');
                    return true;
                };
                if (applyNaturalWidth()) {
                    // #586: `<pre class="x-demo__code">` is now guaranteed
                    // to already exist by the time this whole block runs
                    // (see the relocation comment above) -- this re-run is
                    // no longer covering a real race, just kept as a cheap
                    // extra safety net for the cached-media case.
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
                // #985: the measurement is committed once, at the end, rather
                // than on every poll -- see the two blocks below.
                let pendingShrinkWidth = 0;
                const POLL_MS = 200;
                const MAX_MS = 5000;
                const startedAt = Date.now();
                const measure = () => {
                    const demoCs = getComputedStyle(element);
                    const hPad = (parseFloat(demoCs.paddingLeft) || 0) + (parseFloat(demoCs.paddingRight) || 0);
                    const controlWidth = only.getBoundingClientRect().width + hPad;
                    // #563 follow-up, John: "show all the code on single
                    // elements per row" -- measuring only the control left
                    // the code panel (width:100% of x-demo, see demo.css)
                    // capped to the control's own width, cutting long
                    // attribute lines off with a scrollbar even though the
                    // demo box was meant to hug its content, not the
                    // control specifically. `.x-demo__code` is a `<pre>`
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
                    // Confirmed live: cards.html's x-cardproduct demos
                    // (HTML + `el.addEventListener(...)` JS sample) still
                    // cut the JS panel off because only the HTML panel's
                    // width was ever measured.
                    const codeEls = element.querySelectorAll('.x-demo__code');
                    // +CODE_WIDTH_SAFETY_PX: a code panel with a header/copy-
                    // button (pre.css's .x-pre--has-header) sits inside an
                    // `.x-pre-wrapper` with its own border -- chrome between
                    // the <pre> being measured and the demo's own edge that
                    // this calculation has no way to see. Sizing to
                    // scrollWidth exactly left the box 1-2px too narrow for
                    // its own content, tripping overflow-x:auto's scrollbar
                    // on code that's visibly not actually overflowing.
                    // Confirmed live: demos/registry-browser.html's
                    // icon-button/loading-skeleton examples (2px short).
                    const CODE_WIDTH_SAFETY_PX = 4;
                    const codeWidth = codeEls.length
                        ? Math.max(...Array.from(codeEls, el => el.scrollWidth)) + hPad + CODE_WIDTH_SAFETY_PX
                        : 0;
                    const shrinkWidth = Math.max(controlWidth, codeWidth);
                    // #985: do NOT commit every tick. This used to write the
                    // custom property on each of up to 25 polls, so every
                    // intermediate measurement was painted and the panel
                    // visibly stepped wider as its own content settled.
                    // Measured on demos/site/layout.html while scrolling:
                    // 46 steps per demo, 426px -> 935px, finishing ~978ms.
                    // Hold the value and commit ONCE, when it stops moving
                    // (or when the MAX_MS budget expires) -- one paint at the
                    // final width instead of 46 at wrong ones.
                    if (shrinkWidth > 0) pendingShrinkWidth = shrinkWidth;
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
                    // Two equal readings are not enough on their own. pre.js
                    // builds the line-number gutter AFTER the bare <pre>
                    // exists, and building it raises the panel's own
                    // padding-left from 12px to 40px to make room. A width
                    // measured before that lands ~14-28px short, and because
                    // the pre-gutter width is itself steady for several ticks
                    // it reads as "stable" and gets locked in -- the panel
                    // then reports scrollWidth > clientWidth forever after.
                    // Confirmed live: docs/components/semantic/address.md,
                    // scrollWidth=474 against clientWidth=460 on a sample
                    // whose longest line is only 48 characters.
                    //
                    // So hold stability open until every panel's gutter is
                    // fully built -- the same precondition
                    // doc-viewer-code-panel-audit.spec.ts waits for before it
                    // measures anything.
                    const guttersReady = Array.from(codeEls).every((panel) => {
                        const wrapper = panel.closest('.x-pre-wrapper');
                        if (!wrapper) return false;
                        const code = panel.querySelector('code');
                        const lines = ((code || panel).textContent || '').split('\n');
                        if (lines.length && lines[lines.length - 1] === '') lines.pop();
                        const nums = wrapper.querySelectorAll('.x-pre__line-numbers > div');
                        if (nums.length !== lines.length) return false;
                        return Array.from(nums).every((n) => n.style.top !== '');
                    });
                    if (!guttersReady) stableCount = 0;
                    if (stableCount >= 2 || Date.now() - startedAt > MAX_MS) {
                        // #985: the single commit. Settled, or out of budget --
                        // either way this is the best value available, and it is
                        // the only one the reader ever sees.
                        if (pendingShrinkWidth > 0) {
                            element.style.setProperty('--x-demo-shrink-width', pendingShrinkWidth + 'px');
                        }
                        return;
                    }
                    setTimeout(measure, POLL_MS);
                };
                requestAnimationFrame(measure);
            }
        }
    }

    // Syntax highlighting is applied earlier now -- see the `await
    // scanWhenReady()` call right after `<pre>` was created above, and the
    // #586 comment on the width-measurement block below explaining why.

    // #385: x-demo showed HOW to wire up a control's markup but never HOW
    // to listen for the custom events it fires afterward. Optional `events`
    // attribute (e.g. `events="wb:switch:change"`) adds two things when
    // present: an example addEventListener code sample (same
    // syntax-highlighted/copyable treatment as the source panel above), and
    // a REAL listener on `grid` that logs each firing to a small panel live
    // -- so a reader interacting with the rendered control above SEES the
    // event happen instead of only reading about it.
    const eventNames = parseEventNames(options.events || element.getAttribute('events'));
    if (eventNames.length) {
        // John: the live log should read right after the main source code --
        // see the result fire, THEN learn how it was wired -- rather than
        // after the "how to wire it up" section. Built in this order so a
        // reader sees it first, but appended to `element` before the
        // heading/example-code panel below so it lands directly under the
        // main code panel in the DOM.
        const log = document.createElement('div');
        log.className = 'x-demo__events-log';
        const logEmpty = document.createElement('div');
        logEmpty.className = 'x-demo__events-log-empty';
        logEmpty.textContent = 'Interact with the demo above to see these events fire, live:';
        log.appendChild(logEmpty);
        element.appendChild(log);

        const eventsHeading = document.createElement('div');
        eventsHeading.className = 'x-demo__events-heading';
        eventsHeading.textContent = 'Listening for events';
        element.appendChild(eventsHeading);

        const eventsPre = document.createElement('pre');
        eventsPre.className = 'x-demo__code x-demo__events-code';
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

        // Live log listens on `grid` specifically -- not `element` (the
        // whole x-demo, which by this point also contains the source and
        // events code panels themselves) -- so it only ever hears events
        // from the rendered control(s), never accidentally from a
        // click/copy interaction with the code panels. Events bubble, so
        // one listener per name here catches every descendant of grid.

        // Cap the log so a chatty/repeating event (e.g. drag move) can't
        // grow the panel unbounded -- newest entry on top, oldest falls off.
        const MAX_ENTRIES = 5;
        eventNames.forEach((name) => {
            grid.addEventListener(name, (e) => {
                if (logEmpty.isConnected) logEmpty.remove();
                let detailStr = '';
                if (e.detail !== undefined) {
                    try {
                        detailStr = JSON.stringify(serializeEventDetailForLog(e.detail));
                    } catch (err) {
                        detailStr = String(e.detail);
                    }
                }
                const entry = document.createElement('div');
                entry.className = 'x-demo__events-log-entry';
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
