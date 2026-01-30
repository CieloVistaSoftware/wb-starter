/**
 * Show an error in the UI and log it
 */
export function logError(message: any, details?: {}): Promise<{
    id: number;
    timestamp: string;
    message: string;
    details: {};
    url: string;
    userAgent: string;
}>;
/**
 * Load errors from JSON file
 */
export function loadErrorLog(): Promise<any>;
/**
 * Get all logged errors
 */
export function getErrors(): any[];
/**
 * Clear all errors
 */
export function clearErrors(): Promise<void>;
/**
 * Setup global error catching
 */
export function setupGlobalErrorHandler(): void;
declare namespace _default {
    export { logError };
    export { loadErrorLog };
    export { getErrors };
    export { clearErrors };
    export { setupGlobalErrorHandler };
}
export default _default;
//# sourceMappingURL=error-logger.d.ts.map