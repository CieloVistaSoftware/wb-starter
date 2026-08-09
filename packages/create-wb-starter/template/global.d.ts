// global.d.ts
export {};

declare global {
  interface Window {
    WB: {
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
    };
  }
}
