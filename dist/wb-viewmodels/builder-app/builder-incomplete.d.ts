declare namespace _default {
    export { analyzeComponent };
    export { analyzeCanvas };
    export { updateBadges };
    export { showTemplateChecklist };
    export { showIssuesPanel };
    export { showAllIssues };
}
export default _default;
/**
 * Analyze a component for incomplete/placeholder values
 */
export function analyzeComponent(wrapper: any): {
    id: any;
    behavior: any;
    issues: any[];
    warnings: any[];
    suggestions: any[];
    isComplete: boolean;
};
/**
 * Analyze all components on canvas
 */
export function analyzeCanvas(): any[];
/**
 * Update visual badges on components
 */
export function updateBadges(): void;
/**
 * Show post-template checklist
 */
export function showTemplateChecklist(templateName: any, componentIds: any): void;
/**
 * Show issues panel for a component
 */
export function showIssuesPanel(wrapper: any): void;
/**
 * Show all issues in a modal
 */
export function showAllIssues(): void;
/**
 * Update the footer status indicator
 */
export function updateFooterStatus(issueCount: any, warningCount: any): void;
/**
 * Check if a value is a placeholder
 */
export function isPlaceholder(value: any, fieldType?: string): {
    isPlaceholder: boolean;
    isEmpty: boolean;
    pattern?: undefined;
} | {
    isPlaceholder: boolean;
    isEmpty: boolean;
    pattern: any;
};
export namespace REQUIRED_FIELDS {
    let link: string[];
    let backtotop: any[];
    let card: string[];
    let cardimage: string[];
    let cardvideo: string[];
    let cardbutton: string[];
    let cardhero: string[];
    let cardprofile: string[];
    let cardpricing: string[];
    let cardstats: string[];
    let cardtestimonial: string[];
    let cardproduct: string[];
    let cardoverlay: string[];
    let image: string[];
    let video: string[];
    let audio: string[];
    let youtube: string[];
    let vimeo: string[];
    let embed: string[];
    let clipboard: string[];
    let share: string[];
    let print: any[];
    let fullscreen: any[];
    let dialog: string[];
    let tooltip: string[];
    let input: string[];
    let textarea: string[];
}
export namespace PLACEHOLDER_PATTERNS {
    let href: RegExp[];
    let src: RegExp[];
    let url: RegExp[];
    let email: RegExp[];
    let text: RegExp[];
}
//# sourceMappingURL=builder-incomplete.d.ts.map