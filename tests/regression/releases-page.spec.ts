import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * #1182: What's New showed a sentence ("Live on the site, but not in any
 * numbered release") where a version belonged, so "what is in 4.0.3?" had no
 * answer. John, 2026-09-29: "redo our what's new to change to releases and tell
 * for each release what was fixed or added."
 *
 * The Releases page renders data/releases.json. These tests hold the rules that
 * make it answer that question: every release is a real version, every item
 * says whether it added, fixed or changed something, and the old URL still
 * lands on the page.
 */
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'releases.json'), 'utf8'));
const KINDS = new Set(['added', 'fixed', 'changed']);

test.describe('Releases page (#1182)', () => {
  test('every release is a real version, and every item is added, fixed or changed', () => {
    expect(data.releases.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const r of data.releases) {
      expect(r.version, `"${r.version}" is not a version`).toMatch(/^\d+\.\d+\.\d+$/);
      expect(seen.has(r.version), `${r.version} is listed twice`).toBe(false);
      seen.add(r.version);
      expect(r.items.length, `${r.version} lists nothing`).toBeGreaterThan(0);
      for (const item of r.items) {
        expect(KINDS.has(item.kind), `${r.version}: kind "${item.kind}"`).toBe(true);
      }
    }
    for (const h of data.history || []) {
      for (const item of h.items) expect(KINDS.has(item.kind), `${h.label}: kind "${item.kind}"`).toBe(true);
    }
  });

  test('the next release entry lists changes, not CI follow-ups, and carries a written summary', () => {
    // A "CI on <sha>" commit repairs another commit in the same batch, so as an
    // item it only repeated that commit, vaguer. The 1.0.0 entry would have
    // opened with two of them.
    const out = execFileSync(process.execPath, ['scripts/release-entry.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
    const entry = JSON.parse(out);
    for (const item of entry.items) {
      expect(item.html, 'a CI follow-up commit became a release item').not.toMatch(/\bCI on [0-9a-f]{7,}/);
    }
    expect(entry.summary).toBe((data.unreleased && data.unreleased.summary) || '');
  });

  test('the package version is a listed release', () => {
    // Not "the newest": `npm run ship` writes the entry for the release it is
    // cutting BEFORE release.mjs bumps package.json, and the release gate runs
    // in between -- so during a release the newest entry is legitimately one
    // ahead. That exact check blocked the 1.0.0 release. What must always hold
    // is that the version the code declares is one the page describes.
    const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
    expect(data.releases.map((r: { version: string }) => r.version)).toContain(version);
  });

  test('the page shows one section per release, each headed by its version', async ({ page }) => {
    await page.goto('/?page=releases');
    const host = page.locator('#releases-list');
    await expect(host).toHaveAttribute('rendered', '1', { timeout: 15_000 });

    const versions = await page.locator('#releases-list .releases__release').evaluateAll(
      (els) => els.map((el) => ({
        version: el.getAttribute('version'),
        heading: (el.querySelector('h2')?.textContent || '').trim(),
      })),
    );
    expect(versions.map((v) => v.version)).toEqual(data.releases.map((r: { version: string }) => r.version));
    for (const v of versions) expect(v.heading.startsWith(v.version!), `heading "${v.heading}"`).toBe(true);
    await expect(page.locator('#releases-list .releases__release').first().locator('.releases__latest')).toHaveText('Live now');
  });

  test('the old What\'s New URL lands on Releases', async ({ page }) => {
    await page.goto('/?page=whats-new');
    await expect(page.locator('#releases-list')).toHaveAttribute('rendered', '1', { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.get('page')).toBe('releases');
  });

  test('search narrows the list to matching items', async ({ page }) => {
    await page.goto('/?page=releases');
    await expect(page.locator('#releases-list')).toHaveAttribute('rendered', '1', { timeout: 15_000 });
    // A term taken from what the page RENDERS, so the test follows the content
    // and searches for something a reader could actually type (#1369). It used
    // to come from the raw HTML in data/releases.json, which keeps entities:
    // "Keep&#39;s block" made the term "keep&#39;s block" while the page shows
    // "Keep's block", so nothing matched and the test failed on main whenever
    // the newest release item contained an apostrophe, quote or ampersand.
    const firstText = (await page.locator('#releases-list .releases__item').first().textContent()) || '';
    const term = firstText.replace(/\s+/g, ' ').trim().slice(0, 16).toLowerCase();
    expect(term.length, 'the first release item rendered no text to search for').toBeGreaterThan(3);
    await page.fill('#releases-search', term);
    const visible = page.locator('#releases-list .releases__item:visible');
    await expect(visible.first()).toBeVisible();
    const texts = await visible.allTextContents();
    expect(texts.length).toBeLessThan(await page.locator('#releases-list .releases__item').count());
    for (const text of texts) expect(text.toLowerCase()).toContain(term);
  });
});
