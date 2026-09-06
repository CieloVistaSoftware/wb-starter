import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * #1030 — the chain John asked for: error log view → issue → Analysis / Test /
 * how to fix next time.
 *
 * Every piece existed and none of them connected:
 *
 *   1. `lookupFix()` in src/core/error-logger.js was fire-and-forget — on a miss
 *      it STARTED the fetch and returned null immediately, so the first errors on
 *      any page were always unenriched. Most pages log their errors during
 *      startup, so "the first errors" means most of them. Enrichment moved
 *      server-side, where data/fix-registry.json is a file on disk and there is
 *      no race to lose.
 *   2. Nothing rendered the issue number, so a reader could not get from a logged
 *      error to the recorded diagnosis. That is the middle arrow, and it was the
 *      one missing entirely.
 *   3. Rows written BEFORE a registry entry existed stayed null forever, so the
 *      log quietly misreported what was by then known. Enrichment therefore has
 *      to happen on READ as well as on write.
 *
 * These assert the chain end to end against the running server, because the
 * defect was never in any single piece — it was that they did not join up.
 */

const REGISTRY = 'data/fix-registry.json';
const KNOWN_SIGNATURE = 'replacement-guard|error|redundant-behavior-attribute';

const entries = JSON.parse(readFileSync(REGISTRY, 'utf8')).entries || {};

test.describe('#1030: a logged error reaches its recorded fix', () => {
  test('the registry entry this suite relies on is present and complete', () => {
    const known = entries[KNOWN_SIGNATURE];
    expect(known, `${REGISTRY} has no entry for "${KNOWN_SIGNATURE}" — the rest of this file would\n` +
      'pass vacuously without it, so it is asserted rather than assumed.').toBeTruthy();
    for (const field of ['analysis', 'solution', 'remedy', 'verify', 'issue']) {
      expect(known[field], `registry entry is missing "${field}"`).toBeTruthy();
    }
  });

  test('an appended error comes back carrying its analysis, solution, verify and issue', async ({ request }) => {
    const marker = `#1030 probe ${Date.now()}`;
    const append = await request.post('/api/error-log/append', {
      data: {
        error: {
          signature: KNOWN_SIGNATURE,
          message: marker,
          level: 'error',
          module: 'replacement-guard',
          timestamp: new Date().toISOString(),
        },
      },
    });
    expect(append.ok(), `append failed: ${append.status()}`).toBe(true);

    const read = await request.get('/data/errors.json');
    expect(read.ok(), `read failed: ${read.status()}`).toBe(true);
    const log = await read.json();

    const mine = (log.errors || []).find((e: any) => e.message === marker);
    expect(mine, 'the appended entry is not in the log').toBeTruthy();

    const known = entries[KNOWN_SIGNATURE];
    // The whole point of #1030: these arrived null while the registry held all
    // of them the entire time.
    expect(mine.analysis, 'analysis arrived null — the registry has one').toBe(known.analysis);
    expect(mine.solution, 'solution arrived null — the registry has one').toBe(known.solution);
    expect(mine.verify, 'verify arrived null — the registry has one').toBe(known.verify);
    expect(mine.fixable, 'fixable arrived false while the registry says true').toBe(known.fixable);
    expect(String(mine.issue), 'no issue number — the middle arrow of the chain').toBe(String(known.issue));
  });

  test('a row stored with nulls is enriched on READ, not only on write', async ({ request }) => {
    // Point 3: entries written before a registry entry existed must not stay
    // null forever. Appending with the fields EXPLICITLY null is the same shape
    // as a row already sitting in the log from before.
    const marker = `#1030 stale-row probe ${Date.now()}`;
    const append = await request.post('/api/error-log/append', {
      data: {
        error: {
          signature: KNOWN_SIGNATURE,
          message: marker,
          level: 'error',
          analysis: null,
          solution: null,
          verify: null,
          issue: null,
          fixable: false,
          timestamp: new Date().toISOString(),
        },
      },
    });
    expect(append.ok()).toBe(true);

    const log = await (await request.get('/data/errors.json')).json();
    const mine = (log.errors || []).find((e: any) => e.message === marker);
    expect(mine, 'the appended entry is not in the log').toBeTruthy();

    const known = entries[KNOWN_SIGNATURE];
    expect(mine.analysis, 'a null analysis was served back as null instead of being enriched on read').toBe(known.analysis);
    expect(mine.fixable, 'fixable:false was not corrected to the registry value on read').toBe(true);
    expect(String(mine.issue), 'issue stayed null on a row the registry can identify').toBe(String(known.issue));
  });

  test('an unknown signature is left alone rather than invented', async ({ request }) => {
    // The enrichment must not fabricate. A signature with no registry entry keeps
    // its nulls, and that is correct — otherwise the viewer would show a
    // diagnosis for an error nobody has diagnosed.
    const marker = `#1030 unknown probe ${Date.now()}`;
    await request.post('/api/error-log/append', {
      data: {
        error: {
          signature: `no-such-module|error|nothing-has-ever-diagnosed-this-${Date.now()}`,
          message: marker,
          level: 'error',
          timestamp: new Date().toISOString(),
        },
      },
    });

    const log = await (await request.get('/data/errors.json')).json();
    const mine = (log.errors || []).find((e: any) => e.message === marker);
    expect(mine, 'the appended entry is not in the log').toBeTruthy();
    expect(mine.analysis ?? null, 'an undiagnosed error was given an analysis it never had').toBeNull();
    expect(mine.issue ?? null, 'an undiagnosed error was given an issue number').toBeNull();
  });
});

test.describe('#1030: the viewer renders the issue as a link', () => {
  test('errors-viewer links the issue number to GitHub', () => {
    const viewer = readFileSync('public/errors-viewer.html', 'utf8');
    expect(
      /error\.issue/.test(viewer),
      'public/errors-viewer.html no longer reads error.issue, so the log cannot reach the issue —\n' +
      'that is the middle arrow of the chain and the piece #1030 said was missing entirely.',
    ).toBe(true);
    expect(
      /github\.com\/CieloVistaSoftware\/wb-starter\/issues\//.test(viewer),
      'the issue number is rendered but not linked to the issue.',
    ).toBe(true);
  });
});
