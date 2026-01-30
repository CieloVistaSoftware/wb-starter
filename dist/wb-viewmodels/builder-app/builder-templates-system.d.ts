/**
 * Add HTML template content to the canvas
 * Used by the HTML-based template browser
 *
 * IMPORTANT: The actual element (section, nav, etc.) BECOMES the .dropped wrapper.
 * We do NOT wrap elements in a div - the element itself gets the .dropped class.
 */
export function addTemplateHTML(html: any, templateMeta?: {}, options?: {}): void;
/**
 * Add raw HTML string to canvas (simpler version)
 */
export function addHTML(html: any, options?: {}): void;
/**
 * Add a template to the canvas (recursive component tree)
 */
export function addTemplate(template: any, options?: {}): void;
/**
 * Preview a template in a modal or new window
 */
export function previewTemplate(template: any, options?: {}): void;
/**
 * Setup message listener for template preview window
 */
export function setupTemplateMessageListener(): void;
//# sourceMappingURL=builder-templates-system.d.ts.map