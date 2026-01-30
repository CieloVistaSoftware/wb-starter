import { Page } from '@playwright/test';

/**
 * Wait up to `timeout` ms for selector to appear — fail fast if not found.
 * Use when preconditions indicate the element should be present immediately.
 */
export async function failFastSelector(page: Page, selector: string, timeout = 20000) {
  return page.waitForSelector(selector, { timeout });
}

/**
 * Assert the builder is ready (fast). Resolves quickly if ready, otherwise
 * rejects after `timeout` ms. Tests should call this at the start of a case
 * to fail fast when prerequisites aren't met.
 */
export async function assertBuilderReady(page: Page, timeout = 20000) {
  return page.waitForFunction(() => {
    try {
      // Prefer explicit readiness flag when available (faster and deterministic)
      if ((window as any).builderReady === true) return true;
      return typeof (window as any).addComponentToCanvas === 'function' || !!document.querySelector('.canvas-component');
    } catch (e) {
      return false;
    }
  }, undefined, { timeout });
}


