import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #390 / #304: pages/behaviors.html ("?page=behaviors") is meant to
 * showcase x-* attribute behaviors on plain/native elements — NOT full
 * wb-* custom component demos, which already have their own home
 * (pages/components.html, "Components Library"). It had drifted to mix
 * 12+ wb-* component demos in (x-alert, x-badge, x-progress,
 * x-spinner, x-modal, x-drawer, x-tabs, x-accordion, x-audio,
 * x-rating, x-switch), reported live twice by John and previously
 * filed as #304 but never fixed. Cleaned up (component demos removed,
 * section notes updated to point at Components instead) alongside this
 * test, which is the actual build-time gate preventing it drifting back.
 *
 * `<div x-demo>` itself and the header's single functional `<div x-themecontrol>`
 * (real UI chrome, not a demo of the behavior) are exempt.
 */
const EXEMPT_TAGS = new Set(['x-demo', 'x-themecontrol']);

test('behaviors.html contains no wb-* custom component demos', () => {
  const filePath = path.join(process.cwd(), 'pages', 'behaviors.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const tags = new Set<string>();
  for (const m of html.matchAll(/<(wb-[a-z0-9-]+)[\s/>]/gi)) {
    tags.add(m[1].toLowerCase());
  }
  const violations = [...tags].filter((t) => !EXEMPT_TAGS.has(t));
  expect(violations).toEqual([]);
});

test('newbehaviors.html (explicitly marked archived/unused) has been deleted, not left to rot', () => {
  const filePath = path.join(process.cwd(), 'pages', 'newbehaviors.html');
  expect(fs.existsSync(filePath)).toBe(false);
});
