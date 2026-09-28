/**
 * JSON Viewer - Pretty print JSON
 * Helper Attribute: [x-behavior="json"]
 */
import hljs from '../../lib/highlight.js';

export function json(element, options = {}) {
  const config = {
    data: options.data || element.textContent || '{}',
    theme: options.theme || element.dataset.theme || 'dark',
    ...options
  };

  element.classList.add('x-json');
  
  try {
    const obj = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const formatted = JSON.stringify(obj, null, 2);
    
    element.innerHTML = `<pre><code class="language-json">${formatted}</code></pre>`;
    
    const codeEl = element.querySelector('code');
    if (hljs) {
      hljs.highlightElement(codeEl);
    }
    
    // The panel look is .x-json in json.css (#779: it was written onto the
    // host's and the <code>'s style attributes).

  } catch (e) {
    console.error('[WB JSON] Invalid JSON', e);
    element.textContent = 'Invalid JSON';
    element.classList.add('x-json--invalid');
  }

  return () => element.classList.remove('x-json', 'x-json--invalid');
}

export default json;
