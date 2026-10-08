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
  // #1272: Playwright's git-info plugin defaults to ON in CI, and for a pull
  // request it fetches the base at --depth=1 into this same checkout, which
  // makes it shallow; releases-list-every-version then saw 2 commits of history
  // (1.0.401 holding all 1,687 items). The outer config turns it off; so must this.
  captureGitInfo: { commit: false, diff: false },
});
