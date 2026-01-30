// Project-wide temporary augmentations to ease the TS migration.
// These are intentionally conservative *migration helpers* — please
// replace with narrow types (and remove) as each module is hardened.

declare global {
  // runtime-added props (narrow where possible)
  interface HTMLElement {
    _statusTimeout?: number;
    wbNotes?: any;
    wbDrawer?: any;
    wbPopover?: any;
    wbOffcanvas?: any;
    wbSheet?: any;
    wbResizable?: any;
    wbSticky?: any;
    wbThemeControl?: any;
    wbTooltip?: any;
    wbValidator?: any;
    /** Narrowed API for input behavior (replace any usages with this) */
    wbInput?: WBInputAPI;
    [key: string]: any;
  }

  // Many legacy call sites operate on Element/unknown — widen carefully
  interface Element {
    style: CSSStyleDeclaration;
    dataset: DOMStringMap;
    remove(): void;
    closest(selector: string): Element | null;
    matches(selector: string): boolean;
    focus(): void;
    // property-style handlers (many files use `.onclick = ...`)
    onclick?: (e?: any) => any;
    click(): void;
    disabled?: boolean;
    // some code uses .value on generic nodes (textarea/input). Prefer casting long-term.
    value?: string;
    offsetWidth?: number;
    offsetHeight?: number;
  }

  interface Event {
    // a number of handlers are typed as `Event` but rely on keyboard props
    key?: string;
    shiftKey?: boolean;
    // allow using `target` with common DOM helpers (short-term)
    target?: EventTarget & { value?: string; closest?: (s: string)=>Element | null };
  }

  interface EventTarget {
    // code frequently calls `.closest()` on event targets in the repo
    closest?: (selectors: string) => Element | null;
  }

  interface Window {
    WB?: any;
  }
}

export {};