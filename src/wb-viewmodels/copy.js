import { createToast } from './feedback.js';

/**
 * Write text to the clipboard, falling back to a hidden-textarea +
 * document.execCommand('copy') when navigator.clipboard is unavailable or
 * rejects (older browsers, insecure context, denied permission).
 *
 * Shared core used by both copy() ([x-copy] — the element itself IS the
 * trigger) and copyButton() ([x-copybutton] — a separate overlay button on
 * the element) so the clipboard-write + fallback logic exists in exactly one
 * place instead of being hand-rolled per behavior (#291). Also reused by
 * semantics/pre.js's copy-button control and the Playground's copy actions
 * so there is one clipboard-write implementation project-wide.
 * @param {string} text
 * @returns {Promise<boolean>} true on success, false if every path failed
 */
export async function writeToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // The fallback has to put the text in a real, selected field for
    // execCommand('copy') to see it — and selecting a field focuses it. That
    // takes focus away from whatever the user was in, and removing the element
    // afterwards leaves document.activeElement as <body> rather than handing
    // it back.
    //
    // Caught as a wrong-looking Playground: clicking an example jumped to its
    // markup and selected it, but the textarea was no longer focused, so the
    // next keystroke went nowhere. The selection survived — it is a property
    // of the element, not of the focus — which is what made the jump look like
    // it had worked.
    //
    // For a keyboard user that is the whole bug: copy anything and you are
    // silently returned to the top of the document.
    const previouslyFocused = document.activeElement;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      return true;
    } catch (e) {
      console.error('[WB] Copy failed:', e);
      return false;
    } finally {
      document.body.removeChild(textarea);

      // Restore focus, but never *give* focus to something that did not have
      // it: with nothing focused, activeElement is <body>, and calling focus()
      // there would be a change rather than a restoration.
      if (previouslyFocused
          && previouslyFocused !== document.body
          && previouslyFocused.isConnected
          && typeof previouslyFocused.focus === 'function') {
        // preventScroll: restoring focus must not yank the viewport back to
        // wherever that element sits.
        previouslyFocused.focus({ preventScroll: true });
      }
    }
  }
}

/**
 * Copy Behavior
 * Helper Attribute: [x-copy]
 * Copy text to clipboard on click. The element ITSELF is the copy trigger.
 * For overlaying a SEPARATE copy button on an element without changing what
 * the element does, see copyButton() ([x-copybutton]) below.
 */
export function copy(element, options = {}) {
  const config = {
    // copy.schema.json declares plain `text`/`target` (Law 11/v3 canonical
    // attributes) -- the copy-text/copy-target legacy names below were the
    // ONLY thing ever read, so <div x-copy text="..."> (what the schema itself
    // documents, and what demos/site/interactive.html actually writes)
    // silently fell through to copying the element's own textContent instead.
    text: options.text || element.getAttribute('text') || element.getAttribute('copy-text'),
    target: options.target || element.getAttribute('target') || element.getAttribute('copy-target'),
    feedback: options.feedback || element.getAttribute('copy-feedback') || 'Copied!',
    duration: parseInt(options.duration || element.getAttribute('copy-duration') || '2000', 10),
    toast: options.toast ?? element.hasAttribute('toast'),
    ...options
  };

  // #448: no classList.add('x-copy') -- copybutton.css's own comment
  // confirms .x-copy has "no dedicated CSS"; nothing selects the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-copy> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-copy> tag does not get a redundant class.
  if (element.tagName.toLowerCase() !== 'x-copy') element.classList.add('x-copy');

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
      element.classList.add('x-copy--copied');
      
      // Store original and show feedback
      const originalHTML = element.innerHTML;
      element.innerHTML = config.feedback;

      // Restore after duration
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        element.innerHTML = originalHTML;
        element.classList.remove('x-copy--copied');
      }, config.duration);
    }
  };

  const onClick = async (e) => {
    e.preventDefault();

    const text = getTextToCopy();
    const ok = await writeToClipboard(text);

    if (ok) {
      showFeedback();
      element.dispatchEvent(new CustomEvent('wb:copy:success', {
        bubbles: true,
        detail: { text }
      }));
    } else {
      element.dispatchEvent(new CustomEvent('wb:copy:error', {
        bubbles: true,
        detail: { text }
      }));
    }
  };

  element.addEventListener('click', onClick);
  
  // Style as clickable
  element.style.cursor = 'pointer';

  // Mark as ready
  // Cleanup
  return () => {
    clearTimeout(timeout);
    element.classList.remove('x-copy', 'x-copy--copied');
    element.innerHTML = originalContent;
    element.style.cursor = '';
    element.removeEventListener('click', onClick);
  };
}

