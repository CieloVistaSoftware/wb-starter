/**
 * Code Control Behavior
 * Custom Tag: <wb-codecontrol>
 * Dropdown to select from available highlight.js code themes - applies immediately.
 *
 * Usage:
 *   <wb-codecontrol ></div>
 *   <wb-codecontrol  data-size="xs"></div>
 *   <wb-codecontrol  data-show-label="false" data-size="sm"></div>
 */
declare const CODE_THEMES: ({
    id: string;
    name: string;
    category: string;
    description: string;
    path: string;
} | {
    id: string;
    name: string;
    category: string;
    description: string;
    path?: undefined;
})[];
declare const SIZES: any;
declare const HLJS_STYLES_PATH = "/node_modules/highlight.js/styles/";
export declare function codecontrol(element: any, options?: any): () => void;
export { CODE_THEMES, HLJS_STYLES_PATH, SIZES };
export default codecontrol;
//# sourceMappingURL=codecontrol.d.ts.map