/**
 * `npm start` step 1: bring the checkout up to the latest main from GitHub.
 *
 * John, 2026-10-02: "NPM Start should do a pull first every time?" -- yes. Port
 * 3000 serves the files on disk, so if they are behind main the badge and the
 * site are old code. Runs once per start, never on a timer.
 *
 * Same rules as the badge click (scripts/lib/pull-latest.mjs): only on branch
 * main, fast-forward only, uncommitted work is never touched. Skipped on CI and
 * on test servers (WB_NO_OPEN=1). Never fails the start: offline or refused,
 * it says why in one line and the server starts on what is there.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pullLatest } from './lib/pull-latest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.env.CI || process.env.WB_NO_OPEN === '1') {
  console.log('[pull-on-start] test or CI server: not pulling');
} else {
  console.log(`[pull-on-start] ${pullLatest(root).message}`);
}
