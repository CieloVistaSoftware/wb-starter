/**
 * Initialize theme panel
 */
export function initThemePanel(): void;
/**
 * Toggle theme panel visibility
 */
export function toggleThemePanel(): void;
/**
 * Get current theme settings
 */
export function getThemeSettings(): {
    theme: string;
    mode: string;
};
declare namespace _default {
    export { initThemePanel as init };
    export { toggleThemePanel as toggle };
    export { getThemeSettings as getSettings };
}
export default _default;
//# sourceMappingURL=builder-theme-panel.d.ts.map