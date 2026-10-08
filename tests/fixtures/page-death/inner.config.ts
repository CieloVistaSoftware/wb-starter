/**
 * The run tests/regression/page-death-diagnostics-name-the-cause.spec.ts starts
 * (#961): page-death.inner.ts, one worker, a JSON report, and no web server
 * (the pages are setContent()). Not part of any project in playwright.config.ts:
 * its tests fail on purpose.
 */
import { defineConfig } from '@playwright/test';

const OUT = process.env.WB_PAGE_DEATH_OUT || 'test-results/page-death-inner';

export default defineConfig({
  testDir: '.',
  testMatch: /page-death\.inner\.ts$/,
  outputDir: `${OUT}/output`,
  reporter: [['json', { outputFile: `${OUT}/report.json` }]],
  workers: 1,
  retries: 0,
  timeout: 30_000,
  use: { headless: true, trace: 'off', screenshot: 'off', video: 'off' },
});
