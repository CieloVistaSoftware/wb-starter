// Narrow typings for <wb-input> — replace ambient `any` uses with a focused API.

declare global {
  /** Programmatic API exposed for `wb-input` consumers */
  interface WBInputAPI {
    /** current string value (reflects inner native input) */
    value: string;
    /** focus the inner input */
    focus(): void;
    /** select the inner input's contents */
    select?(): void;
    /** clear the value (if clearable) */
    clear?(): void;
    /** set the value programmatically and optionally trigger input event */
    setValue?(v: string, triggerInput?: boolean): void;
    /** native HTMLInputElement when present */
    readonly inputElement?: HTMLInputElement | null;
    /** whether the control is currently in an error state */
    readonly invalid?: boolean;
  }

  interface HTMLElementTagNameMap {
    'wb-input': HTMLElement & { wbInput?: WBInputAPI; value?: string; readonly inputElement?: HTMLInputElement | null };
  }

  interface HTMLElement {
    /** backward-compatible attachment used in some legacy call-sites */
    wbInput?: WBInputAPI;
  }
}

export {};
