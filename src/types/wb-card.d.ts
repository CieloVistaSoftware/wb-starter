// Narrow typings for wb-card runtime APIs — replace temporary any in stages.
// Small, focused surface area for reviewers to validate behavior signatures.

declare global {
  /** API exposed on <element>.wbCardExpandable */
  interface WBCardExpandableAPI {
    expand(): void;
    collapse(): void;
    toggle(): void;
    readonly expanded: boolean | undefined;
  }

  /** API exposed on <element>.wbCardMinimizable */
  interface WBCardMinimizableAPI {
    toggle(): void;
    minimize(): void;
    expand(): void;
    readonly minimized: boolean | undefined;
  }

  /** API exposed on <element>.wbCardDraggable */
  interface WBCardDraggableAPI {
    setPosition(x: number, y: number): void;
    getPosition(): { x: number; y: number };
    reset(): void;
  }

  /** API exposed on portfolio-like cards */
  interface WBPortfolioAPI {
    setAvailability(status: string): void;
  }

  interface HTMLElement {
    wbCardExpandable?: WBCardExpandableAPI;
    wbCardMinimizable?: WBCardMinimizableAPI;
    wbCardDraggable?: WBCardDraggableAPI;
    wbPortfolio?: WBPortfolioAPI;
  }
}

export {};
