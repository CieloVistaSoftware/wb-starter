/**
 * Markdown to HTML Behavior
 * =========================
 * Converts markdown content to HTML using marked.js
 * 
 * Usage:
 *   <div data-wb="mdhtml">
 *     # Hello World
 *     This is **bold** and *italic*
 *   </div>
 * 
 * Or with external file:
 *   <div data-wb="mdhtml" data-src="./docs/readme.md"></div>
 */

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
    script.onerror = () => reject(new Error('Failed to load marked.js'));
    document.head.appendChild(script);
  });
  
  return markedPromise;
}

export async function mdhtml(element, options = {}) {
  const config = {
    src: options.src || element.dataset.src,
    sanitize: options.sanitize ?? (element.dataset.sanitize !== 'false'),
    breaks: options.breaks ?? (element.dataset.breaks !== 'false'),
    gfm: options.gfm ?? (element.dataset.gfm !== 'false'),
    headerIds: options.headerIds ?? (element.dataset.headerIds !== 'false'),
    highlight: options.highlight ?? element.dataset.highlight,
    size: options.size || element.dataset.size || 'xs',
    ...options
  };

  element.classList.add('wb-mdhtml');
  element.classList.add('wb-mdhtml--loading');

  try {
    // Load marked library
    const marked = await loadMarked();
    
    // Configure marked
    marked.setOptions({
      breaks: config.breaks,
      gfm: config.gfm,
      headerIds: config.headerIds,
    });

    let markdown = '';

    // Get markdown content
    if (config.src) {
      // Load from external file
      try {
        const response = await fetch(config.src);
        if (!response.ok) {
          throw new Error(`Failed to load ${config.src}: ${response.status}`);
        }
        markdown = await response.text();
      } catch (err) {
        element.classList.remove('wb-mdhtml--loading');
        element.classList.add('wb-mdhtml--error');
        element.innerHTML = `<div class="wb-mdhtml__error">Failed to load: ${config.src}</div>`;
        console.error('[WB] mdhtml:', err);
        return () => {};
      }
    } else {
      // Use inline content
      markdown = element.textContent || element.innerText;
    }

    // Parse markdown to HTML
    const html = marked.parse(markdown);

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

    // Apply WB behaviors to generated content
    if (window.WB) {
        // Scan the entire element for behaviors (including auto-inject)
        // This will handle cardlink, button, and any other behaviors in the markdown
        window.WB.scan(element);

        // Handle Pre blocks (which contain code)
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
                
                // Inject behaviors
                el.dataset.wb = "pre";
                code.dataset.wb = "code";
                
                window.WB.inject(el, 'pre');
                window.WB.inject(code, 'code');
            }
        });

        // Handle inline code
        element.querySelectorAll('code:not(pre code)').forEach(el => {
             el.dataset.wb = "code";
             window.WB.inject(el, 'code');
        });
    }

    // Apply size via CSS font-size on container (cascades to all children)
    // Always apply for consistent sizing
    const sizeMap = {
      xs: '0.55rem',
      sm: '0.6rem',
      md: '0.65rem',
      lg: '0.75rem',
      xl: '0.85rem'
    };
    element.style.fontSize = sizeMap[config.size] || sizeMap.xs;
    
    // Ensure no overflow
    element.style.maxWidth = '100%';
    // element.style.overflowWrap = 'break-word';
    // element.style.wordBreak = 'break-word';

    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:mdhtml:loaded', {
      bubbles: true,
      detail: { src: config.src, length: markdown.length }
    }));

  } catch (err) {
    element.classList.remove('wb-mdhtml--loading');
    element.classList.add('wb-mdhtml--error');
    element.innerHTML = `<div class="wb-mdhtml__error">Error: ${err.message}</div>`;
    console.error('[WB] mdhtml:', err);
  }

  // Mark as ready
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' mdhtml';

  // Expose reload method
  element.wbMdhtml = {
    reload: () => mdhtml(element, options),
    load: async (src) => {
      element.dataset.src = src;
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
