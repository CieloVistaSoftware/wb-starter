/**
 * EVERY WHAT'S NEW VERSION IS A RELEASE
 * =====================================
 * #1182. The What's New table showed "Live on the site, but not in any numbered
 * release" in its Version column for seven fixes. The page script turns every
 * <section id="whats-new-…"> into rows and uses its <h2> as the Version, and a
 * hand-written <section id="whats-new-unreleased"> added after 4.0.2 was never
 * folded into a release: scripts/whats-new-entry.mjs inserted 4.0.3 ABOVE it,
 * and it survived 4.0.3, 4.0.4 and 4.0.5 claiming nothing contained work that
 * 4.0.3 had shipped (tag v4.0.3 contains 855afef1).
 *
 * Two guards:
 *  1. The page: every section is a numbered release whose heading starts with
 *     its version -- except, at most, ONE unreleased section, and only above the
 *     newest release (between releases is the only time it can be true).
 *  2. The writer, RUN rather than read (#1049: a check that greps for a phrase
 *     passes on code that no longer does anything): in a throwaway repository
 *     this test creates, cutting a release folds the unreleased section's
 *     entries into the new version and removes the section.
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE = path.join(REPO, 'pages', 'whats-new.html');

function sections(html: string) {
  return [...html.matchAll(/<section id="(whats-new-[^"]+)">\s*<h2>([^<]*)<\/h2>/g)]
    .map((m) => ({ id: m[1], heading: m[2].trim() }));
}

test('#1182 — every What\'s New section is a numbered release (at most one unreleased section, on top)', () => {
  const found = sections(fs.readFileSync(PAGE, 'utf8'));
  expect(found.length, 'the page lost its release sections').toBeGreaterThan(3);

  const unreleased = found.filter((s) => s.id === 'whats-new-unreleased');
  expect(unreleased.length, 'more than one unreleased section').toBeLessThanOrEqual(1);
  if (unreleased.length) {
    expect(found[0].id, 'an unreleased section may only sit above the newest release — below one, that release already shipped it')
      .toBe('whats-new-unreleased');
  }

  // The table takes the Version from the start of the heading, so every heading
  // must START with a version. Sections from before release tags existed keep
  // their date ids (they are anchors) but are headed with the package.json
  // version of their day, which is the first version containing that work.
  for (const s of found.filter((x) => x.id !== 'whats-new-unreleased')) {
    const headed = s.heading.match(/^(\d+)\.(\d+)\.(\d+)\b/);
    expect(headed, `section ${s.id} is headed "${s.heading}", which does not start with a version`).not.toBeNull();
    const datedId = /^whats-new-\d{4}-\d{2}-(\d{2}|1x)$/.test(s.id);
    const byId = datedId ? null : s.id.match(/^whats-new-(\d{1,3})-(\d{1,3})-(\d{1,3})$/);
    if (byId) {
      expect(`${headed![1]}.${headed![2]}.${headed![3]}`, `section ${s.id} is headed with a different version`)
        .toBe(`${byId[1]}.${byId[2]}.${byId[3]}`);
    } else {
      expect(datedId, `section "${s.id}" is neither a release nor a dated legacy section`).toBe(true);
    }
  }
});

test('#1182 — the table reads a Version only from a version, never from a date or prose', () => {
  const html = fs.readFileSync(PAGE, 'utf8');
  const script = html.slice(html.indexOf('const heading = text('), html.indexOf('const date ='));
  const versionRe = script.match(/heading\.match\((\/[^\n]+\/)\)/);
  expect(versionRe, 'the version-parsing line moved; update this test').not.toBeNull();
  // Rebuild the page's own parsing expression so this test exercises it, not a copy.
  const parse = new Function('heading', `return (heading.match(${versionRe![1]}) || [, ''])[1];`) as (h: string) => string;
  expect(parse('4.0.3 — 2026-09-12')).toBe('4.0.3');
  expect(parse('2026-08-19'), 'a date must not become Version "2026"').toBe('');
  expect(parse('Live on the site, but not in any numbered release'), 'prose must not become a Version').toBe('');
});

test('#1182 — cutting a release folds the unreleased section into it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-whatsnew-'));
  try {
    const g = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
    fs.mkdirSync(path.join(dir, 'scripts'));
    fs.mkdirSync(path.join(dir, 'pages'));
    fs.copyFileSync(path.join(REPO, 'scripts', 'whats-new-entry.mjs'), path.join(dir, 'scripts', 'whats-new-entry.mjs'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fold-probe', version: '1.0.0', type: 'module' }));
    fs.writeFileSync(path.join(dir, 'pages', 'whats-new.html'), [
      '<section id="whats-new-unreleased">',
      '  <h2>Live on the site, but not in any numbered release</h2>',
      '  <ul id="whats-new-unreleased-list">',
      '    <li id="whats-new-unreleased-list-item-1" class="wn-item wn-bug"><span class="wn-tag">Bug</span> <strong>Hand-written one.</strong> No closing tag, as on the real page.',
      '',
      '    <li id="whats-new-unreleased-list-item-2" class="wn-item wn-new"><span class="wn-tag">New</span> <strong>Hand-written two.</strong></li>',
      '  </ul>',
      '</section>',
      '',
      '<section id="whats-new-1-0-0">',
      '  <h2>1.0.0 — 2026-01-01</h2>',
      '  <ul id="whats-new-1-0-0-list"></ul>',
      '</section>',
      '',
    ].join('\n'));
    g('init', '-q');
    g('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A');
    g('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'release: 1.0.0');
    g('tag', 'v1.0.0');
    fs.writeFileSync(path.join(dir, 'change.txt'), 'x');
    g('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A');
    g('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'fix(#1): a committed fix');

    execFileSync(process.execPath, [path.join(dir, 'scripts', 'whats-new-entry.mjs')], { cwd: dir, stdio: 'pipe' });

    const html = fs.readFileSync(path.join(dir, 'pages', 'whats-new.html'), 'utf8');
    const found = sections(html);
    expect(found.map((s) => s.id), 'the unreleased section survived the release').not.toContain('whats-new-unreleased');
    expect(found[0].id).toBe('whats-new-1-0-1');
    const newest = html.slice(html.indexOf('<section id="whats-new-1-0-1">'), html.indexOf('</section>', html.indexOf('<section id="whats-new-1-0-1">')));
    expect(newest).toContain('A committed fix');
    expect(newest, 'folded entries must land in the release that shipped them').toContain('Hand-written one.');
    expect(newest).toContain('Hand-written two.');
    expect((newest.match(/<li id="/g) || []).length, 'every entry is a list item').toBe(3);
    expect((newest.match(/<\/li>/g) || []).length, 'every entry is closed').toBe(3);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
