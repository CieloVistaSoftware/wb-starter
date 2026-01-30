declare function showExamplesPageGuidance(): void;
/**
 * Initialize all enhancements
 */
declare function initBuilderEnhancements(): void;
/**
 * Check if a component type is a container
 * @param {string} componentType - The type to check
 * @returns {boolean}
 */
declare function isContainerType(componentType: string): boolean;
/**
 * Render container properties with embedded component browser
 * @param {HTMLElement} panel - The properties panel element
 * @param {Object} containerData - Data about the container
 */
declare function showContainerProperties(panel: HTMLElement, containerData: any): void;
/**
 * Get display info for container types
 */
declare function getContainerTypeInfo(type: any): any;
/**
 * Render list of currently nested components
 */
declare function renderNestedComponentsList(nestedComponents: any): any;
/**
 * Get component info from library
 */
declare function getComponentInfo(componentType: any): {
    icon: any;
    name: any;
};
/**
 * Render the component browser for containers
 */
declare function renderContainerComponentBrowser(containerId: any, searchTerm?: string): string;
/**
 * Render individual component items for the browser
 */
declare function renderComponentItems(components: any, containerId: any): string;
/**
 * Filter components in the container browser
 */
declare function filterContainerComponents(searchTerm: any): void;
/**
 * Add a component to a container
 */
declare function addComponentToContainer(containerId: any, componentType: any): void;
/**
 * Update the visual display of a container
 */
declare function updateContainerDisplay(comp: any): void;
/**
 * Update a container setting
 */
declare function updateContainerSetting(containerId: any, setting: any, value: any): void;
/**
 * Select a nested component for editing
 */
declare function selectNestedComponent(nestedId: any): void;
/**
 * Remove a nested component from its container
 */
