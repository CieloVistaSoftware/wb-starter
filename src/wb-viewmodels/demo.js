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
 *   columns — grid columns (default 3)
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

// Site root that works from '/', '/demos/x.html', '/pages/x.html',
// '/public/doc-viewer.html' — locally or under a GitHub Pages sub-path.
function siteRoot() {
    return location.pathname.replace(/(?:public|demos|pages|articles)\/.*$/, '');
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

// #388: attach a small top-right doc-link "badge" directly onto ONE card,
// instead of relying on the single shared '.wb-demo__links' line below the
// whole grid (which reads as detached from any individual card once a demo
// holds more than one).
//
// Why a self-healing MutationObserver instead of a single appendChild: a
// card's own behavior (cardimage/cardhero/cardlink/etc, card.js) is applied
// lazily via WB's IntersectionObserver-driven injection (wb-lazy.js) on its
// own schedule, independent of this demo's build order -- and nearly every
// card behavior rebuilds via `element.innerHTML = ''` before laying out its
// header/main/footer. If that rebuild lands AFTER we've attached this link,
// it silently wipes it out. Every card is only ever rebuilt once by its own
// behavior, so watch for exactly that: if the link goes missing, put it
// back. Idempotent (checks for an existing link first), so it settles after
// at most one heal and stops mutating on its own re-insert.
function attachCardDocLink(cardEl, file, comp, root) {
    const href = root + 'public/doc-viewer.html?file=' + encodeURIComponent('docs/' + file);
    const label = `wb-${comp} docs`;

    const build = () => {
        if (cardEl.querySelector(':scope > .wb-demo__card-doc-link')) return;
        const link = document.createElement('a');
        link.className = 'wb-demo__card-doc-link';
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', label);
        link.title = label;
        link.textContent = '📖';
        cardEl.appendChild(link);
    };

    build();

    const observer = new MutationObserver(() => {
        if (!cardEl.isConnected) {
            observer.disconnect();
            return;
        }
        build();
    });
    observer.observe(cardEl, { childList: true });
    // Belt-and-suspenders: every lazy injection settles well within this —
    // never leave the observer running indefinitely.
    setTimeout(() => observer.disconnect(), 8000);
}

export async function demo(element, options = {}) {
    // Guard against double initialization
    if (element._demoInitialized) return () => {};
    element._demoInitialized = true;

    element.classList.add('wb-demo');

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

    const configuredCols = parseInt(options.columns || element.getAttribute('columns') || '3', 10);
    // Standard §7: a demo is only as wide as what it renders — a single
    // narrow card wrapped in the default 3-column grid still stretched the
    // whole wb-demo (and the code panel below it) to fill 3 columns' worth
    // of width even though only 1 was ever occupied. Clamp to however many
    // children actually exist; demo.css's cols-1 rule then sizes the whole
    // demo to fit that content instead of the full container width.
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

    // Add doc links. (#262: the old '?page=docs#wb-…' hrefs were
    // dead on EVERY surface — page-relative, so inside the doc-viewer they hit
    // doc-viewer.html?page=docs, and pages/docs.html has no #wb-* anchors anyway.)
    // Link each component to its REAL doc opened in the doc-viewer, resolved from
    // docs/manifest.json. Components with no doc get NO link — never a dead link.
    //
    // #388: CARD children of the grid get their OWN top-right link (attached
    // directly to that specific card, see attachCardDocLink above) instead of
    // being folded into the generic shared line — a multi-card demo used to
    // read as one detached caption under the whole group, not tied to any
    // individual card. Everything else (badges/alerts/buttons/etc, or
    // whatever isn't a card in a rare mixed block) keeps the original
    // shared-line behavior below, unchanged.
    const allComponents = findWbComponents(rawBlock);
    // wb-cardlink is excluded: its own behavior (card.js cardlink()) already
    // stretches a real <a href> over the ENTIRE card (deliberately, for
    // native right-click/middle-click support -- see that function's own
    // comment). A second doc-link <a> badge on top of that visually
    // overlaps the full-card anchor and fights it for clicks/z-index --
    // confirmed live: card.querySelectorAll('a[href]') returned 2 anchors,
    // one of them effectively unreachable. A card that's already entirely
    // a link doesn't need a second "read the docs" affordance layered on it.
    const cardChildren = Array.from(grid.children).filter(
        (child) => child.tagName && child.tagName.startsWith('WB-CARD') && child.tagName !== 'WB-CARDLINK'
    );
    const sharedComponents = allComponents.filter((comp) => !comp.startsWith('card'));
    if (cardChildren.length > 0 || sharedComponents.length > 0) {
        // Deterministic: await the (cached) manifest and build the links inline —
        // a floating .then() left empty divs when init raced page load.
        const manifest = await loadDocsManifest().catch(() => null);
        const root = siteRoot();

        cardChildren.forEach((cardEl) => {
            const comp = cardEl.tagName.slice(3).toLowerCase(); // WB-CARDHERO -> cardhero
            const file = findDocFile(manifest, comp);
            if (!file) return; // never a dead link
            attachCardDocLink(cardEl, file, comp, root);
        });

        const linked = sharedComponents
            .map((comp) => ({ comp, file: findDocFile(manifest, comp) }))
            .filter((x) => x.file);
        if (linked.length) {
            const linksDiv = document.createElement('div');
            linksDiv.className = 'wb-demo__links';
            linksDiv.textContent = 'Docs: ';
            linked.forEach(({ comp, file }, i) => {
                const link = document.createElement('a');
                link.href = root + 'public/doc-viewer.html?file=' + encodeURIComponent('docs/' + file);
                link.textContent = `wb-${comp}`;
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
    pre.setAttribute('wrap', 'true'); // Standard §6: wrap, never a horizontal scrollbar (plain v3 attr)

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
    if (window.WB) {
        // eager:true -- WB.scan()'s default lazy path defers [x-behavior]
        // elements to an IntersectionObserver instead of applying them
        // synchronously, so the code panel could sit unstyled/unscanned for
        // an indeterminate delay (confirmed live on public/doc-viewer.html:
        // the nested <code x-behavior="code"> got hljs highlighting while
        // the wrapping <pre x-behavior="pre"> sat with no x-pre class at
        // the same snapshot). The panel is built and appended synchronously
        // right above -- there's no perf reason to defer scanning it lazily.
        window.WB.scan(pre, { eager: true });
    }

    return () => {};
}

export default demo;
