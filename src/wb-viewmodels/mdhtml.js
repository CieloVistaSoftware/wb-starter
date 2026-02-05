/**
 * Markdown to HTML converter using marked.js with code highlighting.
 * - `<wb-mdhtml>` for inline or external markdown rendering.
 */
export function cc() {}

/**
 * Dedent: strip common leading whitespace from all lines.
 * Fixes GFM fenced code blocks (```) that inherit HTML template indentation.
 * GFM only allows 0-3 spaces before ```, so 4+ spaces breaks recognition.
 */
function dedent(text) {
  const lines = text.split('\n');
  // Find minimum indentation of non-empty lines
  const indents = lines
    .filter(line => line.trim().length > 0)
    .map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[0].length : 0;
    });
  if (indents.length === 0) return text;
  const minIndent = Math.min(...indents);
  if (minIndent === 0) return text;
  // Strip that many leading characters from each line
  return lines
    .map(line => line.length >= minIndent ? line.substring(minIndent) : line)
    .join('\n')
    .trim();
}

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
    
    // Custom renderer to add heading IDs
    const renderer = new marked.Renderer();
    renderer.heading = function(text, level) {
      // Generate slug from text (handle objects from marked v5+)
      const textContent = typeof text === 'object' ? text.text : text;
      const slug = textContent
        .toLowerCase()
        .replace(/<[^>]*>/g, '')           // Remove HTML tags
        .replace(/[^\w\s-]/g, '')          // Remove special chars except hyphens
        .replace(/\s+/g, '-')              // Replace spaces with hyphens
        .replace(/-+/g, '-')               // Collapse multiple hyphens
        .replace(/^-|-$/g, '');            // Trim hyphens from ends
      
      return `<h${level} id="${slug}">${textContent}</h${level}>\n`;
    };
    
    // Configure marked
    marked.setOptions({
      breaks: config.breaks,
      gfm: config.gfm,
      renderer: renderer
    });

    let markdown = '';

    // Get markdown content
    // Priority: 1. data-src (external file), 2. <template> child (preserves HTML), 3. textContent
    const templateEl = element.querySelector('template');
    
    if (config.src) {
      // Load from external file — no dedent needed for fetched files
      try {
        // Normalize path: handle both /docs/file.md and docs/file.md
        let fetchPath = config.src;
        
        // If it's an HTTP URL, use as-is
        if (fetchPath.startsWith('http://') || fetchPath.startsWith('https://')) {
          // Use as-is
        } else if (!fetchPath.startsWith('/')) {
          // Relative path - prepend / for absolute resolution
          fetchPath = '/' + fetchPath;
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
        
        // Show detailed error message
        const errorHtml = `
          <div class="wb-mdhtml__error" style="padding: 1.5rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; font-family: system-ui;">
            <div style="font-weight: 600; color: #dc2626; margin-bottom: 0.5rem;">📄 Unable to Load Documentation</div>
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
              <div><strong>File:</strong> <code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 3px;">${config.src}</code></div>
              <div><strong>Error:</strong> ${err.message}</div>
            </div>
            <div style="font-size: 0.75rem; color: #999;">
              <p style="margin: 0.5rem 0;">Troubleshooting:</p>
              <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                <li>Check file path is correct</li>
                <li>Ensure docs/ folder exists</li>
                <li>Check browser console for more details</li>
              </ul>
            </div>
          </div>
        `;
        element.innerHTML = errorHtml;
        console.error('[mdhtml] Error loading file:', err);
        
        // Dispatch error event
        element.dispatchEvent(new CustomEvent('wb:mdhtml:error', {
          bubbles: true,
          detail: { src: config.src, error: err.message }
        }));
        
        return () => {};
      }
    } else if (templateEl) {
      // Use content from <template> child - preserves HTML as raw text
      // Dedent to fix GFM fenced code blocks that inherit HTML indentation
      markdown = dedent(templateEl.innerHTML);
    } else {
      // Use inline content (works for non-HTML markdown)
      // Dedent to fix indented inline markdown
      markdown = dedent(element.textContent || element.innerText);
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
    try { element.dataset.wbHydrated = '1'; element.dispatchEvent(new CustomEvent('wb:mdhtml:hydrated', { bubbles: true })); } catch (e) { /* best-effort */ }

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

    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:mdhtml:loaded', {
      bubbles: true,
      detail: { src: config.src, length: markdown.length }
    }));

  } catch (err) {
    element.classList.remove('wb-mdhtml--loading');
    element.classList.add('wb-mdhtml--error');
    element.innerHTML = `<div class="wb-mdhtml__error" style="color: #dc2626; padding: 1rem;">⚠️ Error: ${err.message}</div>`;
    console.error('[mdhtml] Unexpected error:', err);
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
