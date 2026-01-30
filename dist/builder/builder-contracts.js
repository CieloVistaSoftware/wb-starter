"use strict";
/**
 * Builder Contracts - Design by Contract Utilities
 *
 * Provides validation, invariants, and contract enforcement for the builder.
 * All builder modules should import and use these utilities.
 *
 * PHILOSOPHY:
 * - Fail fast: Bugs surface at the source, not downstream
 * - Single source of truth: BuilderState is authoritative
 * - Every entry point validates inputs and outputs
 * - Invariants are checked after state mutations
 */
// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const ContractConfig = {
    // Set to false in production for performance
    enabled: true,
    // Throw errors (true) or just log warnings (false)
    strict: true,
    // Log all contract checks (verbose debugging)
    verbose: false,
    // Check invariants after every state mutation
    checkInvariantsOnMutation: true
};
// ═══════════════════════════════════════════════════════════════════════════
// CORE VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Validate a precondition - throws on failure
 * @param {boolean} condition - Must be truthy
 * @param {string} message - Error message
 * @param {object} context - Debug context (fn name, params, etc.)
 */
function require(condition, message, context = {}) {
    if (!ContractConfig.enabled)
        return;
    if (ContractConfig.verbose) {
        console.log('📋 [Contract] Checking:', message, context);
    }
    if (!condition) {
        const error = new Error(`[Contract FAILED] ${message}`);
        console.error('❌ PRECONDITION FAILED:', message, context);
        console.trace();
        if (ContractConfig.strict) {
            throw error;
        }
    }
}
/**
 * Validate a postcondition - throws on failure
 * @param {boolean} condition - Must be truthy
 * @param {string} message - Error message
 * @param {object} context - Debug context
 */
function ensure(condition, message, context = {}) {
    if (!ContractConfig.enabled)
        return;
    if (!condition) {
        const error = new Error(`[Contract FAILED] ${message}`);
        console.error('❌ POSTCONDITION FAILED:', message, context);
        console.trace();
        if (ContractConfig.strict) {
            throw error;
        }
    }
}
/**
 * Warn about a condition without throwing
 * @param {boolean} condition - Should be truthy
 * @param {string} message - Warning message
 * @param {object} context - Debug context
 */
function warn(condition, message, context = {}) {
    if (!ContractConfig.enabled)
        return;
    if (!condition) {
        console.warn('⚠️ [Contract]', message, context);
    }
}
/**
 * Assert an invariant - these should ALWAYS be true
 * @param {boolean} condition - Must be truthy
 * @param {string} message - Error message
 * @param {object} context - Debug context
 */
