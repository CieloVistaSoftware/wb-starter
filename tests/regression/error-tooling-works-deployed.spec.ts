/**
 * THE ERROR TOOLING MUST WORK WHERE THE ERRORS HAPPEN
 * ===================================================
 * #1000 — John, on the deployed site:
 *   "copy doesn't copy and the entry is not in the error log"
 *   "cielovistasoftware.github.io/wb-starter/errors-viewer.html shows a 404"
 *
 * Three defects, one root cause: the error tooling assumed a live server and
 * degraded silently without one. Every part worked locally and failed on the
 * static deploy — the only place it matters, and it failed on the very day the
 * site was broken, leaving John transcribing an error out of a screenshot.
 *
 *   /errors-viewer.html          404      (server route only, #516)
 *   POST /api/error-log/append   405      (no endpoint on a static host)
 *   navigator.clipboard          rejects  (no fallback; label flashed "Failed")
 *
 * THIS SPEC POINTS AT THE DEPLOYED ORIGIN BY DEFAULT. A local run passes on all
 * three even when they are broken — that is exactly how they shipped. Override
 * with SMOKE_BASE_URL to check somewhere else.
 */

import { test, expect } from '@playwright/test';

const BASE = (process.env.SMOKE_BASE_URL || 'https://cielovistasoftware.github.io/wb-starter/').replace(/\/$/, '');

test.describe('error tooling on the deployed site (#1000)', () => {
  test('/errors-viewer.html resolves instead of 404ing', async ({ request }) => {
    const res = await request.get(`${BASE}/errors-viewer.html`, { maxRedirects: 5 });
    expect(
      res.status(),
      `${BASE}/errors-viewer.html returned ${res.status()} — this is the exact URL John opened`
    ).toBeLessThan(400);
  });

  test('it lands on the viewer, not a dead end', async ({ page }) => {
    await page.goto(`${BASE}/errors-viewer.html`, { waitUntil: 'domcontentloaded' });
    // The forwarder is allowed; ending up nowhere is not.
    await expect
      .poll(() => page.url(), { timeout: 15_000 })
      .toContain('errors-viewer');
    const body = (await page.locator('body').innerText()).trim();
    expect(body.length, 'the viewer rendered nothing').toBeGreaterThan(0);
  });

  test('an error is recorded even with no server API', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const m = await import('/wb-starter/src/core/error-logger.js').catch(() => null as any);
      if (!m) return { imported: false };

      // The append path is what returned 405 on this host. It must still leave a
      // record somewhere the viewer can read.
      const before = JSON.parse(localStorage.getItem('wb:error-log') || '{"errors":[]}').errors.length;
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'wb-test-probe-1000', filename: 'probe.js', lineno: 1 })
      );
      await new Promise((r) => setTimeout(r, 900));
      const after = JSON.parse(localStorage.getItem('wb:error-log') || '{"errors":[]}').errors;
      return {
        imported: true,
        grew: after.length > before,
        recorded: after.some((e: any) => JSON.stringify(e).includes('wb-test-probe-1000')),
        localOnly: typeof m.isLocalOnly === 'function' ? m.isLocalOnly() : null,
      };
    });

    expect(result.imported, 'error-logger.js must be reachable on the deployed site').toBe(true);
    expect(
      result.recorded,
      'the error was not recorded anywhere — this is "the entry is not in the error log"'
    ).toBe(true);
    expect(result.localOnly, 'a static host has no API, so logging must be local').toBe(true);
  });

  test('copy has a fallback when the clipboard API refuses', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

    const outcome = await page.evaluate(async () => {
      // Force the failure John hit: the async clipboard rejecting.
      const original = navigator.clipboard?.writeText;
      let fellBack = false;
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error('NotAllowedError: document not focused')) },
        });
        const originalExec = document.execCommand;
        document.execCommand = (cmd: string) => {
          if (cmd === 'copy') { fellBack = true; return true; }
          return originalExec.call(document, cmd);
        };
        const m = await import('/wb-starter/src/core/error-logger.js').catch(() => null as any);
        if (!m) return { imported: false, fellBack: false };
        window.dispatchEvent(
          new ErrorEvent('error', { message: 'wb-copy-probe-1000', filename: 'probe.js', lineno: 1 })
        );
        await new Promise((r) => setTimeout(r, 700));
        const btn = document.getElementById('x-error-copy') as HTMLElement | null;
        if (!btn) return { imported: true, noPanel: true, fellBack: false };
        btn.click();
        await new Promise((r) => setTimeout(r, 700));
        const box = document.getElementById('x-error-copy-fallback');
        return { imported: true, fellBack, offeredTextBox: !!box, label: btn.textContent?.trim() };
      } finally {
        if (original) {
          Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: original } });
        }
      }
    });

    if ((outcome as any).noPanel) {
      test.skip(true, 'no error panel rendered on this page — nothing to copy from');
    }
    expect(
      (outcome as any).fellBack || (outcome as any).offeredTextBox,
      'the clipboard API refused and nothing happened — no execCommand fallback and no visible text to copy by hand'
    ).toBe(true);
  });
});
