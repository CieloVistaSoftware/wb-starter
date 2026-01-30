/**
 * Markdown to HTML Behavior
 * -----------------------------------------------------------------------------
 * Converts markdown content to HTML using marked.js.
 *
 * Custom Tag: <wb-mdhtml>
 *
 * Usage:
 *   <wb-mdhtml>
 *     # Hello World
 *     This is **bold** and *italic*
 *   </wb-mdhtml>
 *
 * Or with external file:
 *   <wb-mdhtml data-src="./docs/readme.md"></wb-mdhtml>
 * Or with absolute path:
 *   <wb-mdhtml data-src="/docs/architecture.md"></wb-mdhtml>
 * -----------------------------------------------------------------------------
 */
export declare function mdhtml(element: any, options?: any): Promise<() => void>;
export default mdhtml;
//# sourceMappingURL=mdhtml.d.ts.map