function invariant(condition, message, context = {}) {
    if (!ContractConfig.enabled)
        return;
    if (!condition) {
        const error = new Error(`[INVARIANT VIOLATED] ${message}`);
        console.error('🚨 INVARIANT VIOLATED:', message, context);
        console.trace();
        // Invariant violations are always fatal
        throw error;
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// TYPE CHECKING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
const is = {
    string: (v) => typeof v === 'string',
    nonEmptyString: (v) => typeof v === 'string' && v.length > 0,
    number: (v) => typeof v === 'number' && !isNaN(v),
    boolean: (v) => typeof v === 'boolean',
    function: (v) => typeof v === 'function',
    object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
    array: (v) => Array.isArray(v),
    element: (v) => v instanceof HTMLElement,
    null: (v) => v === null,
    undefined: (v) => v === undefined,
    defined: (v) => v !== undefined && v !== null,
    // Builder-specific
    component: (v) => is.object(v) && is.nonEmptyString(v.id),
    componentId: (v) => is.nonEmptyString(v),
    template: (v) => is.object(v) && is.nonEmptyString(v.name),
    page: (v) => is.object(v) && is.nonEmptyString(v.id) && is.nonEmptyString(v.name)
};
// ═══════════════════════════════════════════════════════════════════════════
// BUILDER INVARIANTS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * All invariants that must be true at all times
 * Returns { valid: boolean, violations: string[] }
 */
function checkAllInvariants() {
    const violations = [];
    // Only check if BuilderState exists
    if (typeof BuilderState === 'undefined') {
        return { valid: true, violations: [] };
    }
    // Components array integrity
    if (!Array.isArray(BuilderState._components)) {
        violations.push('BuilderState._components is not an array');
    }
    else {
        // No null/undefined components
        BuilderState._components.forEach((c, i) => {
            if (!c) {
                violations.push(`Component at index ${i} is null/undefined`);
            }
            else if (!c.id) {
                violations.push(`Component at index ${i} has no id`);
            }
        });
        // No duplicate IDs
        const ids = BuilderState._components.filter(c => c).map(c => c.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
            violations.push(`Duplicate component IDs: ${dupes.join(', ')}`);
        }
    }
    // Selected component must exist in components array
    if (BuilderState._selectedComponent) {
        const exists = BuilderState._components.some(c => c && c.id === BuilderState._selectedComponent.id);
        if (!exists) {
            violations.push(`Selected component ${BuilderState._selectedComponent.id} not in components array`);
        }
    }
    // Pages integrity
    if (!Array.isArray(BuilderState._pages)) {
        violations.push('BuilderState._pages is not an array');
    }
    else if (BuilderState._pages.length === 0) {
        violations.push('BuilderState._pages is empty (must have at least one page)');
    }
    // Current page must exist
    if (BuilderState._currentPageId) {
        const pageExists = BuilderState._pages.some(p => p.id === BuilderState._currentPageId);
        if (!pageExists) {
            violations.push(`Current page ${BuilderState._currentPageId} not found in pages`);
        }
    }
    return {
        valid: violations.length === 0,
        violations
    };
}
/**
 * Assert all invariants - call after state mutations
 * @param {string} afterOperation - Name of operation that just completed
 */
function assertInvariants(afterOperation = 'unknown') {
    if (!ContractConfig.enabled || !ContractConfig.checkInvariantsOnMutation)
        return;
    const result = checkAllInvariants();
    if (!result.valid) {
        const context = {
            afterOperation,
            violations: result.violations,
            componentCount: BuilderState?._components?.length,
            currentPageId: BuilderState?._currentPageId
        };
        invariant(false, `Invariants violated after ${afterOperation}: ${result.violations.join('; ')}`, context);
    }
    if (ContractConfig.verbose) {
        console.log('✅ [Contract] Invariants OK after:', afterOperation);
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT DECORATORS (for wrapping functions)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Wrap a function with pre/post condition checks
 * @param {object} contracts - { pre: [], post: [], name: string }
 * @param {function} fn - Function to wrap
 * @returns {function} Wrapped function
 */
function withContract(contracts, fn) {
    const { pre = [], post = [], name = fn.name || 'anonymous' } = contracts;
    return function (...args) {
        const ctx = { fn: name, args };
        // Check preconditions
        pre.forEach(({ check, message }) => {
            require(check(...args), message, ctx);
        });
        // Execute
        const result = fn.apply(this, args);
        // Check postconditions
        post.forEach(({ check, message }) => {
            ensure(check(result, ...args), message, { ...ctx, result });
        });
        // Check invariants
        assertInvariants(name);
        return result;
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// BUILDER-SPECIFIC CONTRACTS
// ═══════════════════════════════════════════════════════════════════════════
const BuilderContracts = {
    // Component operations
    component: {
        requireValidId: (id) => require(is.componentId(id), 'Valid component ID required', { id }),
        requireExists: (id) => {
            const comp = BuilderState?.findComponent?.(id);
            require(comp, `Component must exist: ${id}`, { id });
            return comp;
        },
        requireValidComponent: (comp) => {
            require(is.component(comp), 'Valid component object required', { comp });
        },
        ensureInArray: (id) => {
            const exists = BuilderState?._components?.some(c => c.id === id);
            ensure(exists, `Component should be in array: ${id}`, { id });
        },
        ensureNotInArray: (id) => {
            const exists = BuilderState?._components?.some(c => c.id === id);
            ensure(!exists, `Component should not be in array: ${id}`, { id });
        },
        ensureDataSet: (id, key, expectedValue) => {
            const comp = BuilderState?.findComponent?.(id);
            const actualValue = comp?.data?.[key];
            ensure(actualValue === expectedValue, `Component data.${key} should be ${expectedValue}, got ${actualValue}`, { id, key, expectedValue, actualValue });
        }
    },
    // DOM operations
    dom: {
        requireElement: (el, name = 'element') => {
            require(is.element(el), `${name} must be HTMLElement`, { el });
        },
        requireElementById: (id) => {
            const el = document.getElementById(id);
            require(el, `Element #${id} must exist in DOM`, { id });
            return el;
        },
        ensureAttributeSet: (el, attr, value) => {
            const actual = el?.getAttribute?.(attr);
            ensure(actual === value, `Attribute ${attr} should be "${value}", got "${actual}"`, { attr, expected: value, actual });
        }
    },
    // Template operations
    template: {
        requireValid: (template) => {
            require(is.template(template), 'Valid template required', { template });
        },
        requireExists: (templateId) => {
            const template = window.componentTemplates?.[templateId];
            require(template, `Template must exist: ${templateId}`, { templateId });
            return template;
        }
    },
    // Page operations
    page: {
        requireValidId: (id) => require(is.nonEmptyString(id), 'Valid page ID required', { id }),
        requireExists: (id) => {
            const page = BuilderState?._pages?.find(p => p.id === id);
            require(page, `Page must exist: ${id}`, { id });
            return page;
        },
        ensureIsCurrent: (id) => {
            ensure(BuilderState?._currentPageId === id, `Page should be current: ${id}`, { id, actual: BuilderState?._currentPageId });
        }
    },
    // State operations
    state: {
        requireBuilderState: () => {
            require(typeof BuilderState !== 'undefined', 'BuilderState must be initialized');
        },
        requireComponentsArray: () => {
            require(Array.isArray(BuilderState?._components), 'Components must be array');
        }
    }
};
// ═══════════════════════════════════════════════════════════════════════════
// DIAGNOSTIC UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Run a full diagnostic check and return report
 */
function diagnose() {
    const report = {
        timestamp: new Date().toISOString(),
        contractsEnabled: ContractConfig.enabled,
        strictMode: ContractConfig.strict,
        invariants: checkAllInvariants(),
        state: {
            hasBuilderState: typeof BuilderState !== 'undefined',
            componentCount: BuilderState?._components?.length ?? 'N/A',
            selectedComponent: BuilderState?._selectedComponent?.id ?? null,
            currentPageId: BuilderState?._currentPageId ?? 'N/A',
            pageCount: BuilderState?._pages?.length ?? 'N/A'
        },
        windowBindings: {
            components: window.components === BuilderState?._components,
            selectedComponent: window.selectedComponent === BuilderState?._selectedComponent,
            pages: window.pages === BuilderState?._pages
        }
    };
    console.log('🔍 [Builder Diagnostics]', report);
    return report;
}
/**
 * Validate the entire builder state
 * @returns {boolean} True if valid
 */
function validateState() {
    try {
        BuilderContracts.state.requireBuilderState();
        BuilderContracts.state.requireComponentsArray();
        assertInvariants('validateState');
        return true;
    }
    catch (e) {
        console.error('State validation failed:', e);
        return false;
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
// Make available globally for all builder modules
window.ContractConfig = ContractConfig;
window.require = require;
window.ensure = ensure;
window.warn = warn;
window.invariant = invariant;
window.is = is;
window.checkAllInvariants = checkAllInvariants;
window.assertInvariants = assertInvariants;
window.withContract = withContract;
window.BuilderContracts = BuilderContracts;
window.diagnose = diagnose;
window.validateState = validateState;
console.log('[BuilderContracts] ✅ Design by Contract utilities loaded');
//# sourceMappingURL=builder-contracts.js.map