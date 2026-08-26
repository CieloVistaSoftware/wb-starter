// global.d.ts
export {};

declare global {
  // The WB surface, named. It used to be an anonymous object type inlined into
  // `interface Window`, which made it impossible to refer to from anywhere else.
  interface WBApi {
    version: string;
    readonly behaviors: Record<string, any>;
    inject(element: HTMLElement | string, behaviorName: string, options?: any): Promise<Function | null>;
    lazyInject(element: HTMLElement, behaviorName: string): void;
    remove(element: HTMLElement, behaviorName?: string | null): void;
    scan(root?: HTMLElement): Promise<void>;
    observe(root?: HTMLElement): MutationObserver;
    disconnect(): void;
    list(): string[];
    has(name: string): boolean;
    preload(names: string[]): Promise<void>;
    stats(): any;
    init(options?: any): Promise<any>;
    render(data: any, container?: HTMLElement | null): HTMLElement | HTMLElement[];
    Events: any;
    Theme: any;
    config: {
      get(key: string): any;
      set(key: string, value: any): void;
    };
  }

  // #840. Two separate reasons this line exists, both verified by probe:
  //
  // 1. `interface Window` members are NOT globals in TypeScript. Declaring
  //    `Window.WB` types `window.WB` and nothing else. A bare `WB.scan(el)` —
  //    how it is written inside `page.evaluate(() => { ... })` callbacks — was an
  //    unresolved name, therefore `any`.
  //
  // 2. It is deliberately typed `WBApi` and NOT `Window['WB']`. Four test files
  //    (tests/cards/card.spec.ts, card-product-behavior.spec.ts,
  //    cards-comprehensive.spec.ts, tests/pages/all-components.spec.ts) declare
  //    their own `interface Window { WB: any }`. Interface merging is global and
  //    project-wide, so those four collapse `window.WB` to `any` for EVERY file.
  //    Anchoring to WBApi keeps the bare global honest regardless.
  //
  // Why it matters: @typescript-eslint/no-floating-promises cannot see a promise
  // through `any`. With WB untyped the rule reports ZERO unawaited `WB.scan()`
  // calls — the exact defect #840 exists to prevent. Probed both ways: untyped,
  // the rule is silent on `WB.scan(document.body)`; typed, it reports it, and
  // still correctly stays silent on a deliberate `void WB.scan(...)`.
  //
  // Type-only. Emits nothing, changes no runtime behavior.
  var WB: WBApi;

  interface Window {
    WB: WBApi;
  }
}
