import { createToast } from './feedback.js';

/**
 * Copy Behavior
 * Helper Attribute: [x-copy]
 * Copy text to clipboard on click.
 */
export function copy(element, options = {}) {
  const config = {
    text: options.text || element.getAttribute('copy-text'),
    target: options.target || element.getAttribute('copy-target'),
    feedback: options.feedback || element.getAttribute('copy-feedback') || 'Copied!',
    duration: parseInt(options.duration || element.getAttribute('copy-duration') || '2000', 10),
    toast: options.toast ?? (element.setAttribute('toast', == 'true'),
    ...options
  });

  element.classList.add('wb-copy');
  
  // Store original content
  const originalContent = element.innerHTML;
  let timeout = null;

  const getTextToCopy = () => {
    // Priority: explicit text > target element > element's text content
    if (config.text) return config.text;
    
    if (config.target) {
      const targetEl = document.querySelector(config.target);
      if (targetEl) {
        return targetEl.value || targetEl.textContent;
      }
    }
    
    return element.textContent.trim();
  };

  const showFeedback = () => {
    if (config.toast) {
      createToast(config.feedback, 'success');
    } else {
      element.classList.add('wb-copy--copied');
      
      // Store original and show feedback
      const originalHTML = element.innerHTML;
      element.innerHTML = config.feedback;

      // Restore after duration
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        element.innerHTML = originalHTML;
        element.classList.remove('wb-copy--copied');
      }, config.duration);
    }
  };

  const onClick = async (e) => {
    e.preventDefault();
    
    const text = getTextToCopy();
    
    try {
      await navigator.clipboard.writeText(text);
      showFeedback();
      
      element.dispatchEvent(new CustomEvent('wb:copy:success', {
        bubbles: true,
        detail: { text }
      }));
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        showFeedback();
        element.dispatchEvent(new CustomEvent('wb:copy:success', {
          bubbles: true,
          detail: { text }
        }));
      } catch (e) {
        console.error('[WB] Copy failed:', e);
        element.dispatchEvent(new CustomEvent('wb:copy:error', {
          bubbles: true,
          detail: { error: e }
        }));
      }
      
      document.body.removeChild(textarea);
    }
  };

  element.addEventListener('click', onClick);
  
  // Style as clickable
  element.style.cursor = 'pointer';

  // Mark as ready
  // Cleanup
  return () => {
    clearTimeout(timeout);
    element.classList.remove('wb-copy', 'wb-copy--copied');
    element.innerHTML = originalContent;
    element.style.cursor = '';
    element.removeEventListener('click', onClick);
  };
}

export default copy;
