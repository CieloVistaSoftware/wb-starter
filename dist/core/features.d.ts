/**
 * Detect all features and return summary
 * @returns {{ features: object, css: object, environment: object }}
 */
export function detectAll(): {
    features: object;
    css: object;
    environment: object;
};
/**
 * Log feature detection results to console (for debugging)
 */
export function logFeatures(): void;
export namespace features {
    let resizeObserver: boolean;
    let intersectionObserver: boolean;
    let mutationObserver: boolean;
    let performanceObserver: boolean;
    let customElements: boolean;
    let shadowDOM: boolean;
    let templates: boolean;
    let slots: boolean;
    let localStorage: boolean;
    let sessionStorage: boolean;
    let indexedDB: boolean;
    let webp: boolean;
    let avif: boolean;
    let touch: boolean;
    let pointer: boolean;
    let hover: boolean;
    let serviceWorker: boolean;
    let fetch: boolean;
    let streams: boolean;
    let requestIdleCallback: boolean;
    let scheduler: boolean;
    let viewTransitions: boolean;
    let scrollTimeline: boolean;
    let popover: boolean;
    let dialog: boolean;
    let clipboard: boolean;
    let clipboardWrite: boolean;
    let webGL: boolean;
    let webGL2: boolean;
    let webWorker: boolean;
    let sharedWorker: boolean;
    let webSocket: boolean;
    let fileReader: boolean;
    let fileSystemAccess: boolean;
    let geolocation: boolean;
    let deviceOrientation: boolean;
    let fullscreen: any;
}
export namespace supports {
    /**
     * Check CSS property/value support
     * @param {string} property - CSS property
     * @param {string} value - CSS value
     * @returns {boolean}
     */
    function css(property: string, value: string): boolean;
    /**
     * Check @supports rule
     * @param {string} condition - Full @supports condition string
     * @returns {boolean}
     */
    function cssRule(condition: string): boolean;
}
export namespace cssFeatures {
    export let grid: boolean;
    export let subgrid: boolean;
    export let flexGap: boolean;
    export let containerQueries: boolean;
    export let hasSelector: boolean;
    export let layerRule: boolean;
    export let nestingSelector: boolean;
    export let colorMix: boolean;
    export let oklch: boolean;
    export let aspectRatio: boolean;
    export let scrollSnapStop: boolean;
    export let overscrollBehavior: boolean;
    export let textWrap: boolean;
    let viewTransitions_1: boolean;
    export { viewTransitions_1 as viewTransitions };
    export let anchorPositioning: boolean;
    export let startingStyle: boolean;
}
export namespace environment {
    let isMobile: boolean;
    let isIOS: boolean;
    let isAndroid: boolean;
    let isMac: boolean;
    let isWindows: boolean;
    let isSecureContext: boolean;
    let isStandalone: boolean;
    let isIframe: boolean;
    let prefersReducedMotion: boolean;
    let prefersDarkMode: boolean;
    let prefersHighContrast: boolean;
    const connectionType: any;
    const saveData: any;
}
declare namespace _default {
    export { features };
    export { supports };
    export { cssFeatures };
    export { environment };
    export { detectAll };
    export { logFeatures };
}
export default _default;
//# sourceMappingURL=features.d.ts.map