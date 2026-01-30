/**
 * Builder Panels Module
 * Handles sidebar, right panel, and tab switching
 *
 * @module builder-panels
 */
/**
 * Toggle left sidebar visibility
 */
export function toggleSidebar(): void;
/**
 * Toggle right panel visibility
 */
export function togglePanel(): void;
/**
 * Switch between Tree+Props (combined) and Decorate tabs in Right Panel
 * CRITICAL: Tree tab is DEFAULT. NEVER auto-switch tabs. User controls tabs.
 * @param {string} tab - 'tree', 'props', or 'decorate'
 */
export function switchPanelTab(tab: string): void;
/**
 * Toggle category section collapse
 * @param {string} categoryId - Category identifier
 */
export function toggleCategory(categoryId: string): void;
/**
 * Restore collapsed state on load
 */
export function restoreCollapsedCategories(): void;
/**
 * Restore properties panel state on load
 */
export function restorePanelTab(): void;
/**
 * Setup keyboard shortcuts for panels
 */
export function setupPanelKeyboardShortcuts(): void;
//# sourceMappingURL=builder-panels.d.ts.map