declare function removeNestedFromContainer(nestedId: any): void;
declare namespace WB_COMPONENT_LIBRARY {
    export namespace layout {
        let name: string;
        let icon: string;
        let description: string;
        let components: {
            id: string;
            icon: string;
            name: string;
            desc: string;
        }[];
    }
    export namespace cards {
        let name_1: string;
        export { name_1 as name };
        let icon_1: string;
        export { icon_1 as icon };
        let description_1: string;
        export { description_1 as description };
        export namespace subcategories {
            namespace basic {
                let name_2: string;
                export { name_2 as name };
                let components_1: {
                    id: string;
                    icon: string;
                    name: string;
                    desc: string;
                }[];
                export { components_1 as components };
            }
            namespace content {
                let name_3: string;
                export { name_3 as name };
                let components_2: {
                    id: string;
                    icon: string;
                    name: string;
                    desc: string;
                }[];
                export { components_2 as components };
            }
            namespace commerce {
                let name_4: string;
                export { name_4 as name };
                let components_3: {
                    id: string;
                    icon: string;
                    name: string;
                    desc: string;
                }[];
                export { components_3 as components };
            }
            namespace interactive {
                let name_5: string;
                export { name_5 as name };
                let components_4: {
                    id: string;
                    icon: string;
                    name: string;
                    desc: string;
                }[];
                export { components_4 as components };
            }
            namespace special {
                let name_6: string;
                export { name_6 as name };
                let components_5: {
                    id: string;
                    icon: string;
                    name: string;
                    desc: string;
                }[];
                export { components_5 as components };
            }
        }
    }
    export namespace content_1 {
        let name_7: string;
        export { name_7 as name };
        let icon_2: string;
        export { icon_2 as icon };
        let description_2: string;
        export { description_2 as description };
        let components_6: {
            id: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { components_6 as components };
    }
    export { content_1 as content };
    export namespace interactive_1 {
        let name_8: string;
        export { name_8 as name };
        let icon_3: string;
        export { icon_3 as icon };
        let description_3: string;
        export { description_3 as description };
        let components_7: {
            id: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { components_7 as components };
    }
    export { interactive_1 as interactive };
    export namespace feedback {
        let name_9: string;
        export { name_9 as name };
        let icon_4: string;
        export { icon_4 as icon };
        let description_4: string;
        export { description_4 as description };
        let components_8: {
            id: string;
            icon: string;
            name: string;
            desc: string;
        }[];
        export { components_8 as components };
    }
}
declare namespace PAGE_TEMPLATES {
    namespace blank {
        export let id: string;
        let name_10: string;
        export { name_10 as name };
        let icon_5: string;
        export { icon_5 as icon };
        export let desc: string;
        export let defaultComponents: any[];
    }
    namespace home {
        let id_1: string;
        export { id_1 as id };
        let name_11: string;
        export { name_11 as name };
        let icon_6: string;
        export { icon_6 as icon };
        let desc_1: string;
        export { desc_1 as desc };
        let defaultComponents_1: string[];
        export { defaultComponents_1 as defaultComponents };
    }
    namespace about {
        let id_2: string;
        export { id_2 as id };
        let name_12: string;
        export { name_12 as name };
        let icon_7: string;
        export { icon_7 as icon };
        let desc_2: string;
        export { desc_2 as desc };
        let defaultComponents_2: string[];
        export { defaultComponents_2 as defaultComponents };
    }
    namespace contact {
        let id_3: string;
        export { id_3 as id };
        let name_13: string;
        export { name_13 as name };
        let icon_8: string;
        export { icon_8 as icon };
        let desc_3: string;
        export { desc_3 as desc };
        let defaultComponents_3: string[];
        export { defaultComponents_3 as defaultComponents };
    }
    namespace services {
        let id_4: string;
        export { id_4 as id };
        let name_14: string;
        export { name_14 as name };
        let icon_9: string;
        export { icon_9 as icon };
        let desc_4: string;
        export { desc_4 as desc };
        let defaultComponents_4: string[];
        export { defaultComponents_4 as defaultComponents };
    }
    namespace portfolio {
        let id_5: string;
        export { id_5 as id };
        let name_15: string;
        export { name_15 as name };
        let icon_10: string;
        export { icon_10 as icon };
        let desc_5: string;
        export { desc_5 as desc };
        let defaultComponents_5: string[];
        export { defaultComponents_5 as defaultComponents };
    }
    namespace faq {
        let id_6: string;
        export { id_6 as id };
        let name_16: string;
        export { name_16 as name };
        let icon_11: string;
        export { icon_11 as icon };
        let desc_6: string;
        export { desc_6 as desc };
        let defaultComponents_6: any[];
        export { defaultComponents_6 as defaultComponents };
    }
    namespace docs {
        let id_7: string;
        export { id_7 as id };
        let name_17: string;
        export { name_17 as name };
        let icon_12: string;
        export { icon_12 as icon };
        let desc_7: string;
        export { desc_7 as desc };
        let defaultComponents_7: any[];
        export { defaultComponents_7 as defaultComponents };
        export let isDocsPage: boolean;
        export let guidance: string;
    }
    namespace examples {
        let id_8: string;
        export { id_8 as id };
        let name_18: string;
        export { name_18 as name };
        let icon_13: string;
        export { icon_13 as icon };
        let desc_8: string;
        export { desc_8 as desc };
        let defaultComponents_8: any[];
        export { defaultComponents_8 as defaultComponents };
        export let isExamplesPage: boolean;
        let guidance_1: string;
        export { guidance_1 as guidance };
    }
}
declare class StatusBarManager {
    currentPage: any;
    templateUsed: string;
    rootPath: string;
    /**
     * Set the current page and update status bar
     * @param {Object} page - Page object with id, name, slug
     */
    setCurrentPage(page: any): void;
    /**
     * Set the template that created this site
     * @param {string} templateName - Name of template used
     */
    setTemplateUsed(templateName: string): void;
    /**
     * Get the relative URL from root
     * @param {string} slug - Page slug
     * @returns {string} Relative URL path
     */
    getRelativeUrl(slug: string): string;
    /**
     * Update the status bar display
     */
    updateDisplay(): void;
}
declare class SmartComponentBrowser {
    constructor(containerId: any);
    container: HTMLElement;
    searchTerm: string;
    expandedCategories: Set<string>;
    /**
     * Render the component browser with categories
     */
    render(): void;
    /**
     * Render a subcategory (like card types)
     */
    renderSubcategory(subId: any, subcat: any): string;
    /**
     * Render a list of components
     */
    renderComponents(components: any): string;
    /**
     * Search components
     */
    search(term: any): void;
    /**
     * Toggle category expansion
     */
    toggleCategory(catId: any): void;
    /**
     * Get count of components in a category
     */
    getCategoryCount(category: any): any;
    /**
     * Check if category matches search
     */
    categoryMatchesSearch(category: any): any;
    /**
     * Check if any component matches search
     */
    componentsMatchSearch(components: any): any;
    /**
     * Check if single component matches search
     */
    componentMatchesSearch(comp: any): any;
}
declare class PagesDropdownManager {
    constructor(containerId: any);
    container: HTMLElement;
    isOpen: boolean;
    /**
     * Render the pages dropdown
     * @param {Array} pages - Array of page objects
     * @param {string} currentPageId - Currently active page ID
     */
    render(pages: any[], currentPageId: string): void;
    /**
     * Toggle dropdown open/closed
     */
    toggle(): void;
    /**
     * Close dropdown
     */
    close(): void;
    /**
     * Select a page
     */
    selectPage(pageId: any): void;
    /**
     * Show add page dialog
     */
    showAddPageDialog(): void;
}
declare class DocsFileSelector {
    docsFolder: string;
    selectedFile: string;
    /**
     * Show file selector dialog for docs
     */
    show(): void;
    /**
     * Browse docs folder (simulated for now)
     */
    browse(): void;
    /**
     * Handle file click
     */
    handleFileClick(fileName: any, type: any): void;
    /**
     * Select the file
     */
    selectFile(): string;
}
declare const ENHANCEMENT_STYLES: "\n/* Pages Dropdown */\n.pages-dropdown {\n  position: relative;\n}\n\n.pages-dropdown-trigger {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem 1rem;\n  background: var(--bg-tertiary);\n  border: 1px solid var(--border-color);\n  border-radius: 6px;\n  cursor: pointer;\n  width: 100%;\n  font-size: 0.9rem;\n  color: var(--text-primary);\n}\n\n.pages-dropdown-trigger:hover {\n  border-color: var(--primary);\n}\n\n.pages-dropdown-menu {\n  position: absolute;\n  top: 100%;\n  left: 0;\n  right: 0;\n  background: var(--bg-secondary);\n  border: 1px solid var(--border-color);\n  border-radius: 6px;\n  margin-top: 0.25rem;\n  z-index: 100;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.3);\n  max-height: 300px;\n  overflow-y: auto;\n}\n\n.page-dropdown-item {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.6rem 0.75rem;\n  cursor: pointer;\n  font-size: 0.85rem;\n  transition: background 0.15s;\n}\n\n.page-dropdown-item:hover {\n  background: var(--bg-tertiary);\n}\n\n.page-dropdown-item.active {\n  background: rgba(16, 185, 129, 0.1);\n  color: #10b981;\n}\n\n.page-dropdown-item .page-url {\n  margin-left: auto;\n  font-size: 0.75rem;\n  color: var(--text-secondary);\n}\n\n.page-dropdown-item .page-delete-btn {\n  opacity: 0;\n  background: none;\n  border: none;\n  color: #ef4444;\n  cursor: pointer;\n  padding: 0.25rem;\n  font-size: 1rem;\n  line-height: 1;\n}\n\n.page-dropdown-item:hover .page-delete-btn {\n  opacity: 1;\n}\n\n.page-dropdown-divider {\n  border-top: 1px solid var(--border-color);\n  margin: 0.25rem 0;\n}\n\n.page-dropdown-item.add-page {\n  color: var(--primary);\n}\n\n/* Component Browser */\n.component-browser {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n}\n\n.browser-search input {\n  width: 100%;\n  padding: 0.6rem 0.75rem;\n  background: var(--bg-tertiary);\n  border: 1px solid var(--border-color);\n  border-radius: 6px;\n  color: var(--text-primary);\n  font-size: 0.9rem;\n}\n\n.browser-search input:focus {\n  outline: none;\n  border-color: var(--primary);\n}\n\n.browser-category {\n  background: var(--bg-tertiary);\n  border-radius: 6px;\n  overflow: hidden;\n}\n\n.category-header {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.75rem;\n  cursor: pointer;\n  user-select: none;\n}\n\n.category-header:hover {\n  background: rgba(99, 102, 241, 0.1);\n}\n\n.category-icon {\n  font-size: 1rem;\n}\n\n.category-name {\n  flex: 1;\n  font-weight: 600;\n  font-size: 0.85rem;\n}\n\n.category-count {\n  background: var(--bg-color);\n  padding: 0.15rem 0.5rem;\n  border-radius: 10px;\n  font-size: 0.7rem;\n  color: var(--text-secondary);\n}\n\n.category-arrow {\n  font-size: 0.7rem;\n  color: var(--text-secondary);\n}\n\n.category-content {\n  padding: 0.5rem;\n  background: var(--bg-secondary);\n}\n\n.browser-subcategory {\n  margin-bottom: 0.75rem;\n}\n\n.subcategory-header {\n  font-size: 0.7rem;\n  text-transform: uppercase;\n  color: var(--text-secondary);\n  padding: 0.25rem 0.5rem;\n  font-weight: 700;\n}\n\n.components-list {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 0.5rem;\n}\n\n.component-item {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem;\n  background: var(--bg-tertiary);\n  border: 1px solid var(--border-color);\n  border-radius: 4px;\n  cursor: move;\n  font-size: 0.8rem;\n  transition: all 0.2s;\n}\n\n.component-item:hover {\n  border-color: var(--primary);\n  background: rgba(99, 102, 241, 0.1);\n}\n\n.component-item .comp-icon {\n  font-size: 1rem;\n}\n\n.component-item .comp-name {\n  flex: 1;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n/* Status Bar Enhancements */\n.status-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.status-bar code {\n  font-family: 'Monaco', 'Menlo', monospace;\n}\n\n/* Modal Styles */\n.modal-overlay {\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: rgba(0, 0, 0, 0.7);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 10000;\n}\n\n.modal-dialog {\n  background: var(--bg-secondary);\n  border: 1px solid var(--border-color);\n  border-radius: 12px;\n  width: 90%;\n  max-width: 600px;\n  max-height: 85vh;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n}\n\n.modal-header {\n  padding: 1rem 1.5rem;\n  border-bottom: 1px solid var(--border-color);\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.modal-header h2 {\n  margin: 0;\n  font-size: 1.1rem;\n}\n\n.modal-close {\n  background: none;\n  border: none;\n  font-size: 1.5rem;\n  cursor: pointer;\n  color: var(--text-secondary);\n}\n\n.modal-body {\n  flex: 1;\n  overflow-y: auto;\n  padding: 1.5rem;\n}\n\n.modal-footer {\n  padding: 1rem 1.5rem;\n  border-top: 1px solid var(--border-color);\n  display: flex;\n  justify-content: flex-end;\n  gap: 0.75rem;\n}\n";
declare let statusBarManager: any;
declare let componentBrowser: any;
declare let pagesDropdown: any;
declare let docsFileSelector: any;
declare const CONTAINER_TYPES: string[];
declare const CONTAINER_BROWSER_STYLES: "\n/* Container Component Browser */\n.browser-component-item:hover {\n  border-color: var(--primary) !important;\n  background: rgba(99, 102, 241, 0.1) !important;\n}\n\n.nested-component-item:hover {\n  background: var(--bg-secondary) !important;\n}\n\n.nested-component-visual:hover {\n  background: rgba(99, 102, 241, 0.2) !important;\n}\n\n.container-component-list::-webkit-scrollbar {\n  width: 6px;\n}\n\n.container-component-list::-webkit-scrollbar-thumb {\n  background: var(--border-color);\n  border-radius: 3px;\n}\n\n.container-component-list::-webkit-scrollbar-thumb:hover {\n  background: var(--primary);\n}\n";
//# sourceMappingURL=builder-enhancements.d.ts.map