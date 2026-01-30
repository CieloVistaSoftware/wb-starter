/**
 * Rating Behavior
 * ===============
 *
 * Interactive star rating component.
 *
 * ATTRIBUTES:
 * - data-max: Number of stars (default: 5)
 * - data-value: Initial value (default: 0)
 * - data-readonly: If "true", user cannot change value
 * - data-color: Color of filled stars (default: gold)
 *
 * EVENTS:
 * - wb:rating:change: Dispatched when value changes. detail: { value: number }
 * Helper Attribute: [x-behavior="rating"]
 */
export function rating(element: any, options?: {}): () => void;
export default rating;
//# sourceMappingURL=rating.d.ts.map