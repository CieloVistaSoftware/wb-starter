export default WB;
export namespace WB {
    export let version: string;
    export const behaviors: any;
    /**
     * Inject a behavior into an element (async - loads behavior on demand)
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} behaviorName - Name of behavior to inject
     * @param {Object} options - Behavior options (override data attributes)
     * @returns {Promise<Function|null>} Cleanup function or null if failed
     */
    export function inject(element: HTMLElement | string, behaviorName: string, options?: any): Promise<Function | null>;
    /**
     * Inject a behavior when element enters viewport
     * @param {HTMLElement} element
     * @param {string} behaviorName
     */
    export function lazyInject(element: HTMLElement, behaviorName: string): void;
    /**
     * Remove a specific behavior from an element
     * @param {HTMLElement} element - Target element
     * @param {string} behaviorName - Behavior to remove (or all if not specified)
     */
    export function remove(element: HTMLElement, behaviorName?: string): void;
    /**
     * Scan DOM for elements with data-wb and inject behaviors
     * Uses batching for better performance
     * @param {HTMLElement} root - Root element to scan (default: document.body)
     */
    export function scan(root?: HTMLElement): Promise<void>;
    /**
     * Watch for new elements with data-wb (MutationObserver)
     * @param {HTMLElement} root - Root element to observe (default: document.body)
     * @returns {MutationObserver} The observer instance
     */
    export function observe(root?: HTMLElement): MutationObserver;
    /**
     * Stop observing DOM changes
     */
    export function disconnect(): void;
    /**
     * Get list of available behaviors
     * @returns {string[]} Array of behavior names
     */
    export function list(): string[];
    /**
     * Check if a behavior exists
     * @param {string} name - Behavior name
     * @returns {boolean}
     */
    export function has(name: string): boolean;
    /**
     * Preload specific behaviors (for critical path optimization)
     * @param {string[]} names - Behavior names to preload
     */
    export function preload(names: string[]): Promise<void>;
    /**
     * Get loading statistics
     * @returns {Object} Cache stats
     */
    export function stats(): any;
    /**
     * Initialize WB
     * @param {Object} options - Configuration options
     */
    export function init(options?: any): Promise<{
        version: string;
        readonly behaviors: any;
        /**
         * Inject a behavior into an element (async - loads behavior on demand)
         * @param {HTMLElement|string} element - Element or selector
         * @param {string} behaviorName - Name of behavior to inject
         * @param {Object} options - Behavior options (override data attributes)
         * @returns {Promise<Function|null>} Cleanup function or null if failed
         */
        inject(element: HTMLElement | string, behaviorName: string, options?: any): Promise<Function | null>;
        /**
         * Inject a behavior when element enters viewport
         * @param {HTMLElement} element
         * @param {string} behaviorName
         */
        lazyInject(element: HTMLElement, behaviorName: string): void;
        /**
         * Remove a specific behavior from an element
         * @param {HTMLElement} element - Target element
         * @param {string} behaviorName - Behavior to remove (or all if not specified)
         */
        remove(element: HTMLElement, behaviorName?: string): void;
        /**
         * Scan DOM for elements with data-wb and inject behaviors
         * Uses batching for better performance
         * @param {HTMLElement} root - Root element to scan (default: document.body)
         */
        scan(root?: HTMLElement): Promise<void>;
        /**
         * Watch for new elements with data-wb (MutationObserver)
         * @param {HTMLElement} root - Root element to observe (default: document.body)
         * @returns {MutationObserver} The observer instance
         */
        observe(root?: HTMLElement): MutationObserver;
        /**
         * Stop observing DOM changes
         */
        disconnect(): void;
        /**
         * Get list of available behaviors
         * @returns {string[]} Array of behavior names
         */
        list(): string[];
        /**
         * Check if a behavior exists
         * @param {string} name - Behavior name
         * @returns {boolean}
         */
        has(name: string): boolean;
        /**
         * Preload specific behaviors (for critical path optimization)
         * @param {string[]} names - Behavior names to preload
         */
        preload(names: string[]): Promise<void>;
        /**
         * Get loading statistics
         * @returns {Object} Cache stats
         */
        stats(): any;
        init(options?: any): Promise</*elided*/ any>;
        /**
         * Render JSON definition to DOM elements
         * @param {Object|Array} data - Component definition(s)
         * @param {HTMLElement} container - Target container (appends to it)
         * @returns {HTMLElement|HTMLElement[]} The created element(s)
         */
        render(data: any | any[], container?: HTMLElement): HTMLElement | HTMLElement[];
        Events: {
            log(level: string, source: string, message: string | Error, data?: any): void;
            error(source: any, message: any, data?: {}): void;
            warn(source: any, message: any, data?: {}): void;
            info(source: any, message: any, data?: {}): void;
            success(source: any, message: any, data?: {}): void;
            setupGlobalHandlers(): void;
            getErrors(): any[];
            clearErrors(): void;
            getErrorCount(): number;
        };
        Theme: {
            current: string;
            set(theme: any): void;
            get(): string;
            toggle(): void;
        };
        config: {
            get: typeof getConfig;
            set: typeof setConfig;
        };
    }>;
    /**
     * Render JSON definition to DOM elements
     * @param {Object|Array} data - Component definition(s)
     * @param {HTMLElement} container - Target container (appends to it)
     * @returns {HTMLElement|HTMLElement[]} The created element(s)
     */
    export function render(data: any | any[], container?: HTMLElement): HTMLElement | HTMLElement[];
    export { Events };
    export { Theme };
    export namespace config {
        export { getConfig as get };
        export { setConfig as set };
    }
}
import { getConfig } from './config.js';
import { setConfig } from './config.js';
import { Events } from './events.js';
import { Theme } from './theme.js';
//# sourceMappingURL=wb-lazy.d.ts.map