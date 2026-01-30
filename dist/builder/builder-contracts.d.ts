/**
 * Validate a precondition - throws on failure
 * @param {boolean} condition - Must be truthy
 * @param {string} message - Error message
 * @param {object} context - Debug context (fn name, params, etc.)
 */
declare function require(condition: boolean, message: string, context?: object): void;
/**
 * Validate a postcondition - throws on failure
 * @param {boolean} condition - Must be truthy
 * @param {string} message - Error message
 * @param {object} context - Debug context
 */
declare function ensure(condition: boolean, message: string, context?: object): void;
/**
 * Warn about a condition without throwing
 * @param {boolean} condition - Should be truthy
 * @param {string} message - Warning message
 * @param {object} context - Debug context
 */
declare function warn(condition: boolean, message: string, context?: object): void;
/**
 * Assert an invariant - these should ALWAYS be true
 * @param {boolean} condition - Must be truthy
 * @param {string} message - Error message
 * @param {object} context - Debug context
 */
declare function invariant(condition: boolean, message: string, context?: object): void;
/**
 * All invariants that must be true at all times
 * Returns { valid: boolean, violations: string[] }
 */
declare function checkAllInvariants(): {
    valid: boolean;
    violations: string[];
};
/**
 * Assert all invariants - call after state mutations
 * @param {string} afterOperation - Name of operation that just completed
 */
declare function assertInvariants(afterOperation?: string): void;
/**
 * Wrap a function with pre/post condition checks
 * @param {object} contracts - { pre: [], post: [], name: string }
 * @param {function} fn - Function to wrap
 * @returns {function} Wrapped function
 */
declare function withContract(contracts: object, fn: Function): Function;
/**
 * Run a full diagnostic check and return report
 */
declare function diagnose(): {
    timestamp: string;
    contractsEnabled: boolean;
    strictMode: boolean;
    invariants: {
        valid: boolean;
        violations: string[];
    };
    state: {
        hasBuilderState: boolean;
        componentCount: any;
        selectedComponent: any;
        currentPageId: any;
        pageCount: any;
    };
    windowBindings: {
        components: boolean;
        selectedComponent: boolean;
        pages: boolean;
    };
};
/**
 * Validate the entire builder state
 * @returns {boolean} True if valid
 */
declare function validateState(): boolean;
declare namespace ContractConfig {
    let enabled: boolean;
    let strict: boolean;
    let verbose: boolean;
    let checkInvariantsOnMutation: boolean;
}
declare namespace is {
    export function string(v: any): v is string;
    export function nonEmptyString(v: any): boolean;
    export function number(v: any): boolean;
    export function boolean(v: any): v is boolean;
    export function _function(v: any): boolean;
    export { _function as function };
    export function object(v: any): boolean;
    export function array(v: any): v is any[];
    export function element(v: any): v is HTMLElement;
    export function _null(v: any): boolean;
    export { _null as null };
    export function undefined(v: any): boolean;
    export function defined(v: any): boolean;
    export function component(v: any): boolean;
    export function componentId(v: any): boolean;
    export function template(v: any): boolean;
    export function page(v: any): boolean;
}
declare namespace BuilderContracts {
    export namespace component_1 {
        function requireValidId(id: any): void;
        function requireExists(id: any): any;
        function requireValidComponent(comp: any): void;
        function ensureInArray(id: any): void;
        function ensureNotInArray(id: any): void;
        function ensureDataSet(id: any, key: any, expectedValue: any): void;
    }
    export { component_1 as component };
    export namespace dom {
        function requireElement(el: any, name?: string): void;
        function requireElementById(id: any): HTMLElement;
        function ensureAttributeSet(el: any, attr: any, value: any): void;
    }
    export namespace template_1 {
        export function requireValid(template: any): void;
        export function requireExists_1(templateId: any): any;
        export { requireExists_1 as requireExists };
    }
    export { template_1 as template };
    export namespace page_1 {
        export function requireValidId_1(id: any): void;
        export { requireValidId_1 as requireValidId };
        export function requireExists_2(id: any): any;
        export { requireExists_2 as requireExists };
        export function ensureIsCurrent(id: any): void;
    }
    export { page_1 as page };
    export namespace state {
        function requireBuilderState(): void;
        function requireComponentsArray(): void;
    }
}
//# sourceMappingURL=builder-contracts.d.ts.map