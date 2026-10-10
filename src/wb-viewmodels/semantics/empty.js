import { readAttr } from '../../core/read-attr.js';
import { authorText } from '../../core/author-content.js';
/**
 * Empty State Behavior
 * Renders an empty state placeholder
 * Helper Attribute: [x-empty]
 */
export function empty(element, options = {}) {
  // Plain attributes are canonical (Law 11); data-* accepted for back-compat only.
  const config = {
    icon: options.icon || element.getAttribute('icon') || readAttr(element, 'icon') || '∅',
    // #417: the text between the tags is the message and wins over
    // `message`. It used to be overwritten unread. authorText() is captured
    // once, so a re-run does not read the icon and heading built below.
    message: options.message || authorText(element) || element.getAttribute('message') || readAttr(element, 'message') || 'No data',
    description: options.description || element.getAttribute('description') || readAttr(element, 'description') || '',
    ...options
  };

  element.classList.add('x-empty');
  
  element.innerHTML = `
    <div class="x-empty__icon">${config.icon}</div>
    <h3 class="x-empty__message">${config.message}</h3>
    ${config.description ? `<div class="x-empty__description">${config.description}</div>` : ''}
  `;

  // #779: the look (host, icon, message, description) is .x-empty and its
  // parts in ui-utils.css -- it used to be written onto each element.style.
}

export default empty;
