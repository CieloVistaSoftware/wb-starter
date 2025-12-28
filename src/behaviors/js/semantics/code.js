import hljs from '/src/lib/highlight.js';

// Inject CSS if not present
if (!document.querySelector('link[data-highlight-theme]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/node_modules/highlight.js/styles/atom-one-dark.css';
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
 */
export function code(element, options = {}) {
  if (element.tagName !== 'CODE') {
    console.warn('[code] Element must be a <code>');
    return () => {};
  }

  const config = {
    language: options.language || element.dataset.language || '',
    showCopy: options.showCopy ?? (element.hasAttribute('data-show-copy') || element.hasAttribute('data-copy')),
    variant: options.variant || element.dataset.variant || 'inline',
    ...options
  };

  element.classList.add('wb-code');

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
      boxShadow: 'none'
    });
  } else {
    Object.assign(element.style, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '0.875em',
      padding: config.variant === 'inline' ? '0.2em 0.4em' : '0.5rem 1rem',
      borderRadius: 'var(--radius-sm, 4px)',
      backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.1))',
      color: 'var(--text-primary, inherit)',
      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      display: config.variant === 'inline' ? 'inline-block' : 'block',
      whiteSpace: config.variant === 'inline' ? 'nowrap' : 'pre-wrap',
      wordBreak: config.variant === 'inline' ? 'normal' : 'break-all',
      verticalAlign: 'middle'
    });
  }

  // Syntax Highlighting with highlight.js
  if (config.language) {
    // Add language class for hljs
    element.classList.add(`language-${config.language}`);
    
    // Highlight
    try {
        hljs.highlightElement(element);
        
        // Fix for inline code: hljs adds 'hljs' class which might set display: block and padding
        if (!isInsidePre && config.variant === 'inline') {
            element.style.display = 'inline-block';
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
      wrapper.className = 'wb-code-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;';

      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);

      copyButton = document.createElement('button');
      copyButton.className = 'wb-code__copy';
      copyButton.textContent = '📋';
      copyButton.title = 'Copy code';
      copyButton.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: var(--bg-secondary, #1f2937);
        border: 1px solid var(--border-color, #374151);
        color: var(--text-secondary, #9ca3af);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm, 4px);
        cursor: pointer;
        font-size: 0.875rem;
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
      wrapper.className = 'wb-code-wrapper';
      wrapper.style.cssText = 'position:relative;display:inline-block;';
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    }

    languageBadge = document.createElement('span');
    languageBadge.className = 'wb-code__language';
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

  element.dataset.wbReady = 'code';

  return () => {
    element.classList.remove('wb-code');
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}


export default code;
