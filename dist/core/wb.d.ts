export default WB;
export namespace WB {
    export let version: string;
    export { behaviors };
    export { pubsub };
    export { SchemaBuilder as schema };
    /**
     * Inject a behavior into an element
     * @param {HTMLElement|string} element - Element or selector
     * @param {string} behaviorName - Name of behavior to inject
     * @param {Object} options - Behavior options (override data attributes)
     * @returns {Promise<Function|null>} Cleanup function or null if failed
     */
    export function inject(element: HTMLElement | string, behaviorName: string, options?: any): Promise<Function | null>;
    /**
     * Remove a specific behavior from an element
     * @param {HTMLElement} element - Target element
     * @param {string} behaviorName - Behavior to remove (or all if not specified)
     */
    export function remove(element: HTMLElement, behaviorName?: string): void;
    /**
     * Process element through schema builder (v3.0)
     * Builds DOM structure from schema $view before applying behaviors
     * @param {HTMLElement} element - Element to process
     * @param {string} schemaName - Schema name (optional, auto-detected)
     */
    export function processSchema(element: HTMLElement, schemaName?: string): void;
    /**
     * Detect schema name from element
     * @private
     */
    export function _detectSchemaName(element: any): any;
    /**
     * Scan DOM for elements with data-wb and inject behaviors
     * @param {HTMLElement} root - Root element to scan (default: document.body)
     * @returns {Promise<void>}
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
     * Register a custom behavior
     * @param {string} name - Behavior name
     * @param {Function} fn - Behavior function
     */
    export function register(name: string, fn: Function): void;
    /**
     * Initialize WB
     * @param {Object} options - Configuration options
     */
    export function init(options?: any): Promise<{
        version: string;
        behaviors: {};
        pubsub: import("./pubsub.js").PubSub;
        schema: {
            init: typeof import("./mvvm/schema-builder.js").init;
            loadSchemas: typeof import("./mvvm/schema-builder.js").loadSchemas;
            registerSchema: typeof import("./mvvm/schema-builder.js").registerSchema;
            getSchema: typeof import("./mvvm/schema-builder.js").getSchema;
            getMethods: typeof import("./mvvm/schema-builder.js").getMethods;
            bindMethods: typeof import("./mvvm/schema-builder.js").bindMethods;
            processElement: typeof import("./mvvm/schema-builder.js").processElement;
            scan: typeof import("./mvvm/schema-builder.js").scan;
            startObserver: typeof import("./mvvm/schema-builder.js").startObserver;
            registry: Map<string, any>;
        };
        /**
         * Inject a behavior into an element
         * @param {HTMLElement|string} element - Element or selector
         * @param {string} behaviorName - Name of behavior to inject
         * @param {Object} options - Behavior options (override data attributes)
         * @returns {Promise<Function|null>} Cleanup function or null if failed
         */
        inject(element: HTMLElement | string, behaviorName: string, options?: any): Promise<Function | null>;
        /**
         * Remove a specific behavior from an element
         * @param {HTMLElement} element - Target element
         * @param {string} behaviorName - Behavior to remove (or all if not specified)
         */
        remove(element: HTMLElement, behaviorName?: string): void;
        /**
         * Process element through schema builder (v3.0)
         * Builds DOM structure from schema $view before applying behaviors
         * @param {HTMLElement} element - Element to process
         * @param {string} schemaName - Schema name (optional, auto-detected)
         */
        processSchema(element: HTMLElement, schemaName?: string): void;
        /**
         * Detect schema name from element
         * @private
         */
        _detectSchemaName(element: any): any;
        /**
         * Scan DOM for elements with data-wb and inject behaviors
         * @param {HTMLElement} root - Root element to scan (default: document.body)
         * @returns {Promise<void>}
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
         * Register a custom behavior
         * @param {string} name - Behavior name
         * @param {Function} fn - Behavior function
         */
        register(name: string, fn: Function): void;
        init(options?: any): Promise</*elided*/ any>;
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
    export { Events };
    export { Theme };
    export namespace config {
        export { getConfig as get };
        export { setConfig as set };
    }
}
import { behaviors } from '../wb-viewmodels/index.js';
import { pubsub } from './pubsub.js';
import SchemaBuilder from './mvvm/schema-builder.js';
import { getConfig } from './config.js';
import { setConfig } from './config.js';
import { Events } from './events.js';
import { Theme } from './theme.js';
//# sourceMappingURL=wb.d.ts.map