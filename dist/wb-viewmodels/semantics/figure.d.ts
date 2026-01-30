/**
 * Figure - Enhanced <figure> element
 * Adds lightbox, lazy loading, caption animation, zoom
 *
 * Supports pure attribute-driven usage (no child tags needed):
 *   <figure data-img-src="photo.jpg" data-alt="Description" data-caption="Caption">
 *   </figure>
 *
 * Or traditional HTML with enhancements:
 *   <figure data-caption="Caption">
 *     <img src="photo.jpg" alt="Description">
 *   </figure>
 *
 * Helper Attribute: [x-behavior="figure"]
 */
export function figure(element: any, options?: {}): () => any;
declare namespace _default {
    export { figure };
}
export default _default;
//# sourceMappingURL=figure.d.ts.map