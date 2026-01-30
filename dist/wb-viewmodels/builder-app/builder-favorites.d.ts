/**
 * Get current favorites list
 * @returns {string[]} Array of behavior names
 */
export function getFavorites(): string[];
/**
 * Render favorites section in sidebar
 * @param {Object} componentsList - The C.All components list
 */
export function renderFavorites(componentsList?: any): void;
/**
 * Toggle a behavior as favorite
 * @param {string} behavior - The behavior name to toggle
 */
export function toggleFavorite(behavior: string): void;
/**
 * Clear all favorites
 */
export function clearFavorites(): void;
/**
 * Check if a behavior is favorited
 * @param {string} behavior - The behavior name
 * @returns {boolean}
 */
export function isFavorite(behavior: string): boolean;
//# sourceMappingURL=builder-favorites.d.ts.map