import { readAttr } from '../core/read-attr.js';
/**
 * Markdown to HTML Behavior
 * -----------------------------------------------------------------------------
 * Converts markdown content to HTML using marked.js.
 * 
 * Custom Tag: <wb-mdhtml>
 * 
 * Usage:
 *   <wb-mdhtml>
 *     # Hello World
 *     This is **bold** and *italic*
 *   </wb-mdhtml>
 * 
 * Or with external file:
 *   <wb-mdhtml data-src="./docs/readme.md"></wb-mdhtml>
 * Or with absolute path:
 *   <wb-mdhtml data-src="/docs/architecture.md"></wb-mdhtml>
 * -----------------------------------------------------------------------------
 */
import { logError } from '../core/error-logger.js';
import { getPageSource, extractTagBlock } from './page-source-cache.js';

// Check if marked is available, if not load it
let markedLoaded = false;
let markedPromise = null;

async function loadMarked() {
  if (markedLoaded && window.marked) return window.marked;
  
  if (markedPromise) return markedPromise;
  
  markedPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.marked) {
      markedLoaded = true;
      resolve(window.marked);
      return;
    }
    
    // Load from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = () => {
      markedLoaded = true;
      resolve(window.marked);
    };
    script.onerror = () => reject(new Error('Failed to load marked.js from CDN'));
    document.head.appendChild(script);
  });
  
  return markedPromise;
}

