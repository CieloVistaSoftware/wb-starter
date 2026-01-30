/**
 * Timeline - Vertical timeline
 * Helper Attribute: [x-behavior="timeline"]
 */
export function timeline(element, options = {}) {
    // Logic removed - structure is now handled by ui-timeline.html template
    element.classList.add('wb-timeline');
    return () => element.classList.remove('wb-timeline');
}
export default timeline;
//# sourceMappingURL=timeline.js.map