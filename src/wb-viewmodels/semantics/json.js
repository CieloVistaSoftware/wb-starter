/**
 * JSON viewer with syntax highlighting and pretty printing.
 * - `[x-behavior="json"]` for formatted JSON display.
 */
export function cc() {}

import hljs from '/src/lib/highlight.js';

export function json(element, options = {}) {
  const config = {
    data: options.data || element.textContent || '{}',
    theme: options.theme || element.dataset.theme || 'dark',
    ...options
  };

  element.classList.add('wb-json');
  
  try {
    const obj = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const formatted = JSON.stringify(obj, null, 2);
    
    element.innerHTML = `<pre><code class="language-json">${formatted}</code></pre>`;
    
    const codeEl = element.querySelector('code');
    if (hljs) {
      hljs.highlightElement(codeEl);
    }
    
    // Style
    Object.assign(element.style, {
      display: 'block',
      background: 'var(--bg-code, #1e1e1e)',
      padding: '1rem',
      borderRadius: '6px',
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '0.875rem'
    });
    
    Object.assign(codeEl.style, {
      background: 'transparent',
      padding: '0'
    });

  } catch (e) {
    console.error('[WB JSON] Invalid JSON', e);
    element.textContent = 'Invalid JSON';
    element.style.color = 'var(--error, #ef4444)';
  }

  return () => element.classList.remove('wb-json');
}

export default json;
