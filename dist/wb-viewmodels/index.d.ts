/**
 * WB Behaviors Registry - Lazy Loading
 * =====================================
 * Behaviors are loaded on-demand when first used.
 * Each behavior group is loaded only once, then cached.
 *
 * @version 2.1.1 (2025-12-21) - Fixed semantic module paths
 */
/**
 * Behavior → Module mapping
 * Maps behavior names to their module paths
 */
declare const behaviorModules: any;
/**
 * Get a behavior function (lazy loads if needed)
 * @param {string} name - Behavior name
 * @returns {Promise<Function>} The behavior function
 */
export declare function getBehavior(name: any): Promise<any>;
/**
 * Check if a behavior exists
 * @param {string} name - Behavior name
 * @returns {boolean}
 */
export declare function hasBehavior(name: any): boolean;
/**
 * Get list of all available behaviors
 * @returns {string[]}
 */
export declare function listBehaviors(): string[];
/**
 * Preload specific behaviors (for critical path)
 * @param {string[]} names - Array of behavior names to preload
 */
export declare function preloadBehaviors(names: any): Promise<void>;
/**
 * Get cache stats
 * @returns {Object} Cache statistics
 */
export declare function getCacheStats(): {
    loaded: number;
    loading: number;
    modules: any[];
};
export { behaviorModules };
export declare const behaviors: {};
export default behaviors;
//# sourceMappingURL=index.d.ts.map