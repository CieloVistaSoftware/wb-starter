/**
 * Feedback Behaviors
 * -----------------------------------------------------------------------------
 * User feedback components including toasts, badges, alerts, spinners,
 * and progress indicators.
 *
 * Custom Tag: <wb-feedback>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <button x-toast data-message="Saved!">Save</button>
 *   <wb-badge  data-variant="success">New</span>
 * -----------------------------------------------------------------------------
 * All behaviors generate content from data attributes
 */
export declare function createToast(message: any, type?: string, duration?: number): HTMLDivElement;
/**
 * Toast Behavior
 * Custom Tag: <button-tooltip> (Shared)
 * Attribute: [toast-message]
 */
export declare function toast(element: any, options?: any): () => any;
/**
 * Badge - Status badges
 * Attribute: [badge]
 */
export declare function badge(element: any, options?: any): () => void;
/**
 * Progress - Animated progress bars (0.6rem height)
 * Custom Tag: <progress>
 */
export declare function progress(element: any, options?: any): () => any;
/**
 * Spinner - Loading spinner with staggered start support and speed control
 */
export declare function spinner(element: any, options?: any): () => void;
/**
 * Avatar - User avatars
 */
export declare function avatar(element: any, options?: any): () => any;
/**
 * Chip - Removable chips/tags
 */
export declare function chip(element: any, options?: any): () => any;
/**
 * Alert - Alert messages
 */
export declare function alert(element: any, options?: any): () => any;
/**
 * Skeleton - Glassmorphism loading skeletons with shimmer animation
 */
export declare function skeleton(element: any, options?: any): () => any;
/**
 * Divider - Content dividers
 */
export declare function divider(element: any, options?: any): () => any;
/**
 * Breadcrumb - Navigation breadcrumbs from data-items
 */
export declare function breadcrumb(element: any, options?: any): () => any;
/**
 * Notify - Toast notification that cycles through types on each click
 */
export declare function notify(element: any, options?: any): () => any;
/**
 * Pill - Badge with rounded corners (shortcut)
 */
export declare function pill(element: any, options?: any): () => void;
declare const _default: {
    toast: typeof toast;
    createToast: typeof createToast;
    badge: typeof badge;
    progress: typeof progress;
    spinner: typeof spinner;
    avatar: typeof avatar;
    chip: typeof chip;
    alert: typeof alert;
    skeleton: typeof skeleton;
    divider: typeof divider;
    breadcrumb: typeof breadcrumb;
    notify: typeof notify;
    pill: typeof pill;
};
export default _default;
//# sourceMappingURL=feedback.d.ts.map