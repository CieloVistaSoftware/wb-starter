/**
 * Get applicable behaviors for a semantic tag
 */
declare function getApplicableBehaviors(tag: any): {
    name: string;
    attr: string;
    desc: string;
    icon: string;
    tags: string[];
    key: string;
}[];
/**
 * Show properties panel for semantic elements
 * Order: 1. Text Content, 2. Style, then other properties
 */
declare function showSemanticProperties(comp: any): void;
/**
 * Update semantic element text content
 */
declare function updateSemanticTextContent(componentId: any, text: any): void;
/**
 * Update semantic element inline style
 */
declare function updateSemanticStyle(componentId: any, styleString: any): void;
/**
 * Toggle a behavior on a semantic element
 */
declare function toggleSemanticBehavior(componentId: any, behaviorAttr: any, enabled: any): void;
/**
 * Update a behavior attribute value (e.g., tooltip text)
 */
declare function updateBehaviorValue(componentId: any, behaviorAttr: any, value: any): void;
/**
 * Update semantic element ID (no-op - IDs are static)
 */
declare function updateSemanticId(componentId: any, newId: any): void;
/**
 * Update semantic element CSS classes
 */
declare function updateSemanticClasses(componentId: any, classes: any): void;
/**
 * Get default content and styles for a semantic tag
 */
declare function getSemanticDefaults(tag: any): {
    defaultContent: string;
    defaultStyles: string;
};
/**
 * Add a semantic HTML element to the canvas
 */
declare function addSemanticElement(tag: any, section: any, itemInfo: any): void;
/**
 * Show component picker context menu on drop zone right-click
 */
declare function showSemanticContextMenu(e: any, dropZone: any): void;
declare namespace X_BEHAVIORS {
    namespace tooltip {
        let name: string;
        let attr: string;
        let desc: string;
        let icon: string;
        let tags: string[];
    }
    namespace copy {
        let name_1: string;
        export { name_1 as name };
        let attr_1: string;
        export { attr_1 as attr };
        let desc_1: string;
        export { desc_1 as desc };
        let icon_1: string;
        export { icon_1 as icon };
        let tags_1: string[];
        export { tags_1 as tags };
    }
    namespace toggle {
        let name_2: string;
        export { name_2 as name };
        let attr_2: string;
        export { attr_2 as attr };
        let desc_2: string;
        export { desc_2 as desc };
        let icon_2: string;
        export { icon_2 as icon };
        let tags_2: string[];
        export { tags_2 as tags };
    }
    namespace collapse {
        let name_3: string;
        export { name_3 as name };
        let attr_3: string;
        export { attr_3 as attr };
        let desc_3: string;
        export { desc_3 as desc };
        let icon_3: string;
        export { icon_3 as icon };
        let tags_3: string[];
        export { tags_3 as tags };
    }
    namespace ripple {
        let name_4: string;
        export { name_4 as name };
        let attr_4: string;
        export { attr_4 as attr };
        let desc_4: string;
        export { desc_4 as desc };
        let icon_4: string;
        export { icon_4 as icon };
        let tags_4: string[];
        export { tags_4 as tags };
    }
    namespace sticky {
        let name_5: string;
        export { name_5 as name };
        let attr_5: string;
        export { attr_5 as attr };
        let desc_5: string;
        export { desc_5 as desc };
        let icon_5: string;
        export { icon_5 as icon };
        let tags_5: string[];
        export { tags_5 as tags };
    }
    namespace scrollalong {
        let name_6: string;
        export { name_6 as name };
        let attr_6: string;
        export { attr_6 as attr };
        let desc_6: string;
        export { desc_6 as desc };
        let icon_6: string;
        export { icon_6 as icon };
        let tags_6: string[];
        export { tags_6 as tags };
    }
    namespace draggable {
        let name_7: string;
        export { name_7 as name };
        let attr_7: string;
        export { attr_7 as attr };
        let desc_7: string;
        export { desc_7 as desc };
        let icon_7: string;
        export { icon_7 as icon };
        let tags_7: string[];
        export { tags_7 as tags };
    }
    namespace resizable {
        let name_8: string;
        export { name_8 as name };
        let attr_8: string;
        export { attr_8 as attr };
        let desc_8: string;
        export { desc_8 as desc };
        let icon_8: string;
        export { icon_8 as icon };
        let tags_8: string[];
        export { tags_8 as tags };
    }
    namespace scrollProgress {
        let name_9: string;
        export { name_9 as name };
        let attr_9: string;
        export { attr_9 as attr };
        let desc_9: string;
        export { desc_9 as desc };
        let icon_9: string;
        export { icon_9 as icon };
        let tags_9: string[];
        export { tags_9 as tags };
    }
    namespace darkmode {
        let name_10: string;
        export { name_10 as name };
        let attr_10: string;
        export { attr_10 as attr };
        let desc_10: string;
        export { desc_10 as desc };
        let icon_10: string;
        export { icon_10 as icon };
        let tags_10: string[];
        export { tags_10 as tags };
    }
}
declare namespace SEMANTIC_ELEMENTS {
    namespace structure {
        let name_11: string;
        export { name_11 as name };
        export let items: {
            tag: string;
            icon: string;
            name: string;
            desc: string;
        }[];
    }
    namespace content {
        let name_12: string;
        export { name_12 as name };
        let items_1: {
            tag: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { items_1 as items };
    }
    namespace interactive {
        let name_13: string;
        export { name_13 as name };
        let items_2: {
            tag: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { items_2 as items };
    }
    namespace text {
        let name_14: string;
        export { name_14 as name };
        let items_3: {
            tag: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { items_3 as items };
    }
    namespace lists {
        let name_15: string;
        export { name_15 as name };
        let items_4: {
            tag: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { items_4 as items };
    }
    namespace media {
        let name_16: string;
        export { name_16 as name };
        let items_5: {
            tag: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { items_5 as items };
    }
}
//# sourceMappingURL=builder-semantic.d.ts.map