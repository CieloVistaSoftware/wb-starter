/**
 * Form Enhancement Behaviors
 * -----------------------------------------------------------------------------
 * Enhances standard HTML form elements with better UX and validation.
 * Includes inputs, password toggles, search, and form validation.
 *
 * Helper Attribute: [x-enhancements]
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <form x-form data-ajax>...</form>
 *   <input x-password>
 */
/**
 * Form - Enhanced form
 * Helper Attribute: [x-form]
 */
export declare function form(element: any, options?: any): () => any;
/**
 * Fieldset - Form field group
 */
export declare function fieldset(element: any, options?: any): () => any;
/**
 * Label - Form label
 */
export declare function label(element: any, options?: any): () => any;
/**
 * Help - Form help text
 */
export declare function help(element: any, options?: any): () => any;
/**
 * Error - Form error message
 */
export declare function error(element: any, options?: any): () => any;
/**
 * InputGroup - Grouped inputs
 */
export declare function inputgroup(element: any, options?: any): () => any;
/**
 * FormRow - Form row layout
 */
export declare function formrow(element: any, options?: any): () => any;
/**
 * Stepper - Number stepper
 */
export declare function stepper(element: any, options?: any): () => void;
/**
 * Search - Search input
 */
export declare function search(element: any, options?: any): () => void;
/**
 * Password - Password input with toggle at end of input, same height
 * Helper Attribute: [x-password]
 */
export declare function password(element: any, options?: any): () => void;
/**
 * Masked - Masked input for formatted data entry
 * Uses '9' as placeholder for digits, other chars are literals
 * Example: data-mask="(999) 999-9999" for phone numbers
 */
export declare function masked(element: any, options?: any): () => any;
/**
 * Counter - Character counter
 */
export declare function counter(element: any, options?: any): () => void;
/**
 * Floating Label - Floating label effect
 */
export declare function floatinglabel(element: any, options?: any): () => void;
/**
 * OTP - One Time Password Input
 */
export declare function otp(element: any, options?: any): () => string;
/**
 * Color Picker - Enhanced color input
 */
export declare function colorpicker(element: any, options?: any): () => void;
/**
 * Tags - Tag input
 * Helper Attribute: [x-tags]
 */
export declare function tags(element: any, options?: any): () => string;
/**
 * Autocomplete - Input with suggestions
 */
export declare function autocomplete(element: any, options?: any): () => void;
/**
 * File - Enhanced file input
 * Helper Attribute: [x-file]
 */
export declare function file(element: any, options?: any): () => void;
declare const _default: {
    form: typeof form;
    fieldset: typeof fieldset;
    label: typeof label;
    help: typeof help;
    error: typeof error;
    inputgroup: typeof inputgroup;
    formrow: typeof formrow;
    stepper: typeof stepper;
    search: typeof search;
    password: typeof password;
    masked: typeof masked;
    counter: typeof counter;
    floatinglabel: typeof floatinglabel;
    otp: typeof otp;
    colorpicker: typeof colorpicker;
    tags: typeof tags;
    autocomplete: typeof autocomplete;
    file: typeof file;
};
export default _default;
//# sourceMappingURL=enhancements.d.ts.map