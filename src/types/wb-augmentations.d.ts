// Project-wide temporary augmentations to ease the TS migration.
// Narrow, explicit declarations are preferable long-term; this file
// contains conservative, well-scoped augmentations used during the
// migration to reduce noise and allow incremental fixes.

declare global {
  interface HTMLElement {
    // commonly-added runtime properties used across the codebase
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

    // allow short-term indexing for migration convenience
    [key: string]: any;
  }

  interface Window {
    WB?: any;
  }
}

export {};