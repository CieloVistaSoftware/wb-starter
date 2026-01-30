/**
 * Builder HTML Editor
 * Inline HTML editing for components with syntax highlighting
 */
/**
 * Escape HTML entities for display
 */
declare function escapeHtml(text: any): string;
/**
 * Basic HTML formatter for readability
 */
declare function formatHtml(html: any): any;
/**
 * Toggle HTML view for a component
 * Opens inline editor or falls back to popup
 */
declare function toggleComponentHtml(componentId: any, event: any): void;
/**
 * Initialize the HTML editor with syntax highlighting
 */
declare function initHtmlEditor(componentId: any, formatted: any, textareaHeight: any, displayLines: any, contentEl: any, htmlView: any, htmlBtn: any): void;
//# sourceMappingURL=builder-html-editor.d.ts.map