/**
 * #1139: the site reported three versions at once and none was the release:
 * the tab title read v4.0.0 then v4.0.1 (typed by hand into index.html and
 * config/site.json), the badge v4.0.4.4. A title can never carry a version it
 * cannot derive, so titles carry none; the badge is the one place the version
 * is shown, counted from git (scripts/stamp-version.js).
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';

const VERSIONISH = /\bv?\d+\.\d+(\.\d+)+\b/;

test('page titles and share titles carry no version number', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const re of [/<title>([^<]*)<\/title>/, /property="og:title" content="([^"]*)"/, /name="twitter:title" content="([^"]*)"/]) {
    const m = html.match(re);
    expect(m, `index.html has ${re}`).toBeTruthy();
    expect(m![1], `index.html ${re}`).not.toMatch(VERSIONISH);
  }
  const site = JSON.parse(fs.readFileSync('config/site.json', 'utf8'));
  const titles = JSON.stringify(site).match(/"pageTitle":"[^"]*"/g) || [];
  for (const t of titles) expect(t, 'config/site.json pageTitle').not.toMatch(VERSIONISH);
});
