// Narrow typings for <wb-form> — focused API to replace ambient `any` usages.

declare global {
  /** Programmatic API exposed on `wb-form` elements */
  interface WBFormAPI {
    /** Trigger a programmatic submit (honors validation handlers) */
    submit(options?: { validate?: boolean }): Promise<boolean>;
    /** Reset the form to initial values */
    reset(): void;
    /** Run validation and return whether the form is valid */
    validate(): boolean;
    /** Get form data as a plain object */
    getData(): Record<string, string>;
    /** Populate the form from an object */
    setData?(data: Record<string, string | number | boolean | null>): void;
    /** Native HTMLFormElement when present */
    readonly formElement?: HTMLFormElement | null;
    readonly valid?: boolean;
  }

  interface HTMLElementTagNameMap {
    'wb-form': HTMLElement & { wbForm?: WBFormAPI; formElement?: HTMLFormElement | null };
  }

  interface HTMLElement {
    wbForm?: WBFormAPI;
  }
}

export {};