/**
 * Copy Button Behavior
 * Helper Attribute: [x-copybutton]
 * Overlays a small positioned button (default: top-right) on ANY element
 * that copies the element's own value/text — or a target override — to the
 * clipboard, with the same visible-feedback pattern as copy(). Distinct
 * from x-copy: x-copy turns the element ITSELF into the copy trigger;
 * x-copybutton puts a SEPARATE trigger ON the element without changing what
 * the element does (host stays interactive — e.g. a <textarea> stays
 * typeable). See docs/behaviors/x-copybutton.md for the full API and the
 * differences table (#291).
 *
 * API:
 *   <textarea x-copybutton></textarea>           button copies the textarea's value
 *   <pre x-copybutton>...</pre>                  button copies textContent
 *   <div x-copybutton="#targetId">...</div>      button copies #targetId's value/text
 *   copy-target="#targetId"                      same as x-copybutton="#targetId" (explicit form)
 *   label="Copy code"                            aria-label / title (default "Copy")
 *   position="top-left|top-right|bottom-left|bottom-right"  default "top-right"
 *   copy-feedback="Copied ✓"                     feedback text shown on the button (default "Copied ✓")
 *   copy-duration="1500"                         ms before the button reverts (default 2000)
 */
export function copyButton(element, options = {}) {
  // Idempotency — never double-wrap an element that already has its button.
  if (element.closest('.x-copybutton-wrapper')) return () => {};

  const attrValue = (element.getAttribute('x-copybutton') || '').trim();

  const config = {
    target: options.target || element.getAttribute('copy-target') || (attrValue || null),
    label: options.label || element.getAttribute('label') || 'Copy',
    position: options.position || element.getAttribute('position') || 'top-right',
    feedback: options.feedback || element.getAttribute('copy-feedback') || 'Copied ✓',
    duration: parseInt(options.duration || element.getAttribute('copy-duration') || '2000', 10),
    ...options
  };

  const VALID_POSITIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
  const position = VALID_POSITIONS.includes(config.position) ? config.position : 'top-right';

  const getTextToCopy = () => {
    if (config.target) {
      const targetEl = document.querySelector(config.target);
      if (targetEl) return targetEl.value ?? targetEl.textContent.trim();
    }
    // element.value is undefined on plain (non-form) elements, so this
    // correctly falls through to textContent for <pre>/<div>/<code>/etc.
    return element.value ?? element.textContent.trim();
  };

  // Wrap the host so the button can be absolutely positioned inside a
  // relative container. This is required, not optional -- e.g. <textarea>'s
  // content model can't hold a child <button> at all (it would just become
  // part of the textarea's text value), so a sibling-in-a-wrapper is the
  // only structure that works for every element this behavior targets.
  // Mirrors semantics/pre.js's own .x-pre-wrapper pattern.
  const wrapper = document.createElement('div');
  wrapper.className = 'x-copybutton-wrapper';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  const IDLE_LABEL = '📋';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `x-copybutton__btn x-copybutton__btn--${position}`;
  button.textContent = IDLE_LABEL;
  button.setAttribute('aria-label', config.label);
  button.title = config.label;

  let timeout = null;
  const onClick = async (e) => {
    e.preventDefault();
    const text = getTextToCopy();
    const ok = await writeToClipboard(text);

    if (ok) {
      button.textContent = config.feedback;
      button.classList.add('x-copybutton__btn--copied');
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        button.textContent = IDLE_LABEL;
        button.classList.remove('x-copybutton__btn--copied');
      }, config.duration);

      element.dispatchEvent(new CustomEvent('wb:copy:success', {
        bubbles: true,
        detail: { text }
      }));
    } else {
      element.dispatchEvent(new CustomEvent('wb:copy:error', {
        bubbles: true,
        detail: { text }
      }));
    }
  };

  button.addEventListener('click', onClick);
  wrapper.appendChild(button);

  return () => {
    clearTimeout(timeout);
    button.removeEventListener('click', onClick);
    button.remove();
    if (wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default copy;
