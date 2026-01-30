export function loadPropertyConfig(): Promise<any>;
export function getPropertyDef(propName: any, componentBehavior: any): any;
export function getDefaultValue(propName: any, componentBehavior: any): any;
export function getCategory(categoryName: any): any;
export function isCanvasEditable(propName: any, componentBehavior: any): boolean;
export function renderPropertyControl(wrapperId: any, propName: any, currentValue: any, componentBehavior: any): string;
export function renderPropertiesPanel(wrapper: any, panelElement: any, onChange?: any, scrollToProperty?: any): void;
export function renderDOMElementProperties(el: any, elKey: any, panelElement: any): void;
declare namespace _default {
    export { loadPropertyConfig };
    export { getPropertyDef };
    export { getDefaultValue };
    export { getCategory };
    export { isCanvasEditable };
    export { renderPropertyControl };
    export { renderPropertiesPanel };
    export { renderDOMElementProperties };
}
export default _default;
//# sourceMappingURL=builder-properties.d.ts.map