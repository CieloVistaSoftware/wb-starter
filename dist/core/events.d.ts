export namespace Events {
    /**
     * Log an event with full error details
     * @param {string} level - 'error', 'warn', 'info', 'success'
     * @param {string} source - Source identifier (module name)
     * @param {string|Error} message - Log message or Error object
     * @param {Object} data - Additional data (stack, file, line, etc.)
     */
    function log(level: string, source: string, message: string | Error, data?: any): void;
    /**
     * Log an error with full details
     */
    function error(source: any, message: any, data?: {}): void;
    /**
     * Log a warning
     */
    function warn(source: any, message: any, data?: {}): void;
    /**
     * Log info
     */
    function info(source: any, message: any, data?: {}): void;
    /**
     * Show success toast
     */
    function success(source: any, message: any, data?: {}): void;
    /**
     * Setup global error handlers to catch all unhandled errors
     */
    function setupGlobalHandlers(): void;
    /**
     * Get all logged errors
     */
    function getErrors(): any[];
    /**
     * Clear all errors
     */
    function clearErrors(): void;
    /**
     * Get error count
     */
    function getErrorCount(): number;
}
export default Events;
//# sourceMappingURL=events.d.ts.map