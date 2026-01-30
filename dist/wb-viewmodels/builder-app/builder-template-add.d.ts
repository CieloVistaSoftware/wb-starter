/**
 * Add HTML template content to the canvas
 * The actual element (section, nav, etc.) BECOMES the .dropped wrapper.
 * We do NOT wrap elements in a div.
 *
 * @param {string} html - HTML string to add
 * @param {Object} templateMeta - Template metadata { name, icon }
 */
export function addTemplateHTML(html: string, templateMeta?: any): void;
/**
 * Add raw HTML string to canvas (simpler version)
 * @param {string} html - HTML string
 */
export function addHTML(html: string): void;
/**
 * Add a template to the canvas (recursive component tree)
 * @param {Object} template - Template object with components array
 */
export function addTemplate(template: any): void;
/**
 * Preview a template in a modal or new window
 * @param {Object} template - Template object
 */
export function previewTemplate(template: any): void;
/**
 * Setup template message listener
 */
export function setupTemplateMessageListener(): void;
//# sourceMappingURL=builder-template-add.d.ts.map