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

export async function mdhtml(element, options = {}) {
  const config = {
    src: options.src || element.dataset.src || element.getAttribute('src'),
    sanitize: options.sanitize ?? (element.getAttribute('sanitize') !== 'false'),
    breaks: options.breaks ?? (element.getAttribute('breaks') !== 'false'),
    gfm: options.gfm ?? (element.getAttribute('gfm') !== 'false'),
    headerIds: options.headerIds ?? (element.getAttribute('header-ids') !== 'false'),
    highlight: options.highlight ?? element.getAttribute('highlight'),
    size: options.size || element.getAttribute('size') || 'xs',
    ...options
  };

  element.classList.add('wb-mdhtml');
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
        const block = extractTagBlock(pageSource, 'wb-mdhtml', idx);
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
      // Remove script tags and on* attributes
      safeHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    }

    // Render HTML
    element.innerHTML = safeHtml;
    element.classList.remove('wb-mdhtml--loading');
    element.classList.add('wb-mdhtml--loaded');
    // Runtime/test hook: mark hydrated so tests can wait deterministically
    try { element.setAttribute('x-hydrated', '1'); element.dispatchEvent(new CustomEvent('wb:mdhtml:hydrated', { bubbles: true })); } catch (e) { /* best-effort */ }

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

    // Apply WB behaviors to generated content
    if (window.WB) {
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

        // 3. Scan the entire element for behaviors (including the ones we just marked)
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
    reload: () => mdhtml(element, options),
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
