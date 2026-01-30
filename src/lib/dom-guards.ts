// Small, zero-dependency DOM type-guards used by automated fixes.
export function isHTMLElement(el: unknown): el is HTMLElement {
  return el instanceof HTMLElement;
}

export function isKeyboardEvent(e: unknown): e is KeyboardEvent {
  return !!e && typeof (e as any).key === 'string';
}

export function asInputElement(el: unknown): HTMLInputElement | HTMLTextAreaElement | null {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el;
  return null;
}
