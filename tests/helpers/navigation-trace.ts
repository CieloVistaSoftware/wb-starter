/**
 * Record every main-frame navigation a test's page makes, and report them when
 * the test fails (#1311).
 *
 * "Execution context was destroyed, most likely because of a navigation" names
 * the symptom and hides the cause. Two specs fail with it only under load, and
 * the obvious culprit (a fragment page that redirects itself) was ruled out for
 * both. This makes the next occurrence say WHAT navigated -- the URL and when,
 * relative to the test's start -- in the CI log and the report, instead of
 * leaving it to be guessed.
 *
 * Usage, once per spec file:
 *   import { traceNavigations } from '../helpers/navigation-trace';
 *   traceNavigations(test);
 */
import type { TestType, Page, TestInfo } from '@playwright/test';

const logs = new WeakMap<Page, string[]>();

export function traceNavigations(test: TestType<any, any>): void {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const started = Date.now();
    const log: string[] = [];
    logs.set(page, log);
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) log.push(`+${Date.now() - started}ms ${frame.url()}`);
    });
  });

  test.afterEach(async ({ page }: { page: Page }, testInfo: TestInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const log = logs.get(page) || [];
    const text = log.length ? log.join('\n') : '(no main-frame navigation recorded)';
    // Printed so it lands in the CI log next to the failure, and attached so it
    // is in the HTML report too.
    console.log(`[#1311 navigation trace] ${testInfo.title}\n${text}`);
    await testInfo.attach('navigations', { body: text, contentType: 'text/plain' });
  });
}
