#!/usr/bin/env node
/**
 * Prints the GitHub release notes for one version, from data/releases.json --
 * the same record the site's Releases page shows (#1182).
 *
 *   node scripts/release-notes.mjs 1.0.0
 *
 * Exits 1 when the version has no entry: a release without notes is a
 * mistake to stop on, not a page to publish empty.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEADINGS = { added: 'Added', changed: 'Changed', fixed: 'Fixed', removed: 'Removed' };

/** An item's HTML as Markdown text: its issue links become #N, other tags go. */
export function itemText(html) {
  return html
    .replace(/<a [^>]*href="[^"]*\/issues\/(\d+)"[^>]*>[^<]*<\/a>/g, '#$1')
    .replace(/<\/?strong>/g, '**')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

export function releaseNotes(version, data) {
  const release = data.releases.find((r) => r.version === version);
  if (!release) return null;
  const lines = [release.summary, ''];
  for (const [kind, heading] of Object.entries(HEADINGS)) {
    const items = release.items.filter((i) => i.kind === kind);
    if (!items.length) continue;
    lines.push(`## ${heading}`, '', ...items.map((i) => `- ${itemText(i.html)}`), '');
  }
  return lines.join('\n').trim() + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = process.argv[2];
  const data = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'releases.json'), 'utf8'));
  const notes = version && releaseNotes(version, data);
  if (!notes) {
    console.error(`release-notes: no entry for version "${version}" in data/releases.json`);
    process.exit(1);
  }
  process.stdout.write(notes);
}