// #295: a <table> given `display: block` (mdhtml.css, so wide tables scroll
// inside their own container instead of blowing out the page) is STILL a
// table-layout box internally -- its thead/tr/th children keep their table
// display values, and browsers may still size the table to its min-content
// width (driven by non-wrapping columns) rather than honoring width/
// max-width:100% on the table element itself. Confirmed live: at 375px,
// V3-GUIDE.md's "Mental model" table rendered its <thead>/<tr>/<th> boxes at
// ~655px wide, well past the viewport, even with the table's own
// overflow-x:auto/max-width:100% in place. Wrapping the table in a plain
// block-level <div> and moving the scroll/width containment onto THAT div
// sidesteps the quirk entirely -- a plain block box is never subject to
// table intrinsic-sizing rules, so it reliably clips/scrolls its content.
function wrapTables(root) {
  root.querySelectorAll('table').forEach((table) => {
    if (table.parentElement && table.parentElement.classList.contains('wb-mdhtml__table-wrap')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-mdhtml__table-wrap';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

// #295: hyphenated identifiers/compound words (e.g. `x-toast`, `wb-card`,
// well-known) get split at the hyphen when the browser wraps text -- the
// default Unicode line-breaking algorithm (UAX #14) treats a bare ASCII
// hyphen between two word characters as a normal soft line-break
// opportunity. Confirmed live: none of overflow-wrap (anywhere/break-word/
// normal) or word-break (normal/keep-all -- keep-all is CJK-only per MDN)
// stop the break; it isn't a CSS misconfiguration. The only reliable fix is
// swapping the literal '-' for a NON-BREAKING HYPHEN (U+2011), which renders
// visually identical in every font actually used here but is never treated
// as a break opportunity.
//
// Applied to everything EXCEPT inside <pre>: pre's copy-to-clipboard button
// (pre.js) copies element.textContent verbatim, so mutating hyphens there
// would silently corrupt copied code with an invisible non-ASCII character.
// Code blocks are also allowed to wrap/scroll more aggressively by design
// (§6) so the mid-word break there is a separate, already-accepted
// tradeoff, not this bug.
//
// ALSO skipped: any text node that looks like a repo path or filename
// (contains '/', or a dotted extension like ".md"/".html"). doc-viewer.html's
// own linkifyDocPaths() and the "auto-link path references" feature match
// `code`/`strong`/`b` text verbatim against a path regex AFTER this function
// has already run -- swapping a hyphen for U+2011 inside e.g.
// "docs/NOTES-V3-GUIDE.md" silently broke that match (confirmed live: three
// existing tests -- doc-viewer-pathlinks, v3-guide-doc-links,
// behaviors/docs-links's #125 case -- went from passing to failing the
// moment this ran unconditionally). Exact hyphen preservation for a
// path/filename matters more than the line-break cosmetic there.
const HYPHEN_RUN = /\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b/g;
const PATH_LIKE = /[\\/]|\.[A-Za-z0-9]{1,5}\b/;
function protectHyphenatedTokens(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || node.nodeValue.indexOf('-') === -1) return NodeFilter.FILTER_REJECT;
      if (node.parentElement && node.parentElement.closest('pre')) return NodeFilter.FILTER_REJECT;
      if (PATH_LIKE.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach((node) => {
    const replaced = node.nodeValue.replace(HYPHEN_RUN, (m) => m.replace(/-/g, '‑'));
    if (replaced !== node.nodeValue) node.nodeValue = replaced;
  });
}

export async function mdhtml(element, options = {}) {
  const config = {
    src: options.src || readAttr(element, 'src') || element.getAttribute('src'),
    sanitize: options.sanitize ?? (element.getAttribute('sanitize') !== 'false'),
    // John: "all text must flow until the end of the sentence, no 1/2 line
    // breaks" -- this defaulted to `true` (marked's `breaks` option: every
    // single \n in the SOURCE becomes a hard <br>), so any .md file authored
    // with the common ~80-char hard-wrap convention rendered with visible
    // line breaks at those arbitrary source positions instead of flowing to
    // fill the actual container width -- standard CommonMark/GFM behavior
    // (and what every other markdown renderer does) treats a single
    // newline as just whitespace within a paragraph; only a blank line
    // starts a new paragraph. Default now matches that; opt IN per-instance
    // via `breaks="true"` if a specific doc genuinely wants hard breaks.
    breaks: options.breaks ?? (element.getAttribute('breaks') === 'true'),
    gfm: options.gfm ?? (element.getAttribute('gfm') !== 'false'),
    headerIds: options.headerIds ?? (element.getAttribute('header-ids') !== 'false'),
    highlight: options.highlight ?? element.getAttribute('highlight'),
    size: options.size || element.getAttribute('size') || 'xs',
    // Auto-live-render (below) was built for CURATED docs content, where a
    // maintainer wrote and vetted every embedded ```html example. Default
    // true keeps that doc-viewer.html behavior unchanged. Anything rendering
    // ARBITRARY/untrusted markdown (a GitHub issue body, a user comment) must
    // opt out -- confirmed live: issue #527's own body text illustrating
    // this exact bug (a fenced `<wb-mdhtml src="/docs/guide.md">` example)
    // got auto-promoted to a real, live, fetching element on pages/issues.html,
    // reproducing the very 404 the issue was reporting.
    autoLiveRender: options.autoLiveRender ?? (element.getAttribute('auto-live-render') !== 'false'),
    ...options
  };

  // #448: skip the bare 'wb-mdhtml' token on a literal <wb-mdhtml> host --
  // mdhtml.css selects the `wb-mdhtml` TAG directly for that case now.
  // Still added for every OTHER host -- confirmed live: public/doc-viewer.html
  // calls mdhtml() directly on a plain <div id="content">, not a
  // <wb-mdhtml> tag, and mdhtml.css's `.wb-mdhtml` class rules still need to
  // select that div.
  if (element.tagName.toLowerCase() !== 'wb-mdhtml') element.classList.add('wb-mdhtml');
  element.classList.add('wb-mdhtml--loading');

  try {
    // Load marked library
    const marked = await loadMarked();
    
    // Custom renderer to add heading IDs. marked v5+ calls heading(token) with a
    // single token object {depth, text, tokens}; older marked called
    // heading(text, level). Reading `level` off the v5+ call yields undefined —
    // which produced `<hundefined>` tags. Support both signatures.
    const renderer = new marked.Renderer();
    renderer.heading = function(arg, level) {
      let depth, html, plain;
      if (arg && typeof arg === 'object') {
        // marked v5+ token object
        depth = arg.depth;
        html = this.parser ? this.parser.parseInline(arg.tokens) : arg.text;
        plain = arg.text;
      } else {
        // legacy (text, level)
        depth = level;
        html = arg;
        plain = arg;
      }
      const slug = String(plain)
        .toLowerCase()
        .replace(/<[^>]*>/g, '')           // Remove HTML tags
        .replace(/[^\w\s-]/g, '')          // Remove special chars except hyphens
        .replace(/\s+/g, '-')              // Replace spaces with hyphens
        .replace(/-+/g, '-')               // Collapse multiple hyphens
        .replace(/^-|-$/g, '');            // Trim hyphens from ends

      return `<h${depth} id="${slug}">${html}</h${depth}>\n`;
    };
    
    // Configure marked
    marked.setOptions({
      breaks: config.breaks,
      gfm: config.gfm,
      renderer: renderer
    });

    let markdown = '';

    // Get markdown content
    if (config.src) {
      // Load from external file
      try {
        // Normalize path: handle both /docs/file.md and docs/file.md
        let fetchPath = config.src;
        
        // If it's an HTTP URL, use as-is
        if (fetchPath.startsWith('http://') || fetchPath.startsWith('https://')) {
          // Use as-is
        } else if (window.location.protocol === 'blob:' || window.location.protocol === 'data:') {
          // In blob: or data: contexts relative paths can't resolve — pin to the dev origin
          if (!fetchPath.startsWith('/')) { fetchPath = '/' + fetchPath; }
          fetchPath = 'http://localhost:3000' + fetchPath;
        } else {
          // Resolve relative to the current page using standard URL semantics so
          // an article in /articles/ can reference a sibling .md (src="x.md")
          // without it being forced to site root. Absolute "/docs/x.md" paths are
          // preserved unchanged. (#159 — article-code)
          fetchPath = new URL(fetchPath, window.location.href).pathname;
        }
        
        // Log for debugging
        console.log('[mdhtml] Fetching:', fetchPath, '(original:', config.src + ')');
        
        const response = await fetch(fetchPath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText} when fetching ${fetchPath}`);
        }
        markdown = await response.text();
        
        console.log('[mdhtml] ✓ Loaded', markdown.length, 'characters');
      } catch (err) {
        element.classList.remove('wb-mdhtml--loading');
        element.classList.add('wb-mdhtml--error');
        
        console.warn('[mdhtml] Failed to load file: ' + config.src);
        logError('Unable to Load Documentation', {
          file: 'src/wb-viewmodels/mdhtml.js',
          to: 'wb-mdhtml',
          reason: err.message,
          response: err.message,
          src: config.src,
          stack: err.stack
        });
        
        element.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;text-align:center;">Failed to load <code>' + config.src + '</code>. See error log below for details.</p>';
        console.error('[mdhtml] Error loading file:', err);
        
        // Dispatch error event
        element.dispatchEvent(new CustomEvent('wb:mdhtml:error', {
          bubbles: true,
          detail: { src: config.src, error: err.message }
        }));
        
        return () => {};
      }
    } else {
      // Use inline content. `<wb-mdhtml>` isn't a real custom element (no
      // connectedCallback to capture pristine markup before upgrade, unlike
      // <wb-demo> — see wb-demo.js), so its raw content sits in the DOM as
      // real, live, browser-parsed elements from initial page load until
      // THIS async behavior runs. When that content includes an example like
      // `<div x-gallery columns="4">`, WB's own async scan can independently
      // find and enhance that (still real, still connected) div FIRST,
      // mutating it (adding classes, inline styles, normalizing boolean
      // attrs to `x-gallery=""`) before we ever read element.innerHTML here
      // — corrupting the "source" shown to the reader. Fetching the page's
      // own pristine source over the network sidesteps the race (always the
      // as-authored text, unaffected by any DOM mutation since parse time).
      let raw = null;
      try {
        const allMdHtml = document.querySelectorAll('wb-mdhtml');
        const idx = Array.from(allMdHtml).indexOf(element);
        const pageSource = await getPageSource();
        const block = extractTagBlock(pageSource, 'wb-mdhtml', idx, allMdHtml.length);
        if (block && block.trim()) raw = block;
      } catch (e) {
        // ignore — fall through to the live-DOM read below
      }
      if (raw == null) raw = element.innerHTML;

      // Code samples are frequently written HTML-escaped (&lt;form&gt;) so the
      // browser doesn't parse them as real elements. Decode entities once via
      // a textarea (whose content model is raw text): escaped samples become
      // the intended tags, and raw samples that contain no entities pass
      // through unchanged.
      const decoder = document.createElement('textarea');
      decoder.innerHTML = raw;
      markdown = decoder.value;
    }

    // Parse markdown to HTML
    const html = await marked.parse(markdown);

    // Basic XSS protection if sanitize is enabled
    let safeHtml = html;
    if (config.sanitize) {
      // Remove script tags and on* event-handler attributes. The `on\w+=`
      // match MUST require a real leading whitespace boundary (`\s+`, not
      // `\s*`) -- `\s*` let it match mid-word too, so any attribute NAME
      // that merely contains "on" followed by more word chars before its
      // own `=` (e.g. `options='[{"..."}]'` -- "opti|ons=") got treated as
      // a fake event handler and the whole `ons='[{"` through the next
      // quote was silently eaten. Confirmed live: every JSON-in-attribute
      // demo using `options=`/`data-options=` on doc-viewer.html rendered
      // its source panel (and, worse, its actual DOM attribute) corrupted.
      //
      // Second, separate flaw found live on docs/behaviors-reference.md's
      // own dialog demo: the value-matching group `["'][^"']*["']` doesn't
      // pair its closing quote with its opening one -- `[^"']*` stops at
      // ANY quote character, single or double. A real, legitimate
      // `onclick="document.getElementById('x').open()"` (double-quoted
      // attribute, single-quoted JS string literal inside) matched only as
      // far as the FIRST embedded single quote, so the "closing quote" the
      // regex found was actually the open-paren's quote, not the
      // attribute's real terminator. The replace ate `onclick="document.
      // getElementById('` and left `x').open()">Open Dialog</button>`
      // dangling, corrupting `<button ...>` into a malformed
      // `<buttonx').open()">` tag -- confirmed via the live DOM, not
      // guessed. Fixed by requiring the closing quote to match the SAME
      // quote character as the opening one (two alternatives, one per
      // quote style), so embedded quotes of the other kind are correctly
      // treated as ordinary content instead of a premature terminator.
      safeHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');
    }

    // Render HTML
    element.innerHTML = safeHtml;
    element.classList.remove('wb-mdhtml--loading');
    element.classList.add('wb-mdhtml--loaded');
    // Runtime/test hook: mark hydrated so tests can wait deterministically
    try { element.setAttribute('x-hydrated', '1'); element.dispatchEvent(new CustomEvent('wb:mdhtml:hydrated', { bubbles: true })); } catch (e) { /* best-effort */ }

    // #295: contain wide tables in their own scroll box and keep
    // hyphenated tokens whole -- see the two functions' own comments above.
    try { wrapTables(element); } catch (e) { /* best-effort, never break rendering */ }
    try { protectHyphenatedTokens(element); } catch (e) { /* best-effort, never break rendering */ }

    // Add captions to code blocks (System-wide)
    if (config.captions !== false) {
      let chapterCount = 0;
      let blockCount = 0;
      
      Array.from(element.children).forEach(child => {
        if (child.tagName === 'H2') {
          chapterCount++;
          blockCount = 0;
        } else if (child.tagName === 'PRE') {
          // Create wrapper
          const wrapper = document.createElement('div');
          wrapper.className = 'code-wrapper';
          
          // Insert wrapper before pre
          child.parentNode.insertBefore(wrapper, child);
          
          // Move pre into wrapper
          wrapper.appendChild(child);
          
          // Create caption
          const caption = document.createElement('div');
          caption.className = 'code-caption';
          caption.textContent = `C${chapterCount}.${blockCount}`;
          wrapper.appendChild(caption);
          
          blockCount++;
        }
      });
    }

    // Apply WB behaviors to generated content.
    //
    // #322: marking used to happen ONLY inside the `if (window.WB)` guard
    // below, alongside the actual scan() call -- but attribute marking has
    // no dependency on a WB runtime being loaded, only the scan() call does.
    // That mattered on public/doc-viewer.html specifically: it calls this
    // mdhtml() function directly, BEFORE wb.js has been dynamically
    // imported (wb.js is loaded lazily there, only once docHasWbContent()
    // detects wb-*/x-* markup already present in the rendered DOM -- see
    // its 'wb:mdhtml:loaded' handler). With marking gated behind
    // `window.WB` too, `window.WB` was undefined at this exact point on
    // that page, so x-pre/x-code never got set at all -- not only did the
    // scan() call below never run, docHasWbContent()'s own x-* attribute
    // check had nothing to find either, so wb.js never even got imported
    // for plain markdown docs (no <wb-*> tags), and a later manual
    // WB.scan(docEl) call (docs that DID import wb.js for other reasons,
    // e.g. an embedded <wb-demo>) still found no [x-pre]/[x-code] elements
    // to enhance. Confirmed live: every plain ```fenced``` code block
    // rendered through doc-viewer.html stayed unstyled (no .x-pre-wrapper,
    // no copy button, no line numbers), while only <wb-demo>'s OWN code
    // panels (styled via demo.js's separate, unconditional scan call) got
    // pre()'s enhancement. Splitting the marking out from the WB-gated
    // scan() fixes both: marking now always happens, so (a) a later
    // scan() call (whenever WB does load) has something to find, and
    // (b) docHasWbContent()'s x-* check now sees the x-pre/x-code
    // attributes it just set and correctly decides the doc needs WB.
    // 0. Auto-live-render eligible ```html fenced blocks. John: "all of
    // these examples must use wb-demo" -- a doc's usage examples were
    // read-only syntax-highlighted TEXT (the x-pre/x-code marking below
    // makes them look nice but never actually renders the component), so
    // a reader had to take the markup on faith instead of seeing it work.
    // Only convert a block that's UNAMBIGUOUSLY real, renderable component
    // markup -- language must be html, and it must contain at least one
    // element that's either a <wb-*> tag or carries an x-* attribute (the
    // two conventions WB.scan() actually dispatches on). A plain <div>/
    // <table>/etc. structural example, or a non-html language block (js,
    // bash, ...), is left as a normal read-only code sample -- converting
    // those would either do nothing (no WB tag to enhance) or render
    // unrelated markup as if it were a real demo.
    //
    // demo.js's own code-panel generation falls back to the live element's
    // innerHTML when its page-source fetch can't find a match (expected
    // here -- this markup only ever exists in the fetched markdown, never
    // in doc-viewer.html's own static source), so the auto-generated code
    // panel still shows the exact source correctly without any extra work.
    if (config.autoLiveRender) element.querySelectorAll('pre > code').forEach(code => {
        const pre = code.parentElement;
        if (pre.closest('wb-demo')) return; // already inside a real wb-demo block
        const isHtmlLang = /\blanguage-html\b/.test(code.className) || (!code.className && /^\s*</.test(code.textContent || ''));
        if (!isHtmlLang) return;

        const raw = code.textContent || '';
        // Full-document boilerplate (a "here's how to set up your own
        // index.html" illustration -- V3-GUIDE.md's own example, complete
        // with <head><link href="src/styles/..."></head>) can contain a
        // real <wb-*> tag deep inside without being a live-renderable
        // SNIPPET itself. Setting that whole thing as innerHTML still
        // parses and instantiates its <link>/<script> tags as real
        // elements -- the browser fetches their href/src exactly as if
        // they were genuine page resources, with paths that were only ever
        // meant to be read as illustrative text now resolving (usually
        // wrongly) against doc-viewer.html's own location. Confirmed live:
        // V3-GUIDE.md's boilerplate <link href="src/styles/themes.css">
        // 404'd at /public/src/styles/themes.css. Document-level tags are
        // the unambiguous signal this is a whole-file illustration, not a
        // component snippet.
        if (/<\s*(!doctype|html|head|body)\b/i.test(raw)) return;
        let tpl;
        try {
            tpl = document.createElement('template');
            tpl.innerHTML = raw;
        } catch (e) {
            return; // never break the doc over a malformed example
        }
        const isRenderable = Array.from(tpl.content.querySelectorAll('*')).some(
            (el) => el.tagName.toLowerCase().startsWith('wb-') || Array.from(el.attributes).some((a) => a.name.startsWith('x-'))
        );
        if (!isRenderable) return;

        const wbDemo = document.createElement('wb-demo');
        wbDemo.innerHTML = raw;
        pre.replaceWith(wbDemo);
    });

    // 1. Pre-process Pre blocks (configure them before scanning)
    element.querySelectorAll('pre').forEach(el => {
        // Check if it has a code block with language class
        const code = el.querySelector('code');
        if (code) {
            // Extract language from class (e.g., "language-js")
            const langMatch = code.className.match(/language-(\w+)/);
            if (langMatch) {
                el.dataset.language = langMatch[1];
                code.dataset.language = langMatch[1];
            }

            // Default options for markdown code blocks
            el.dataset.showLineNumbers = "true";
            el.dataset.showCopy = "true";

            // Mark for injection with x-{behavior} attributes
            // WB.scan() looks for selectors like [x-pre], [x-code] etc.
            el.setAttribute('x-pre', '');
            code.setAttribute('x-code', '');
        }
    });

    // 2. Pre-process inline code
    element.querySelectorAll('code:not(pre code)').forEach(el => {
         el.setAttribute('x-code', '');
    });

    // 3. Scan the entire element for behaviors (including the ones we just
    // marked) -- still gated: only actually inject if a WB runtime has
    // loaded by this point (e.g. wb-lazy.js pages, which import WB up front).
    // Pages that load WB later (doc-viewer.html) rely on their OWN later
    // scan() call to pick up the attributes marked above.
    if (window.WB) {
        window.WB.scan(element);
    }

    // Markdown font size comes from ONE configuration setting: --md-font-size
    // (themes.css, 1rem). The old size map (0.55–0.85rem) made every .md doc too
    // small to read on mobile; the legacy size option is ignored on purpose so
    // there is a single knob.
    element.style.fontSize = 'var(--md-font-size, 1rem)';
    
    // Ensure no overflow
    element.style.maxWidth = '100%';

    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:mdhtml:loaded', {
      bubbles: true,
      detail: { src: config.src, length: markdown.length }
    }));

  } catch (err) {
    element.classList.remove('wb-mdhtml--loading');
    element.classList.add('wb-mdhtml--error');
    console.warn('[mdhtml] Unexpected error');
    logError('mdhtml Unexpected Error', {
      file: 'src/wb-viewmodels/mdhtml.js',
      to: 'wb-mdhtml',
      reason: err.message,
      src: config.src,
      stack: err.stack
    });
    element.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;text-align:center;">Error loading content. See error log below.</p>';
    console.error('[mdhtml] Unexpected error:', err);
  }

  // Mark as ready
  // Expose reload method
  element.wbMdhtml = {
    refresh: () => mdhtml(element, options),
    load: async (src) => {
      element.setAttribute('src', src);
      return mdhtml(element, { ...options, src });
    }
  };

  // Cleanup
  return () => {
    element.classList.remove('wb-mdhtml', 'wb-mdhtml--loading', 'wb-mdhtml--loaded', 'wb-mdhtml--error');
    delete element.wbMdhtml;
  };
}

export default mdhtml;
