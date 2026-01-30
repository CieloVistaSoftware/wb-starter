/**
 * Stat - Statistic display
 * Helper Attribute: [x-behavior="stat"]
 */
export function stat(element, options = {}) {
    // Logic removed - structure is now handled by ui-stat.html template
    // This behavior now just marks the element as a stat component
    element.classList.add('wb-stat');
    return () => element.classList.remove('wb-stat');
}
export default stat;
//# sourceMappingURL=stat.js.map