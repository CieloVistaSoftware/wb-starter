// Type augmentations for WB Framework

declare global {
  interface HTMLElement {
    wbCardExpandable?: WBCardExpandableAPI;
    wbCardMinimizable?: WBCardMinimizableAPI;
    wbCardDraggable?: WBCardDraggableAPI;
    wbPortfolio?: WBPortfolioAPI;
    wbCodeControl?: any;
    wbCollapse?: any;
    wbConfetti?: any;
    wbTypewriter?: any;
    wbCountup?: any;
    wbSparkle?: any;
    wbFireworks?: any;
    wbSnow?: any;
    wbForm?: any;
    wbToggle?: any;
    wbMdhtml?: any;
    wbVideo?: any;
    wbAudio?: any;
    wbDrawer?: any;
    wbOffcanvas?: any;
    wbSheet?: any;
    wbResizable?: any;
    wbStageLight?: any;
    wbSticky?: any;
    wbThemeControl?: any;
    wbNotes?: any;
    wbValidator?: any;
    wbVisible?: any;
    _wbTooltip?: any;
    _wbSpinnerInit?: boolean;
    _statusTimeout?: number;

    items?: any[];
  }
}

export {};
