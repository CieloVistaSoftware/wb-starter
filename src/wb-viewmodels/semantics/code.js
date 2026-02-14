import hljs from '/src/lib/highlight.js';
import { pre } from './pre.js';

// Inject CSS if not present (codecontrol behavior will override if used)
if (!document.querySelector('link[data-highlight-theme]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // Check localStorage for saved preference from codecontrol
  const savedTheme = localStorage.getItem('x-code-theme') || 'atom-one-dark-reasonable';
  // Use CDNJS for reliable loading
  link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${savedTheme}.min.css`;
  link.setAttribute('data-highlight-theme', 'true');
  document.head.appendChild(link);
  
  // Override background to transparent to let pre/code container handle it
  const style = document.createElement('style');
  style.textContent = `
    .hljs { background: transparent !important; }
  `;
  document.head.appendChild(style);
}

/**
 * Code - Enhanced <code> element
 * Adds syntax styling, copy button, language badge
 * Helper Attribute: [x-behavior="code"]
 */
export function code(element, options = {}) {
  // Handle <pre> wrapper - delegate to pre behavior for chrome, and apply code behavior to inner code for highlighting
  if (element.tagName === 'PRE') {
    // 1. Apply pre behavior (chrome: copy, badge, line numbers, scrollable)
    const cleanupPre = pre(element, options);
    
    // 2. Apply code behavior to inner code (highlighting)
    let codeElement = element.querySelector('code');
    let cleanupCode = () => {};
    
    // Auto-wrap content in code if missing (fixes issue where pre content isn't highlighted)
    if (!codeElement) {
        codeElement = document.createElement('code');
        // Move all child nodes to code element
        while (element.firstChild) {
            codeElement.appendChild(element.firstChild);
        }
        element.appendChild(codeElement);
    }
    
    if (codeElement) {
       // Pass language if set on pre
       const lang = options.language || element.dataset.language;
       // We don't pass other options because pre handles the chrome
       cleanupCode = code(codeElement, { language: lang });
    }
    
    return () => {
      if (cleanupPre) cleanupPre();
      if (cleanupCode) cleanupCode();
    };
  }

  if (element.tagName !== 'CODE') {
    console.warn('[code] Element must be a <code>');
    return () => {};
  }

  const config = {
    language: options.language || element.dataset.language || '',
    showCopy: options.showCopy ?? (element.hasAttribute('data-show-copy') || element.hasAttribute('data-copy')),
    variant: options.variant || element.dataset.variant || 'inline',
    scrollable: options.scrollable ?? (element.dataset.scrollable === 'true'),
    size: options.size || element.dataset.size || 'xs',
    ...options
  };

  // Size mappings - compact by default
  const sizeMap = {
    xs: '0.55em',
    sm: '0.6em',
    md: '0.65em',
    lg: '0.75em',
    xl: '0.85em'
  };
  const fontSize = sizeMap[config.size] || sizeMap.xs;

  element.classList.add('x-code');

  const isInsidePre = element.parentElement && element.parentElement.tagName === 'PRE';

  // Base styling
  if (isInsidePre) {
    Object.assign(element.style, {
      fontFamily: 'inherit',
      fontSize: 'inherit',
      padding: '0',
      borderRadius: '0',
      backgroundColor: 'transparent',
      color: 'inherit',
      border: 'none',
      display: 'inline', // Let pre handle block layout
      whiteSpace: 'inherit',
      wordBreak: 'inherit',
      verticalAlign: 'baseline',
      boxShadow: 'none',
      visibility: 'visible',
      opacity: '1'
    });
  } else {
    // Standalone code block (not inline, not in pre)
    const isBlock = config.variant !== 'inline';
    
    Object.assign(element.style, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: fontSize,
      padding: !isBlock ? '0.15em 0.3em' : '0.5rem 0.75rem',
      borderRadius: 'var(--radius-sm, 4px)',
      backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.1))',
      color: 'var(--text-primary, inherit)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      display: !isBlock ? 'inline' : 'block',
      whiteSpace: !isBlock ? 'normal' : (config.scrollable ? 'pre' : 'pre-wrap'),
      wordBreak: 'break-word', // Always break to prevent overflow
      overflowWrap: 'break-word',
      overflow: (isBlock && config.scrollable) ? 'auto' : 'hidden',
      verticalAlign: 'baseline',
      maxWidth: '100%'
    });
  }

  // Syntax Highlighting with highlight.js
  if (config.language) {
    // Add language class for hljs
    element.classList.add(`language-${config.language}`);
    
    // Highlight
    try {
        // Check if already highlighted to prevent warnings/errors
        if (!element.dataset.highlighted && hljs) {
            hljs.highlightElement(element);
        }
        
        // Fix for inline code: hljs adds 'hljs' class which might set display: block and padding
        if (!isInsidePre && config.variant === 'inline') {
            element.style.display = 'inline';
            element.style.padding = '0.2em 0.4em';
            element.style.backgroundColor = 'var(--bg-tertiary, rgba(255,255,255,0.1))'; // Keep our background for inline
        } else if (isInsidePre) {
             // Ensure background is transparent so pre's background shows
             element.style.backgroundColor = 'transparent';
             element.style.padding = '0';
        }
    } catch (e) {
        console.warn('[code] Highlight failed:', e);
    }
  }

  let wrapper = null;
  let copyButton = null;
  let languageBadge = null;

  // Add copy functionality
  if (config.showCopy) {
    // Inline variant: Click to copy
    if (config.variant === 'inline' && !isInsidePre) {
      element.style.cursor = 'pointer';
      element.title = 'Click to copy';
      
      element.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(element.textContent);
          
          // Visual feedback
          const originalBg = element.style.backgroundColor;
          element.style.backgroundColor = 'var(--success-color, #22c55e)';
          element.style.color = 'white';
          
          setTimeout(() => {
            element.style.backgroundColor = originalBg;
            element.style.color = 'var(--text-primary, inherit)';
          }, 500);
        } catch (err) {
          console.error('[code] Failed to copy:', err);
        }
      });
    }
    // Block variant: Add copy button (only if not inside PRE, as PRE handles its own copy button)
    else if (!isInsidePre) {
      wrapper = document.createElement('div');
      wrapper.className = 'x-code-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;';

      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);

      copyButton = document.createElement('button');
      copyButton.className = 'x-code__copy';
      copyButton.textContent = '📋';
      copyButton.title = 'Copy code';
      copyButton.style.cssText = `
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        background: var(--bg-secondary, #1f2937);
        border: 1px solid var(--border-color, #374151);
        color: var(--text-secondary, #9ca3af);
        padding: 0.1rem 0.3rem;
        border-radius: var(--radius-sm, 3px);
        cursor: pointer;
        font-size: 0.6rem;
        line-height: 1;
        transition: all 0.2s ease;
      `;

      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.backgroundColor = 'var(--bg-tertiary, #374151)';
      });

      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = 'var(--bg-secondary, #1f2937)';
      });

      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(element.textContent);
          copyButton.textContent = '✓';
          setTimeout(() => {
            copyButton.textContent = '📋';
          }, 2000);
        } catch (err) {
          console.error('[code] Failed to copy:', err);
        }
      });

      wrapper.appendChild(copyButton);
    }
  }

  // Add language badge
  if (config.language && !isInsidePre) { // Only add badge if not inside PRE (PRE handles its own badge)
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'x-code-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;';
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }

    languageBadge = document.createElement('span');
    languageBadge.className = 'x-code__language';
    languageBadge.textContent = config.language;
    languageBadge.style.cssText = `
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      background: var(--primary, #6366f1);
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm, 4px);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    `;

    wrapper.appendChild(languageBadge);

    if (copyButton) {
      element.style.paddingTop = '2.5rem';
    } else {
      element.style.paddingTop = '2rem';
    }
  }

  element.classList.add('wb-ready');

  return () => {
    element.classList.remove('x-code');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}


export default code;
