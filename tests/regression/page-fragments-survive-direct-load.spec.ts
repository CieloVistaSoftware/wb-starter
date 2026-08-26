import { test, expect } from '@playwright/test';
// @ts-ignore -- plain .mjs auditor, shipped so consuming sites can run it too
import { auditPageFragments, formatReport } from '../../scripts/audit-page-fragments.mjs';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * A page fragment opened directly must not render as a broken page
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Found on a site built from this starter. Opening a page file at its own URL:
 *
 *     https://cielovistasoftware.github.io/Ultrasonic/pages/shows.html
 *
 * rendered unstyled and sat on "Loading the schedule…" forever, because files
 * in pages/ are FRAGMENTS: index.html fetches and injects them, so they run
 * with the DOCUMENT's base URL and their paths are written for the site root.
 * Opened directly, every relative path resolves one directory too deep.
 *
 * The rule and its explanation live in scripts/audit-page-fragments.mjs. This
 * spec only points it at this repo's pages/ and fails on what it reports.
 *
 * WHY THE LOGIC IS NOT IN THIS FILE
 *
 * John asked for a test that catches this "for any site built from wb-starter"
 * — and a spec under tests/ guards only THIS repo. Consuming sites get the
 * whole repo through their `github:CieloVistaSoftware/wb-starter#vX` dependency,
 * so the auditor is runnable from their node_modules:
 *
 *     node node_modules/wb-starter/scripts/audit-page-fragments.mjs --dir .
 *
 * It exits 1 on violations, so it drops straight into a downstream gate.
 * Putting the rule in a spec here would have repeated the mistake this whole
 * class of bug keeps making: a gate aimed at a location the violations are
 * not in.
 *
 * WHY THIS IS STATIC, NOT A PAGE LOAD
 *
 * A runtime check against the dev server would pass no matter what the
 * fragments contain, because server.js auto-wraps /pages/*.html into the shell
 * when it serves them. It would be testing the wrapper. The bug exists only on
 * a static host, which is the one environment the test suite has no server for.
 */

test.describe('Page fragments survive being opened directly', () => {
  test('the audit is not vacuous — pages/ contains fragments', () => {
    const r = auditPageFragments();
    expect(r.scanned, `no .html files found in ${r.pagesDir}`).toBeGreaterThan(0);
    expect(r.fragments, `no fragments in ${r.pagesDir} — all files are full documents`).toBeGreaterThan(0);
  });

  test('every fragment with site-root resources redirects when opened alone', () => {
    const r = auditPageFragments();
    expect(
      r.unguarded.map((u) => `pages/${u.file}`),
      `\n\n${formatReport({ ...r, climbing: [], bareFetch: [] })}`,
    ).toEqual([]);
  });

  test("no fragment imports a module with '../', which escapes the site root", () => {
    // Separate from the above because a guard does NOT excuse this one: it
    // breaks the injected case too, and it fails silently — a module that
    // fails to import never runs, so the page keeps its placeholder and looks
    // slow rather than broken.
    const r = auditPageFragments();
    expect(
      r.climbing.map((c) => `pages/${c.file}`),
      `\n\n${formatReport({ ...r, unguarded: [], bareFetch: [] })}`,
    ).toEqual([]);
  });

  test('no unguarded fragment fetches a bare-relative URL', () => {
    // Same failure as a bare href and equally excused by a guard, but called
    // out separately because JS has the better remedy available: siteRoot(),
    // which makes the fragment work standalone instead of bouncing to the SPA.
    // That is the fix #766 chose for docs.html.
    const r = auditPageFragments();
    expect(
      r.bareFetch.map((b) => `pages/${b.file}`),
      `\n\n${formatReport({ ...r, unguarded: [], climbing: [] })}`,
    ).toEqual([]);
  });
});
